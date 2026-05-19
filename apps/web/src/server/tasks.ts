import type { Task as PrismaTask } from '@prisma/client';
import type { RepeatType } from '@todon/shared';

import { BadRequestError, ForbiddenError, NotFoundError } from '@/lib/http';
import { mapSubTask, mapTask } from '@/lib/mappers';
import { prisma } from '@/lib/prisma';

const taskInclude = {
  category: true,
  subtasks: {
    orderBy: { sortOrder: 'asc' as const },
  },
} as const;

async function fetchTaskOwned(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      userId,
      deletedAt: null,
    },
    include: taskInclude,
  });

  return task ? mapTask(task) : null;
}

export async function listTasks(userId: string, archived: boolean) {
  const rows = await prisma.task.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(archived ? { archivedAt: { not: null } } : { archivedAt: null }),
    },
    orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
    include: taskInclude,
  });
  return rows.map((row) => mapTask(row));
}

export async function getTask(userId: string, taskId: string) {
  const task = await fetchTaskOwned(userId, taskId);
  if (!task) {
    throw new NotFoundError('タスクが見つかりません');
  }

  return task;
}

function repeatFieldsFromInput(input: {
  repeatType?: RepeatType;
  repeatIntervalDays?: number | null;
  flexibleMinDays?: number | null;
  flexibleMaxDays?: number | null;
  dueType?: string;
}) {
  const repeatType = input.repeatType ?? 'none';

  if (repeatType === 'fixed') {
    return {
      repeatType,
      repeatIntervalDays: input.repeatIntervalDays ?? 7,
      flexibleMinDays: null,
      flexibleMaxDays: null,
      dueType: input.dueType ?? 'datetime',
    };
  }

  if (repeatType === 'flexible') {
    return {
      repeatType,
      repeatIntervalDays: null,
      flexibleMinDays: input.flexibleMinDays ?? 2,
      flexibleMaxDays: input.flexibleMaxDays ?? 4,
      dueType: 'flexible',
    };
  }

  return {
    repeatType: 'none' as const,
    repeatIntervalDays: null,
    flexibleMinDays: null,
    flexibleMaxDays: null,
  };
}

function buildRepeatCompletionPatch(existing: PrismaTask) {
  const now = new Date();

  if (existing.repeatType === 'none') {
    return { lastCompletedAt: now, status: 'done' };
  }

  const base = {
    lastCompletedAt: now,
    status: 'todo',
    flexibleSkipCount: 0,
  };

  if (existing.repeatType === 'fixed') {
    const days = existing.repeatIntervalDays ?? 7;
    const nextDue = new Date(now);
    nextDue.setUTCDate(nextDue.getUTCDate() + days);

    return {
      ...base,
      dueType: 'datetime',
      dueAt: nextDue,
    };
  }

  if (existing.repeatType === 'flexible') {
    return {
      ...base,
      dueType: 'flexible',
    };
  }

  return { lastCompletedAt: now };
}

async function getActiveTask(userId: string, taskId: string) {
  const task = await getTask(userId, taskId);
  if (task.archivedAt) {
    throw new BadRequestError('このタスクはアーカイブ済みです');
  }

  return task;
}

export async function createTask(
  userId: string,
  input: {
    title: string;
    description?: string | null;
    status?: string;
    dueType?: string;
    dueAt?: Date | null;
    importance?: string;
    urgency?: string;
    weight?: string;
    categoryId?: string | null;
    repeatType?: RepeatType;
    repeatIntervalDays?: number | null;
    flexibleMinDays?: number | null;
    flexibleMaxDays?: number | null;
  },
) {
  const repeat = repeatFieldsFromInput(input);

  if (input.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: input.categoryId, userId },
    });
    if (!category) {
      throw new ForbiddenError('カテゴリが見つかりません');
    }
  }

  const row = await prisma.task.create({
    data: {
      userId,
      ownerId: userId,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? 'todo',
      dueType: repeat.dueType ?? input.dueType ?? 'none',
      dueAt: input.dueAt ?? null,
      importance: input.importance ?? 'medium',
      urgency: input.urgency ?? 'medium',
      weight: input.weight ?? 'normal',
      categoryId: input.categoryId ?? null,
      repeatType: repeat.repeatType,
      repeatIntervalDays: repeat.repeatIntervalDays,
      flexibleMinDays: repeat.flexibleMinDays,
      flexibleMaxDays: repeat.flexibleMaxDays,
      scope: 'personal',
    },
    include: taskInclude,
  });

  return mapTask(row);
}

export async function updateTask(
  userId: string,
  taskId: string,
  patch: Partial<{
    title: string;
    description: string | null;
    status: string;
    dueType: string;
    dueAt: Date | null;
    importance: string;
    urgency: string;
    weight: string;
    categoryId: string | null;
    repeatType?: string;
    repeatIntervalDays?: number | null;
    flexibleMinDays?: number | null;
    flexibleMaxDays?: number | null;
    archivedAt?: Date | null;
    deletedAt?: Date | null;
  }>,
) {
  const existing = await prisma.task.findFirst({ where: { id: taskId, userId, deletedAt: null } });
  if (!existing) {
    throw new NotFoundError('タスクが見つかりません');
  }

  if (existing.archivedAt) {
    throw new BadRequestError('アーカイブ済みのタスクは編集できません');
  }

  if (patch.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: patch.categoryId, userId },
    });
    if (!category) {
      throw new ForbiddenError('カテゴリが見つかりません');
    }
  }

  const completing =
    patch.status === 'done' && existing.status !== 'done';

  const repeatPatch =
    patch.repeatType !== undefined
      ? repeatFieldsFromInput({
          repeatType: patch.repeatType as RepeatType,
          repeatIntervalDays: patch.repeatIntervalDays,
          flexibleMinDays: patch.flexibleMinDays,
          flexibleMaxDays: patch.flexibleMaxDays,
          dueType: patch.dueType,
        })
      : null;

  const row = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.status !== undefined && !completing ? { status: patch.status } : {}),
      ...(patch.dueType !== undefined ? { dueType: patch.dueType } : {}),
      ...(patch.dueAt !== undefined ? { dueAt: patch.dueAt } : {}),
      ...(patch.importance !== undefined ? { importance: patch.importance } : {}),
      ...(patch.urgency !== undefined ? { urgency: patch.urgency } : {}),
      ...(patch.weight !== undefined ? { weight: patch.weight } : {}),
      ...(patch.categoryId !== undefined ? { categoryId: patch.categoryId } : {}),
      ...(patch.archivedAt !== undefined ? { archivedAt: patch.archivedAt } : {}),
      ...(patch.deletedAt !== undefined ? { deletedAt: patch.deletedAt } : {}),
      ...(repeatPatch
        ? {
            repeatType: repeatPatch.repeatType,
            repeatIntervalDays: repeatPatch.repeatIntervalDays,
            flexibleMinDays: repeatPatch.flexibleMinDays,
            flexibleMaxDays: repeatPatch.flexibleMaxDays,
          }
        : {}),
      ...(completing ? buildRepeatCompletionPatch(existing) : {}),
    },
    include: taskInclude,
  });

  return mapTask(row);
}

export async function archiveTask(userId: string, taskId: string) {
  await getActiveTask(userId, taskId);

  const row = await prisma.task.update({
    where: { id: taskId },
    data: { archivedAt: new Date(), updatedAt: new Date() },
    include: taskInclude,
  });

  return mapTask(row);
}

export async function deleteArchivedTask(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId, deletedAt: null },
  });

  if (!task) {
    throw new NotFoundError('タスクが見つかりません');
  }

  if (!task.archivedAt) {
    throw new BadRequestError('アーカイブ済みのタスクのみ削除できます');
  }

  const row = await prisma.task.update({
    where: { id: taskId },
    data: { deletedAt: new Date() },
    include: taskInclude,
  });

  return mapTask(row);
}

export async function createSubtask(userId: string, taskId: string, title: string) {
  await getActiveTask(userId, taskId);

  const last = await prisma.subTask.findFirst({
    where: { taskId },
    orderBy: { sortOrder: 'desc' },
  });

  const nextOrder = last ? last.sortOrder + 1 : 0;

  const row = await prisma.subTask.create({
    data: {
      taskId,
      title,
      sortOrder: nextOrder,
    },
  });

  return mapSubTask(row);
}

export async function updateSubtask(
  userId: string,
  subtaskId: string,
  patch: Partial<{ title: string; completed: boolean; order: number }>,
) {
  const subtask = await prisma.subTask.findFirst({
    where: { id: subtaskId },
    include: {
      task: true,
    },
  });

  if (!subtask || subtask.task.userId !== userId || subtask.task.deletedAt) {
    throw new NotFoundError('サブタスクが見つかりません');
  }

  if (subtask.task.archivedAt) {
    throw new BadRequestError('アーカイブ済みタスクは編集できません');
  }

  const row = await prisma.subTask.update({
    where: { id: subtaskId },
    data: {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.completed !== undefined ? { completed: patch.completed } : {}),
      ...(patch.order !== undefined ? { sortOrder: patch.order } : {}),
      updatedAt: new Date(),
    },
  });

  return mapSubTask(row);
}

export async function skipFlexibleTask(userId: string, taskId: string) {
  const existing = await prisma.task.findFirst({
    where: { id: taskId, userId, deletedAt: null, archivedAt: null },
  });

  if (!existing) {
    throw new NotFoundError('タスクが見つかりません');
  }

  if (existing.repeatType !== 'flexible') {
    throw new BadRequestError('だいたいリピートのタスクのみスキップできます');
  }

  const row = await prisma.task.update({
    where: { id: taskId },
    data: {
      flexibleSkipCount: { increment: 1 },
      updatedAt: new Date(),
    },
    include: taskInclude,
  });

  return mapTask(row);
}
