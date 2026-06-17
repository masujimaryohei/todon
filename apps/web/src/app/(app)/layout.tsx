import { AppHeader } from '@/components/app-header';
import { ScopeSwitcher } from '@/components/scope-switcher';

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-full overflow-hidden bg-todon-bg text-todon-ink">
      <div className="todon-blobs" aria-hidden>
        <div className="todon-blob todon-blob-pink" />
        <div className="todon-blob todon-blob-sky" />
        <div className="todon-blob todon-blob-yellow" />
      </div>
      <ScopeSwitcher />
      <AppHeader />
      <main className="relative mx-auto w-full max-w-5xl px-4 py-8 pl-12 sm:pl-14">{children}</main>
    </div>
  );
}
