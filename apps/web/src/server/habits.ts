import type { Habit } from '@todon/shared';

import { BadRequestError, NotFoundError } from '@/lib/http';
import { prisma } from '@/lib/prisma';

function weekStartKey(d = new Date()) {
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
  return monday.toISOString().slice(0, 10);
}

function mapHabit(
  row: {
    id: string;
    userId: string;
    title: string;
    targetPerWeek: number;
    color: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
  weekDoneCount?: number,
): Habit {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    targetPerWeek: row.targetPerWeek,
    color: row.color,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    weekDoneCount,
  };
}

export async function listHabits(userId: string) {
  const start = weekStartKey();
  const rows = await prisma.habit.findMany({
    where: { userId },
    include: {
      logs: {
        where: { day: { gte: start }, completed: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return rows.map((r) => mapHabit(r, r.logs.length));
}

export async function createHabit(
  userId: string,
  input: { title: string; targetPerWeek?: number; color?: string | null },
) {
  const title = input.title.trim();
  if (!title) {
    throw new BadRequestError('習慣名を入力してください');
  }

  const target = input.targetPerWeek ?? 3;
  if (target < 1 || target > 7) {
    throw new BadRequestError('週の目標は 1〜7 回です');
  }

  const row = await prisma.habit.create({
    data: {
      userId,
      title,
      targetPerWeek: target,
      color: input.color ?? null,
    },
  });

  return mapHabit(row, 0);
}

export async function toggleHabitLog(userId: string, habitId: string, day: string) {
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) {
    throw new NotFoundError('習慣が見つかりません');
  }

  const existing = await prisma.habitLog.findUnique({
    where: { habitId_day: { habitId, day } },
  });

  if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } });
    return { completed: false };
  }

  await prisma.habitLog.create({
    data: { habitId, day, completed: true },
  });

  return { completed: true };
}
