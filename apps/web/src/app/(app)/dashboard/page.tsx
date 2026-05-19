import type { FlexibleTaskView, Task } from '@todon/shared';
import { CAPACITY_LABELS } from '@todon/shared';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { CapacitySelector } from '@/components/capacity-selector';
import { getCurrentUserId } from '@/lib/auth/session';
import { buildDashboard } from '@/server/dashboard';

function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-slate-400">該当タスクはありません</p>;
  }

  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <li key={task.id}>
          <Link
            href={`/tasks/${task.id}`}
            className="block rounded-lg border border-emerald-900/50 bg-slate-900/70 px-4 py-3 transition hover:border-emerald-500/70"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-slate-50">{task.title}</p>
              <span className="text-[11px] uppercase tracking-wide text-emerald-600">
                {task.status}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              重要度 {task.importance} / 緊急度 {task.urgency}
              {task.category ? ` / ${task.category.name}` : ''}
              {task.dueAt ? ` / 期限 ${new Date(task.dueAt).toLocaleString('ja-JP')}` : ''}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function FlexibleList({ tasks }: { tasks: FlexibleTaskView[] }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-slate-400">今日はだいたいリピートの表示候補がありません</p>;
  }

  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <li key={task.id}>
          <Link
            href={`/tasks/${task.id}`}
            className="block rounded-lg border border-teal-900/50 bg-teal-950/30 px-4 py-3 transition hover:border-teal-500/70"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-slate-50">{task.title}</p>
              <span className="text-[10px] uppercase text-teal-300">{task.flexiblePriority}</span>
            </div>
            <p className="text-xs text-teal-200/80">{task.flexibleReason}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div>
        <h2 className="text-sm font-semibold text-emerald-200">{title}</h2>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default async function DashboardPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect('/login');
  }

  const data = await buildDashboard(userId);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.35em] text-emerald-700">Today</p>
        <h1 className="text-3xl font-semibold text-slate-50">ダッシュボード</h1>
        <p className="text-sm text-slate-400">
          v1.5: だいたいリピート・キャパシティ・ルールベースの提案（{CAPACITY_LABELS[data.capacity]}）
        </p>
      </div>

      <CapacitySelector initial={data.capacity} />

      <section className="rounded-xl border border-emerald-800/60 bg-emerald-950/30 p-4">
        <p className="text-xs uppercase tracking-wide text-emerald-600">AI からの一言（ルールベース）</p>
        <p className="mt-2 text-sm leading-relaxed text-emerald-50">{data.aiSuggestion}</p>
      </section>

      <Section title="担当のチームタスク" description="自分が担当している未完了タスク">
        {data.myTeamTasks.length === 0 ? (
          <p className="text-sm text-slate-400">担当中のチームタスクはありません</p>
        ) : (
          <ul className="space-y-3">
            {data.myTeamTasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/tasks/${task.id}`}
                  className="block rounded-lg border border-indigo-900/50 bg-indigo-950/30 px-4 py-3 hover:border-indigo-500/60"
                >
                  <p className="font-medium text-slate-50">{task.title}</p>
                  <p className="text-xs text-indigo-200/80">
                    {task.status}
                    {task.assignee?.name ? ` / 担当: ${task.assignee.name}` : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="だいたいリピート（今日）" description="周期とキャパシティから算出">
        <FlexibleList tasks={data.todayFlexible} />
      </Section>

      <Section title="通知候補（控えめ）" description="押しすぎないよう最大5件まで">
        <TaskList tasks={data.notificationCandidates} />
      </Section>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="期限切れ" description="すぐに手を付けたいタスク">
          <TaskList tasks={data.overdue} />
        </Section>
        <Section title="今日が期限" description="今日中に片付けたいタスク">
          <TaskList tasks={data.dueToday} />
        </Section>
        <Section title="近日中の期限（7日以内）" description="そろそろ着手しておきたいタスク">
          <TaskList tasks={data.dueSoon} />
        </Section>
        <Section title="着手中" description="今まさに進めているもの">
          <TaskList tasks={data.inProgress} />
        </Section>
        <Section title="重要度が高い未完了" description="放置しすぎないようチェック">
          <TaskList tasks={data.highPriorityOpen} />
        </Section>
        <Section title="長引いている保留" description="1週間以上更新が止まっている保留">
          <TaskList tasks={data.stalledPending} />
        </Section>
      </div>

      <Link href="/reviews" className="inline-block text-sm text-emerald-300 hover:underline">
        週次振り返りを見る →
      </Link>
    </div>
  );
}

