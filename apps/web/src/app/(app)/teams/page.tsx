import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getCurrentUserId } from '@/lib/auth/session';
import { listPendingInvitesForUser, listTeamsForUser } from '@/server/teams';

export default async function TeamsPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect('/login');
  }

  const [teams, invites] = await Promise.all([listTeamsForUser(userId), listPendingInvitesForUser(userId)]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-emerald-700">v2 · チーム</p>
          <h1 className="text-2xl font-semibold text-white">チーム一覧</h1>
        </div>
        <Link
          href="/teams/new"
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950"
        >
          チームを作成
        </Link>
      </div>

      {invites.length > 0 ? (
        <section className="rounded-xl border border-amber-800/50 bg-amber-950/20 p-4">
          <h2 className="text-sm font-semibold text-amber-200">保留中の招待</h2>
          <ul className="mt-3 space-y-2">
            {invites.map((invite) => (
              <li key={invite.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-slate-200">
                  {invite.teamName} への招待（{invite.email}）
                </span>
                <Link
                  href={`/join?token=${invite.token}`}
                  className="text-emerald-300 hover:underline"
                >
                  参加する
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {teams.length === 0 ? (
        <p className="text-sm text-slate-400">まだチームがありません。作成するか、招待を受け取ってください。</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {teams.map((team) => (
            <li key={team.id}>
              <Link
                href={`/teams/${team.id}`}
                className="block rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-emerald-600/50"
              >
                <h2 className="text-lg font-semibold text-white">{team.name}</h2>
                <p className="mt-1 text-xs text-slate-400">
                  あなたのロール: {team.myRole} / メンバー {team.memberCount ?? 1} 人
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
