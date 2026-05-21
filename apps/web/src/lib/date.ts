export function utcDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function startOfUtcDay(date: Date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/** ローカルタイムゾーンの当日 00:00:00.000 */
export function startOfLocalDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** ローカルタイムゾーンの翌日 00:00:00.000 */
export function endOfLocalDay(date: Date) {
  const d = startOfLocalDay(date);
  d.setDate(d.getDate() + 1);
  return d;
}

export function localDayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
