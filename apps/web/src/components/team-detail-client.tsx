'use client';

import type { TaskWithPeople, Team, TeamMember } from '@todon/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  team: Team;
  members: TeamMember[];
  tasks: TaskWithPeople[];
};

const roleLabels = { owner: 'オーナー', admin: '管理者', member: 'メンバー' } as const;

export function TeamDetailClient({ team, members: initialMembers, tasks: initialTasks }: Props) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [tasks] = useState(initialTasks);
  const [inviteEmail, setInviteEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canAdmin = team.myRole === 'owner' || team.myRole === 'admin';

  async function onInvite(evt: React.FormEvent) {
    evt.preventDefault();
    if (!canAdmin) {
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/teams/${team.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: inviteEmail }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? '招待に失敗しました');
      }

      const body = (await res.json()) as { type: string; member?: TeamMember; invite?: { token: string } };

      if (body.type === 'member' && body.member) {
        setMembers((prev) => [...prev, body.member!]);
        setMessage(`${inviteEmail} をメンバーに追加しました`);
      } else {
        setMessage(`招待リンクを発行しました（未登録ユーザー向け）`);
      }

      setInviteEmail('');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '招待に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  async function onTeamReview() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/teams/${team.id}/reviews`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? '振り返りの生成に失敗しました');
      }

      setMessage('チーム週次振り返りを生成しました。振り返りページで確認できます。');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-emerald-700">v2 · チーム</p>
          <h1 className="text-2xl font-semibold text-white">{team.name}</h1>
          <p className="mt-1 text-xs text-slate-400">
            あなたのロール: {team.myRole ? roleLabels[team.myRole] : '—'} / メンバー {team.memberCount ?? members.length} 人
          </p>
        </div>
        <Link href="/teams" className="text-sm text-emerald-300 hover:underline">
          一覧へ
        </Link>
      </div>

      {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-white">チームタスク</h2>
          <Link
            href={`/tasks/new?teamId=${team.id}`}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-950"
          >
            タスクを追加
          </Link>
        </div>

        {tasks.length === 0 ? (
          <p className="text-sm text-slate-400">チームタスクはまだありません</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/tasks/${task.id}`}
                  className="block rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3 hover:border-emerald-600/50"
                >
                  <p className="font-medium text-slate-50">{task.title}</p>
                  <p className="text-xs text-slate-400">
                    {task.status}
                    {task.assignee?.name ? ` / 担当: ${task.assignee.name}` : ' / 未割当'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="text-lg font-semibold text-white">メンバー</h2>
        <ul className="space-y-2">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm"
            >
              <span className="text-slate-100">{member.user?.name ?? member.user?.email ?? member.userId}</span>
              <span className="text-xs text-slate-400">{roleLabels[member.role]}</span>
            </li>
          ))}
        </ul>

        {canAdmin ? (
          <form onSubmit={(e) => void onInvite(e)} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              placeholder="メールで招待"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-md border border-emerald-700 px-4 py-2 text-sm text-emerald-100 disabled:opacity-50"
            >
              招待
            </button>
          </form>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-semibold text-white">チーム振り返り</h2>
        <p className="mt-1 text-xs text-slate-400">今週のチームタスク状況から週次レポートを生成します</p>
        <button
          type="button"
          disabled={loading || !canAdmin}
          onClick={() => void onTeamReview()}
          className="mt-3 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 disabled:opacity-50"
        >
          今週のチーム振り返りを生成
        </button>
        {!canAdmin ? (
          <p className="mt-2 text-xs text-slate-500">生成はオーナー・管理者のみ可能です</p>
        ) : null}
        <Link href="/reviews" className="mt-3 inline-block text-sm text-emerald-300 hover:underline">
          振り返り一覧へ →
        </Link>
      </section>
    </div>
  );
}
