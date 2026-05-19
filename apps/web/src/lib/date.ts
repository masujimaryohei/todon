export function utcDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function startOfUtcDay(date: Date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/** 週の開始（月曜 00:00 UTC） */
export function startOfUtcWeek(date: Date) {
  const d = startOfUtcDay(date);
  const weekday = d.getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  d.setUTCDate(d.getUTCDate() + mondayOffset);
  return d;
}

export function endOfUtcWeek(weekStart: Date) {
  const end = new Date(weekStart);
  end.setUTCDate(end.getUTCDate() + 7);
  return end;
}
