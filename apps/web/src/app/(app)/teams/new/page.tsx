import Link from 'next/link';
import { redirect } from 'next/navigation';

import { CreateTeamForm } from '@/components/create-team-form';
import { getCurrentUserId } from '@/lib/auth/session';

export default async function NewTeamPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect('/login');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="todon-eyebrow">v2 · チーム</p>
          <h1 className="todon-page-title">チームを作成</h1>
        </div>
        <Link href="/teams" className="todon-link">
          一覧へ
        </Link>
      </div>
      <CreateTeamForm />
    </div>
  );
}
