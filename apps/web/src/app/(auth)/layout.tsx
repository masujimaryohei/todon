import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-full overflow-hidden bg-gradient-to-b from-slate-950 via-emerald-950/30 to-slate-950 text-slate-50">
      <div className="pointer-events-none absolute inset-0 opacity-40 blur-3xl">
        <div className="absolute -top-32 left-10 h-72 w-72 rounded-full bg-emerald-500/40" />
        <div className="absolute bottom-[-40px] right-0 h-80 w-80 rounded-full bg-teal-600/30" />
      </div>
      <div className="relative mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16">
        <div className="mb-10 text-center">
          <p className="text-sm tracking-[0.4em] text-emerald-700">TODON</p>
          <h1 className="text-3xl font-semibold text-white">TodoN（トドン）</h1>
          <p className="mt-2 text-sm text-slate-300">生活と仕事の詰まりをほどくタスク管理</p>
        </div>
        <div className="rounded-2xl border border-emerald-900/50 bg-slate-950/70 p-8 shadow-2xl backdrop-blur">
          {children}
        </div>
      </div>
    </div>
  );
}
