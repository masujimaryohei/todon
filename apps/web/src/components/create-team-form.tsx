'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CreateTeamForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(evt: React.FormEvent) {
    evt.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? '作成に失敗しました');
      }

      const team = (await res.json()) as { id: string };
      router.push(`/teams/${team.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '作成に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="space-y-2">
        <label className="text-sm text-slate-200">チーム名</label>
        <input
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={64}
        />
      </div>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 disabled:opacity-50"
        >
          {loading ? '作成中…' : '作成する'}
        </button>
        <Link href="/teams" className="text-sm text-emerald-300 hover:underline">
          キャンセル
        </Link>
      </div>
    </form>
  );
}
