'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function JoinTeamClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onAccept() {
    if (!token) {
      setError('招待トークンがありません');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? '参加に失敗しました');
      }

      const team = (await res.json()) as { id: string };
      router.push(`/teams/${team.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '参加に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 todon-card p-6">
      <p className="text-sm text-slate-300">
        チームへの招待を受け取りました。ログイン中のアカウントで参加します。
      </p>
      {!token ? (
        <p className="text-sm text-amber-300">URL に token パラメータがありません。</p>
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={() => void onAccept()}
          className="todon-btn-primary disabled:opacity-50"
        >
          {loading ? '参加中…' : 'チームに参加する'}
        </button>
      )}
      {error ? <p className="todon-error">{error}</p> : null}
    </div>
  );
}
