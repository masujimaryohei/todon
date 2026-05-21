import type { FlexibleTaskView } from './types';

export type DashboardTodayProgress = {
  total: number;
  completed: number;
  remaining: number;
  percent: number;
  dueTodayTotal: number;
  dueTodayCompleted: number;
  flexibleTotal: number;
};

export type TodayProgressTaskRow = {
  id: string;
  status: string;
  dueType: string;
  dueAt: Date | null;
  repeatType: string;
  lastCompletedAt: Date | null;
};

export function computeTodayProgress(
  rows: TodayProgressTaskRow[],
  todayFlexible: Pick<FlexibleTaskView, 'id' | 'status'>[],
  range: { start: Date; end: Date },
): DashboardTodayProgress {
  const dueTodayAll = rows.filter(
    (t) =>
      t.dueType === 'datetime' &&
      t.dueAt &&
      t.dueAt >= range.start &&
      t.dueAt < range.end &&
      t.status !== 'canceled',
  );

  const flexibleDoneToday = rows.filter(
    (t) =>
      t.repeatType === 'flexible' &&
      t.status === 'done' &&
      t.lastCompletedAt &&
      t.lastCompletedAt >= range.start &&
      t.lastCompletedAt < range.end,
  );

  const plan = new Map<string, string>();

  for (const t of dueTodayAll) {
    plan.set(t.id, t.status);
  }
  for (const t of todayFlexible) {
    plan.set(t.id, t.status);
  }
  for (const t of flexibleDoneToday) {
    plan.set(t.id, t.status);
  }

  const total = plan.size;
  const completed = [...plan.values()].filter((status) => status === 'done').length;
  const remaining = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  const flexibleIds = new Set([
    ...todayFlexible.map((t) => t.id),
    ...flexibleDoneToday.map((t) => t.id),
  ]);

  return {
    total,
    completed,
    remaining,
    percent,
    dueTodayTotal: dueTodayAll.length,
    dueTodayCompleted: dueTodayAll.filter((t) => t.status === 'done').length,
    flexibleTotal: flexibleIds.size,
  };
}

export function formatTodayDateLabel(now: Date, timeZone = 'Asia/Tokyo') {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(now);
}
