'use client';

import type { TaskActivityLog, TaskComment, TaskWithPeople, TeamMember } from '@todon/shared';
import { useEffect, useState } from 'react';

type Props = {
  task: TaskWithPeople;
  members: TeamMember[];
};

export function TaskCollaboration({ task, members }: Props) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [activity, setActivity] = useState<TaskActivityLog[]>([]);
  const [body, setBody] = useState('');
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [commentsRes, activityRes] = await Promise.all([
          fetch(`/api/tasks/${task.id}/comments`, { credentials: 'include' }),
          fetch(`/api/tasks/${task.id}/activity`, { credentials: 'include' }),
        ]);

        if (!commentsRes.ok || !activityRes.ok) {
          return;
        }

        const [commentsData, activityData] = await Promise.all([
          commentsRes.json() as Promise<TaskComment[]>,
          activityRes.json() as Promise<TaskActivityLog[]>,
        ]);

        if (!cancelled) {
          setComments(commentsData);
          setActivity(activityData);
        }
      } catch {
        // ignore
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [task.id]);

  async function postComment(evt: React.FormEvent) {
    evt.preventDefault();
    if (!body.trim()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ body: body.trim() }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error((payload as { message?: string }).message ?? '投稿に失敗しました');
      }

      const created = (await res.json()) as TaskComment;
      setComments((prev) => [...prev, created]);
      setBody('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '投稿に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  async function saveAssignee() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ assigneeId: assigneeId || null }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error((payload as { message?: string }).message ?? '担当者の更新に失敗しました');
      }

      const activityRes = await fetch(`/api/tasks/${task.id}/activity`, { credentials: 'include' });
      if (activityRes.ok) {
        setActivity((await activityRes.json()) as TaskActivityLog[]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '担当者の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  if (task.scope !== 'team') {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-indigo-900/50 bg-indigo-950/20 p-5">
        <h2 className="text-lg font-semibold text-white">チーム情報</h2>
        <p className="mt-1 text-xs text-slate-400">
          オーナー: {task.owner?.name ?? task.owner?.email ?? '—'}
          {task.assignee ? ` / 担当: ${task.assignee.name ?? task.assignee.email}` : ' / 担当: 未割当'}
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-sm text-slate-200">担当者</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              <option value="">未割当</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user?.name ?? m.user?.email ?? m.userId}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void saveAssignee()}
            className="rounded-md border border-indigo-600 px-4 py-2 text-sm text-indigo-100 disabled:opacity-50"
          >
            担当を更新
          </button>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-semibold text-white">コメント</h2>
        <ul className="space-y-3">
          {comments.length === 0 ? (
            <li className="text-sm text-slate-400">コメントはまだありません</li>
          ) : (
            comments.map((comment) => (
              <li key={comment.id} className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
                <p className="text-xs text-slate-500">
                  {comment.user?.name ?? comment.user?.email ?? 'ユーザー'} ·{' '}
                  {new Date(comment.createdAt).toLocaleString('ja-JP')}
                </p>
                <p className="mt-1 text-sm text-slate-100">{comment.body}</p>
              </li>
            ))
          )}
        </ul>

        <form onSubmit={(e) => void postComment(e)} className="space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="コメントを書く"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <button
            type="submit"
            disabled={loading || !body.trim()}
            className="rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
          >
            投稿
          </button>
        </form>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-semibold text-white">履歴</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-slate-400">履歴はまだありません</p>
        ) : (
          <ul className="space-y-2 text-sm text-slate-300">
            {activity.map((log) => (
              <li key={log.id} className="border-b border-slate-800/80 pb-2">
                <span className="text-slate-500">{new Date(log.createdAt).toLocaleString('ja-JP')}</span>
                {' · '}
                <span>{log.user?.name ?? log.user?.email ?? 'ユーザー'}</span>
                {' · '}
                <span>{log.action}</span>
                {log.before || log.after ? (
                  <span className="text-slate-500">
                    {' '}
                    ({log.before ?? '—'} → {log.after ?? '—'})
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
    </div>
  );
}
