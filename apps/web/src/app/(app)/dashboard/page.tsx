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
    return <p className="todon-muted">該当タスクはありません</p>;
  }

  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <li key={task.id}>
          <Link href={`/tasks/${task.id}`} className="todon-task-link">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-todon-ink">{task.title}</p>
              <span className="rounded-full bg-todon-primary-soft px-2 py-0.5 text-[11px] font-bold uppercase text-todon-primary">
                {task.status}
              </span>
            </div>
            <p className="text-xs text-todon-ink-muted">
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
    return <p className="todon-muted">今日はだいたいリピートの表示候補がありません</p>;
  }

  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <li key={task.id}>
          <Link href={`/tasks/${task.id}`} className="todon-task-link border-todon-mint bg-todon-mint-soft/40">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-todon-ink">{task.title}</p>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-todon-mint">
                {task.flexiblePriority}
              </span>
            </div>
            <p className="text-xs text-todon-ink-muted">{task.flexibleReason}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const sectionTone: Record<string, string> = {
  default: 'todon-card p-4',
  sky: 'todon-card todon-card-sky p-4',
  pink: 'todon-card todon-card-pink p-4',
  mint: 'todon-card todon-card-mint p-4',
  lavender: 'todon-card todon-card-lavender p-4',
  yellow: 'todon-card todon-card-yellow p-4',
};

function Section({
  title,
  description,
  tone = 'default',
  children,
}: {
  title: string;
  description: string;
  tone?: keyof typeof sectionTone;
  children: ReactNode;
}) {
  return (
    <section className={`space-y-3 ${sectionTone[tone]}`}>
      <div>
        <h2 className="text-sm font-extrabold text-todon-ink">{title}</h2>
        <p className="text-xs text-todon-ink-muted">{description}</p>
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
        <p className="todon-eyebrow">今日のトドン</p>
        <h1 className="todon-page-title">
          ダッシュボード
          <span className="ml-2 text-2xl" aria-hidden>
            ☀️
          </span>
        </h1>
        <p className="todon-muted">
          キャパシティは「{CAPACITY_LABELS[data.capacity]}」— 無理のないペースで進めましょう
        </p>
      </div>

      <CapacitySelector initial={data.capacity} />

      <section className="todon-card todon-card-pink p-4">
        <p className="todon-eyebrow">ひとこと（ルールベース）</p>
        <p className="mt-2 text-sm leading-relaxed font-medium text-todon-ink">{data.aiSuggestion}</p>
      </section>

      <Section title="担当のチームタスク 👋" description="自分が担当している未完了タスク" tone="lavender">
        {data.myTeamTasks.length === 0 ? (
          <p className="todon-muted">担当中のチームタスクはありません</p>
        ) : (
          <ul className="space-y-3">
            {data.myTeamTasks.map((task) => (
              <li key={task.id}>
                <Link href={`/tasks/${task.id}`} className="todon-task-link border-todon-lavender bg-white">
                  <p className="font-bold text-todon-ink">{task.title}</p>
                  <p className="text-xs text-todon-ink-muted">
                    {task.status}
                    {task.assignee?.name ? ` / 担当: ${task.assignee.name}` : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="だいたいリピート（今日）" description="周期とキャパシティから算出" tone="mint">
        <FlexibleList tasks={data.todayFlexible} />
      </Section>

      <Section title="通知候補（控えめ）" description="押しすぎないよう最大5件まで" tone="yellow">
        <TaskList tasks={data.notificationCandidates} />
      </Section>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="期限切れ" description="すぐに手を付けたいタスク" tone="pink">
          <TaskList tasks={data.overdue} />
        </Section>
        <Section title="今日が期限" description="今日中に片付けたいタスク" tone="sky">
          <TaskList tasks={data.dueToday} />
        </Section>
        <Section title="近日中の期限（7日以内）" description="そろそろ着手しておきたいタスク">
          <TaskList tasks={data.dueSoon} />
        </Section>
        <Section title="着手中" description="今まさに進めているもの" tone="mint">
          <TaskList tasks={data.inProgress} />
        </Section>
        <Section title="重要度が高い未完了" description="放置しすぎないようチェック" tone="yellow">
          <TaskList tasks={data.highPriorityOpen} />
        </Section>
        <Section title="長引いている保留" description="1週間以上更新が止まっている保留">
          <TaskList tasks={data.stalledPending} />
        </Section>
      </div>

      <Link href="/reviews" className="todon-link inline-block text-sm">
        週次振り返りを見る →
      </Link>
    </div>
  );
}
