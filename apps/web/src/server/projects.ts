import type { Project } from '@todon/shared';

import { BadRequestError, NotFoundError } from '@/lib/http';
import { mapTask } from '@/lib/mappers';
import { prisma } from '@/lib/prisma';

import { taskInclude } from './task-queries';

function mapProject(
  row: { id: string; userId: string; name: string; description: string | null; color: string | null; createdAt: Date; updatedAt: Date },
  taskCount?: number,
): Project {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description,
    color: row.color,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    taskCount,
  };
}

export async function listProjects(userId: string) {
  const rows = await prisma.project.findMany({
    where: { userId },
    include: { _count: { select: { tasks: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  return rows.map((r) => mapProject(r, r._count.tasks));
}

export async function getProject(userId: string, projectId: string) {
  const row = await prisma.project.findFirst({
    where: { id: projectId, userId },
    include: {
      _count: { select: { tasks: true } },
      tasks: {
        where: { deletedAt: null, archivedAt: null },
        orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
        include: taskInclude,
      },
    },
  });

  if (!row) {
    throw new NotFoundError('プロジェクトが見つかりません');
  }

  return {
    ...mapProject(row, row._count.tasks),
    tasks: row.tasks.map(mapTask),
  };
}

export async function createProject(
  userId: string,
  input: { name: string; description?: string | null; color?: string | null },
) {
  const name = input.name.trim();
  if (!name) {
    throw new BadRequestError('プロジェクト名を入力してください');
  }

  const row = await prisma.project.create({
    data: {
      userId,
      name,
      description: input.description ?? null,
      color: input.color ?? null,
    },
  });

  return mapProject(row, 0);
}
