'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  async function onLogout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    router.replace('/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      className="rounded-md border border-emerald-800 px-3 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-900/40"
      onClick={() => void onLogout()}
    >
      ログアウト
    </button>
  );
}
