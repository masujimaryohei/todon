import { AppHeader } from '@/components/app-header';

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-slate-950 text-slate-50">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
