import type { Task as PrismaTask } from '@prisma/client';
import type { CapacityLevel, FlexibleTaskView, Task } from '@todon/shared';
import { evaluateFlexibleRepeat } from '@todon/shared';

import { mapTask } from '@/lib/mappers';

type Row = PrismaTask & {
  category?: Parameters<typeof mapTask>[0]['category'];
  subtasks?: Parameters<typeof mapTask>[0]['subtasks'];
};

export function pickFlexibleTasksForToday(
  rows: Row[],
  context: {
    now: Date;
    capacity: CapacityLevel;
    todayOpenTaskCount: number;
    todayHeavyTaskCount: number;
  },
): FlexibleTaskView[] {
  const candidates = rows.filter(
    (t) =>
      t.repeatType === 'flexible' &&
      !t.archivedAt &&
      !t.deletedAt &&
      !['done', 'canceled'].includes(t.status) &&
      t.flexibleMinDays != null &&
      t.flexibleMaxDays != null,
  );

  const result: FlexibleTaskView[] = [];

  for (const row of candidates) {
    const decision = evaluateFlexibleRepeat(
      {
        lastCompletedAt: row.lastCompletedAt,
        flexibleMinDays: row.flexibleMinDays!,
        flexibleMaxDays: row.flexibleMaxDays!,
        importance: row.importance as Task['importance'],
        urgency: row.urgency as Task['urgency'],
        weight: row.weight as Task['weight'],
        skipCount: row.flexibleSkipCount,
      },
      {
        now: context.now,
        todayOpenTaskCount: context.todayOpenTaskCount,
        todayHeavyTaskCount: context.todayHeavyTaskCount,
        capacity: context.capacity,
      },
    );

    if (!decision.show) {
      continue;
    }

    const mapped = mapTask(row);

    result.push({
      ...mapped,
      flexibleReason: decision.reason,
      flexiblePriority: decision.priority,
    });
  }

  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 } as const;

  return result.sort(
    (a, b) => priorityOrder[a.flexiblePriority] - priorityOrder[b.flexiblePriority],
  );
}
