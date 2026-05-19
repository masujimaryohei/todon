import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { JoinTeamClient } from '@/components/join-team-client';
import { getCurrentUserId } from '@/lib/auth/session';

export default async function JoinPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect('/login');
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <p className="text-sm text-emerald-700">v2 · 招待</p>
        <h1 className="text-2xl font-semibold text-white">チームに参加</h1>
      </div>
      <Suspense fallback={<p className="text-sm text-slate-400">読み込み中…</p>}>
        <JoinTeamClient />
      </Suspense>
    </div>
  );
}
