import type { RepeatType } from '@todon/shared';

export function repeatFieldsFromInput(input: {
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

export function buildRepeatCompletionPatch(existing: {
  repeatType: string;
  repeatIntervalDays: number | null;
}) {
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

  return { lastCompletedAt: now, status: 'done' };
}
