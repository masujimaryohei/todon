import type { TaskComment } from '@todon/shared';

import { BadRequestError } from '@/lib/http';
import { mapUser } from '@/lib/mappers';
import { prisma } from '@/lib/prisma';

import { logTaskActivity } from './activity';
import { requireTaskAccess, requireTaskEdit } from './team-access';

export async function listTaskComments(userId: string, taskId: string) {
  await requireTaskAccess(userId, taskId);

  const rows = await prisma.taskComment.findMany({
    where: { taskId },
    include: {
      user: { select: { id: true, email: true, name: true, createdAt: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return rows.map(
    (row): TaskComment => ({
      id: row.id,
      taskId: row.taskId,
      userId: row.userId,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      user: mapUser(row.user),
    }),
  );
}

export async function createTaskComment(userId: string, taskId: string, body: string) {
  await requireTaskAccess(userId, taskId);

  const trimmed = body.trim();
  if (!trimmed) {
    throw new BadRequestError('コメントを入力してください');
  }

  const row = await prisma.taskComment.create({
    data: {
      taskId,
      userId,
      body: trimmed,
    },
    include: {
      user: { select: { id: true, email: true, name: true, createdAt: true } },
    },
  });

  await logTaskActivity({
    taskId,
    userId,
    action: 'comment_added',
    after: trimmed.slice(0, 120),
  });

  return {
    id: row.id,
    taskId: row.taskId,
    userId: row.userId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    user: mapUser(row.user),
  } satisfies TaskComment;
}

export async function deleteTaskComment(userId: string, commentId: string) {
  const comment = await prisma.taskComment.findUnique({ where: { id: commentId } });
  if (!comment) {
    throw new BadRequestError('コメントが見つかりません');
  }

  await requireTaskEdit(userId, comment.taskId);

  if (comment.userId !== userId) {
    await requireTaskEdit(userId, comment.taskId);
  }

  await prisma.taskComment.delete({ where: { id: commentId } });

  await logTaskActivity({
    taskId: comment.taskId,
    userId,
    action: 'comment_deleted',
  });
}
