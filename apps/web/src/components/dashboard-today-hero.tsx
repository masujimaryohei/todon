'use client';

import type { CapacityLevel, DashboardTodayProgress } from '@todon/shared';
import { CAPACITY_LABELS } from '@todon/shared';
import { useEffect, useState } from 'react';

function formatClock(now: Date, timeZone: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now);
}

type Props = {
  dateLabel: string;
  dayKey: string;
  timeZone: string;
  capacity: CapacityLevel;
  progress: DashboardTodayProgress;
};

export function DashboardTodayHero({ dateLabel, dayKey, timeZone, capacity, progress }: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const { total, completed, remaining, percent, dueTodayTotal, flexibleTotal } = progress;
  const allDone = total > 0 && remaining === 0;

  let progressMessage = '今日の予定タスクはまだありません';
  if (total > 0 && allDone) {
    progressMessage = '今日のタスクはすべて完了しました';
  } else if (total > 0) {
    progressMessage = `あと ${remaining} 件で今日のタスクが完了です`;
  }

  return (
    <section className="todon-card todon-card-sky overflow-hidden p-0">
      <div className="border-b border-sky-200/80 bg-gradient-to-br from-white to-todon-sky-soft px-5 py-4">
        <p className="todon-eyebrow">本日</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-2xl font-extrabold tracking-tight text-todon-ink">{dateLabel}</p>
            <p className="mt-1 text-xs font-medium text-todon-ink-muted">{dayKey}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-todon-ink-muted">現在時刻</p>
            <p className="font-mono text-3xl font-extrabold tabular-nums text-todon-sky" suppressHydrationWarning>
              {now ? formatClock(now, timeZone) : '--:--:--'}
            </p>
            <p className="text-[11px] text-todon-ink-muted">{timeZone}</p>
          </div>
        </div>
        <p className="mt-3 text-xs font-medium text-todon-ink-muted">
          キャパシティ「{CAPACITY_LABELS[capacity]}」— 無理のないペースで進めましょう
        </p>
      </div>

      <div className="space-y-3 px-5 py-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-todon-ink">今日のタスク進捗</p>
            <p className="text-xs text-todon-ink-muted">{progressMessage}</p>
          </div>
          <p className="text-right">
            <span className="text-2xl font-extrabold text-todon-primary">{completed}</span>
            <span className="text-lg font-bold text-todon-ink-muted"> / {total}</span>
            <span className="ml-2 text-sm font-bold text-todon-ink-muted">完了</span>
          </p>
        </div>

        <div
          className="h-4 overflow-hidden rounded-full border-2 border-todon-border bg-white"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`今日のタスク達成率 ${percent}%`}
        >
          <div
            className={`h-full rounded-full transition-[width] duration-500 ease-out ${
              allDone ? 'bg-gradient-to-r from-todon-mint to-todon-sky' : 'bg-gradient-to-r from-todon-primary to-todon-yellow'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-todon-ink-muted">
          <span>{percent}% 達成</span>
          <span>
            期限今日 {dueTodayTotal} 件
            {flexibleTotal > 0 ? ` / だいたいリピート ${flexibleTotal} 件` : ''}
          </span>
        </div>
      </div>
    </section>
  );
}
