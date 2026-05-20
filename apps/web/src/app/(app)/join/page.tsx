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
        <p className="todon-eyebrow">v2 · 招待</p>
        <h1 className="todon-page-title">チームに参加</h1>
      </div>
      <Suspense fallback={<p className="todon-muted">読み込み中…</p>}>
        <JoinTeamClient />
      </Suspense>
    </div>
  );
}
