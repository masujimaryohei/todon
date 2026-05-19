'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(evt: React.FormEvent) {
    evt.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? 'ログインに失敗しました');
      }

      router.replace('/dashboard');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-semibold text-white">ログイン</h2>
        <p className="text-sm text-slate-400">個人タスクのダッシュボードへ</p>
      </div>
      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <div className="space-y-2 text-left">
          <label className="text-xs uppercase tracking-wide text-emerald-700">メール</label>
          <input
            type="email"
            autoComplete="email"
            className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2 text-left">
          <label className="text-xs uppercase tracking-wide text-emerald-700">パスワード</label>
          <input
            type="password"
            autoComplete="current-password"
            className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-50"
        >
          {loading ? '送信中…' : 'ログインする'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-400">
        はじめてですか？{' '}
        <Link className="font-semibold text-emerald-300 hover:underline" href="/register">
          新規登録
        </Link>
      </p>
    </div>
  );
}
