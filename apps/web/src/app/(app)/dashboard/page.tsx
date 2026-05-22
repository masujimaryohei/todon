import Link from 'next/link';
import { redirect } from 'next/navigation';

import { CapacitySelector } from '@/components/capacity-selector';
import { DashboardTaskBoard } from '@/components/dashboard-task-panels';
import { DashboardTodayHero } from '@/components/dashboard-today-hero';
import { getCurrentUserId } from '@/lib/auth/session';
import { buildDashboard } from '@/server/dashboard';

export default async function DashboardPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect('/login');
  }

  const data = await buildDashboard(userId);

  const footerLinks = (
    <div className="flex flex-wrap gap-4 text-sm">
      <Link href="/reviews" className="todon-link">
        週次振り返り →
      </Link>
      <Link href="/templates" className="todon-link">
        テンプレート →
      </Link>
      <Link href="/gantt" className="todon-link">
        ガント →
      </Link>
      <Link href="/archive" className="todon-link">
        アーカイブ →
      </Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="todon-eyebrow">今日のトドン</p>
        <h1 className="todon-page-title">
          ダッシュボード
          <span className="ml-2 text-2xl" aria-hidden>
            ☀️
          </span>
        </h1>
      </div>

      <DashboardTodayHero
        dateLabel={data.todayInfo.dateLabel}
        dayKey={data.todayInfo.dayKey}
        timeZone={data.todayInfo.timeZone}
        capacity={data.capacity}
        progress={data.todayProgress}
      />

      <CapacitySelector initial={data.capacity} />

      <section className="todon-section p-4">
        <p className="todon-section-label">ひとこと（ルールベース）</p>
        <p className="mt-2 text-sm leading-relaxed font-medium text-todon-ink">{data.aiSuggestion}</p>
      </section>

      <DashboardTaskBoard
        data={{
          myTeamTasks: data.myTeamTasks,
          todayFlexible: data.todayFlexible,
          notificationCandidates: data.notificationCandidates,
          overdue: data.overdue,
          dueToday: data.dueToday,
          dueSoon: data.dueSoon,
          inProgress: data.inProgress,
          highPriorityOpen: data.highPriorityOpen,
          stalledPending: data.stalledPending,
        }}
        footer={footerLinks}
      />
    </div>
  );
}
