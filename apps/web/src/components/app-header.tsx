import Link from 'next/link';

import { LogoutButton } from '@/components/logout-button';

const nav = [
  { href: '/dashboard', label: 'ダッシュボード' },
  { href: '/tasks', label: '個人タスク' },
  { href: '/reviews', label: '振り返り' },
  { href: '/archive', label: 'アーカイブ' },
];

export function AppHeader() {
  return (
    <header className="border-b border-emerald-900/40 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-emerald-300">
            TodoN
          </Link>
          <span className="text-xs text-emerald-700">トドン</span>
        </div>
        <nav className="hidden items-center gap-2 text-sm text-slate-200 sm:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 transition hover:bg-emerald-900/30"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <LogoutButton />
      </div>
    </header>
  );
}
