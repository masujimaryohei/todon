'use client';

import type { WeeklyReview } from '@todon/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  initialReviews: WeeklyReview[];
};

export function ReviewsClient({ initialReviews }: Props) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate() {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('振り返りの生成に失敗しました');
      }

      const created = (await res.json()) as WeeklyReview;

      setReviews((prev) => {
        const without = prev.filter((r) => r.id !== created.id);
        return [created, ...without];
      });

      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成に失敗しました');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          disabled={generating}
          onClick={() => void onGenerate()}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 disabled:opacity-50"
        >
          {generating ? '生成中…' : '今週の振り返りを生成'}
        </button>
      </div>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      {reviews.length === 0 ? (
        <p className="text-sm text-slate-400">まだ振り返りがありません。上のボタンから生成してください。</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <p className="text-xs text-slate-500">
                {review.type === 'team' ? 'チーム' : '個人'}
                {' · '}
                {new Date(review.weekStart).toLocaleDateString('ja-JP')} 〜{' '}
                {new Date(review.weekEnd).toLocaleDateString('ja-JP')}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-100">{review.summary}</p>

              {review.insights.length > 0 ? (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase text-emerald-600">気づき</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-300">
                    {review.insights.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {review.recommendations.length > 0 ? (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase text-teal-600">来週の提案</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-300">
                    {review.recommendations.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
