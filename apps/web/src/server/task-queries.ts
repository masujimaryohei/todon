import type { TaskWithPeople } from '@todon/shared';

import { mapTask, mapUser } from '@/lib/mappers';
import { prisma } from '@/lib/prisma';

export const taskInclude = {
  category: true,
  project: true,
  subtasks: {
    orderBy: { sortOrder: 'asc' as const },
  },
} as const;

const userSelect = { id: true, email: true, name: true, createdAt: true } as const;

export async function fetchTaskDetail(taskId: string) {
  return prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
    include: {
      ...taskInclude,
      team: { select: { id: true, name: true } },
    },
  });
}

export async function enrichTaskWithPeople(
  row: Parameters<typeof mapTask>[0] & { ownerId: string; assigneeId: string | null },
): Promise<TaskWithPeople> {
  const owner = await prisma.user.findUnique({ where: { id: row.ownerId }, select: userSelect });
  const assignee = row.assigneeId
    ? await prisma.user.findUnique({ where: { id: row.assigneeId }, select: userSelect })
    : null;

  return {
    ...mapTask(row),
    owner: owner ? mapUser(owner) : null,
    assignee: assignee ? mapUser(assignee) : null,
  };
}

export function mapTaskRows(rows: Parameters<typeof mapTask>[0][]) {
  return rows.map((row) => mapTask(row));
}
