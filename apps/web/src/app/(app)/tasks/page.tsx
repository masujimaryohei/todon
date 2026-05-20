import type { Task } from '@todon/shared';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getCurrentUserId } from '@/lib/auth/session';
import { listTasks } from '@/server/tasks';

function TaskRow({ task }: { task: Task }) {
  return (
    <li>
      <Link
        href={`/tasks/${task.id}`}
        className="flex items-center justify-between gap-3 rounded-lg border border-emerald-900/50 bg-slate-900/70 px-4 py-3 hover:border-emerald-500/70"
      >
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-50">{task.title}</p>
            <span className="rounded-full bg-emerald-900/50 px-2 py-0.5 text-[10px] uppercase text-emerald-200">
              {task.status}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {task.importance}/{task.urgency} / {task.weight}
            {task.category ? ` / ${task.category.name}` : ''}
          </p>
        </div>
        {task.dueAt ? (
          <p className="text-xs text-emerald-200">{new Date(task.dueAt).toLocaleString('ja-JP')}</p>
        ) : (
          <p className="text-xs text-slate-500">期限なし</p>
        )}
      </Link>
    </li>
  );
}

export default async function TasksPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect('/login');
  }

  const tasks = await listTasks(userId, false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="todon-eyebrow">個人タスク（v1）</p>
          <h1 className="todon-page-title">一覧</h1>
        </div>
        <Link
          href="/tasks/new"
          className="todon-btn-primary transition hover:bg-emerald-400"
        >
          新規作成
        </Link>
      </div>
      {tasks.length === 0 ? (
        <p className="todon-muted">
          まだタスクがありません。上部のボタンから作成してください。
        </p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </ul>
      )}
    </div>
  );
}
