import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ReviewsClient } from '@/components/reviews-client';
import { getCurrentUserId } from '@/lib/auth/session';
import { listWeeklyReviews } from '@/server/weekly-review';

export default async function ReviewsPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect('/login');
  }

  const reviews = await listWeeklyReviews(userId);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-emerald-700">v1.5 · ルールベース</p>
        <h1 className="text-2xl font-semibold text-white">週次振り返り</h1>
        <p className="text-sm text-slate-400">
          完了数・保留・だいたいリピートの傾向から提案を生成します（将来 AI 連携予定）
        </p>
      </div>

      <ReviewsClient initialReviews={reviews} />

      <Link href="/dashboard" className="inline-block text-sm text-emerald-300 hover:underline">
        ← ダッシュボードへ
      </Link>
    </div>
  );
}

