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
    <button type="button" className="todon-btn-ghost text-xs" onClick={() => void onLogout()}>
      ログアウト
    </button>
  );
}
