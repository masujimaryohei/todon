import type { CapacityLevel } from '@todon/shared';
import { isCapacityLevel } from '@todon/shared';

import { utcDayKey } from '@/lib/date';
import { prisma } from '@/lib/prisma';

export async function getCapacityForDay(userId: string, day: string): Promise<CapacityLevel> {
  const row = await prisma.dayCapacity.findUnique({
    where: { userId_day: { userId, day } },
  });

  if (!row || !isCapacityLevel(row.level)) {
    return 'normal';
  }

  return row.level;
}

export async function getTodayCapacity(userId: string, now = new Date()) {
  return getCapacityForDay(userId, utcDayKey(now));
}

export async function setTodayCapacity(userId: string, level: CapacityLevel, now = new Date()) {
  const day = utcDayKey(now);

  await prisma.dayCapacity.upsert({
    where: { userId_day: { userId, day } },
    create: { userId, day, level },
    update: { level, updatedAt: new Date() },
  });

  return level;
}
