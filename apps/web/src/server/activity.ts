import type { TaskActivityLog } from '@todon/shared';

import { mapUser } from '@/lib/mappers';
import { prisma } from '@/lib/prisma';

import { requireTaskAccess } from './team-access';

export async function logTaskActivity(params: {
  taskId: string;
  userId: string;
  action: string;
  before?: string | null;
  after?: string | null;
}) {
  await prisma.taskActivityLog.create({
    data: {
      taskId: params.taskId,
      userId: params.userId,
      action: params.action,
      before: params.before ?? null,
      after: params.after ?? null,
    },
  });
}

export async function listTaskActivity(userId: string, taskId: string) {
  await requireTaskAccess(userId, taskId);

  const rows = await prisma.taskActivityLog.findMany({
    where: { taskId },
    include: {
      user: { select: { id: true, email: true, name: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return rows.map(
    (row): TaskActivityLog => ({
      id: row.id,
      taskId: row.taskId,
      userId: row.userId,
      action: row.action,
      before: row.before,
      after: row.after,
      createdAt: row.createdAt.toISOString(),
      user: mapUser(row.user),
    }),
  );
}
