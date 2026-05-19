import type { Task as PrismaTask } from '@prisma/client';
import type { DashboardPayload, FlexibleTaskView, Task } from '@todon/shared';
import { buildDashboardSuggestion } from '@todon/shared';

import { startOfUtcDay } from '@/lib/date';
import { mapTask } from '@/lib/mappers';
import { prisma } from '@/lib/prisma';

import { getTodayCapacity } from './capacity';
import { pickFlexibleTasksForToday } from './flexible-tasks';
import { listMyAssignedTeamTasks } from './team-tasks';

const taskInclude = {
  category: true,
  subtasks: {
    orderBy: { sortOrder: 'asc' as const },
  },
} as const;

type TaskRow = PrismaTask & {
  category?: Parameters<typeof mapTask>[0]['category'];
  subtasks?: Parameters<typeof mapTask>[0]['subtasks'];
};

function mapRows(list: TaskRow[]) {
  return list.map((row) => mapTask(row));
}

export async function buildDashboard(userId: string, nowInput = new Date()): Promise<DashboardPayload> {
  const rows = await prisma.task.findMany({
    where: { userId, deletedAt: null, archivedAt: null },
    include: taskInclude,
  });

  const open = rows.filter((t) => !['done', 'canceled'].includes(t.status));
  const capacity = await getTodayCapacity(userId, nowInput);
  const startToday = startOfUtcDay(nowInput);
  const endToday = new Date(startToday);
  endToday.setUTCDate(endToday.getUTCDate() + 1);

  const soonEnd = new Date(startToday);
  soonEnd.setUTCDate(soonEnd.getUTCDate() + 7);

  const pendingThreshold = new Date(nowInput);
  pendingThreshold.setUTCDate(pendingThreshold.getUTCDate() - 7);

  const anytimeThreshold = new Date(nowInput);
  anytimeThreshold.setUTCDate(anytimeThreshold.getUTCDate() - 14);

  const todayHeavyTaskCount = open.filter((t) => t.weight === 'heavy').length;

  const dueRows = open.filter((t) => t.dueType === 'datetime' && t.dueAt);

  const overdue = dueRows
    .filter((t) => t.dueAt && t.dueAt < nowInput)
    .sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime());

  const dueToday = dueRows
    .filter((t) => t.dueAt && t.dueAt >= startToday && t.dueAt < endToday)
    .sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime());

  const dueSoon = dueRows
    .filter((t) => t.dueAt && t.dueAt >= endToday && t.dueAt < soonEnd)
    .sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime());

  const inProgress = open.filter((t) => t.status === 'doing');

  const stalledPending = open
    .filter((t) => t.status === 'pending' && t.updatedAt <= pendingThreshold)
    .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());

  const highPriorityOpen = open
    .filter((t) => t.importance === 'high')
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const todayFlexible = pickFlexibleTasksForToday(rows, {
    now: nowInput,
    capacity,
    todayOpenTaskCount: open.length,
    todayHeavyTaskCount,
  });

  const anytimeStalled = open.filter(
    (t) => t.dueType === 'anytime' && t.createdAt <= anytimeThreshold,
  );

  const aiSuggestion = buildDashboardSuggestion({
    capacity,
    overdueCount: overdue.length,
    dueTodayCount: dueToday.length,
    heavyOpenCount: todayHeavyTaskCount,
    flexibleShowCount: todayFlexible.length,
    stalledPendingCount: stalledPending.length,
    highPriorityOpenCount: highPriorityOpen.length,
    anytimeStalledCount: anytimeStalled.length,
  });

  const notificationCandidates = buildNotificationCandidates(
    mapRows(overdue),
    mapRows(dueToday),
    todayFlexible,
    capacity,
  );

  const myTeamTasks = await listMyAssignedTeamTasks(userId);

  return {
    overdue: mapRows(overdue),
    dueToday: mapRows(dueToday),
    dueSoon: mapRows(dueSoon),
    inProgress: mapRows(inProgress),
    stalledPending: mapRows(stalledPending),
    highPriorityOpen: mapRows(highPriorityOpen),
    todayFlexible,
    myTeamTasks,
    capacity,
    aiSuggestion,
    notificationCandidates,
  };
}

function buildNotificationCandidates(
  overdue: Task[],
  dueToday: Task[],
  flexible: FlexibleTaskView[],
  capacity: DashboardPayload['capacity'],
): Task[] {
  const max = capacity === 'overload' ? 3 : 5;
  const picked: Task[] = [];
  const seen = new Set<string>();

  const push = (task: Task) => {
    if (seen.has(task.id) || picked.length >= max) {
      return;
    }

    seen.add(task.id);
    picked.push(task);
  };

  for (const t of overdue) {
    push(t);
  }

  for (const t of dueToday) {
    push(t);
  }

  for (const t of flexible.filter((f) => f.flexiblePriority === 'urgent' || f.flexiblePriority === 'high')) {
    push(t);
  }

  return picked;
}
