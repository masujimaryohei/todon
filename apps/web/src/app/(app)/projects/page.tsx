import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getCurrentUserId } from '@/lib/auth/session';
import { listProjects } from '@/server/projects';

export default async function ProjectsPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect('/login');
  }

  const projects = await listProjects(userId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="todon-eyebrow">v3</p>
          <h1 className="todon-page-title">プロジェクト 📁</h1>
        </div>
        <Link href="/projects/new" className="todon-btn-primary text-sm">
          新規プロジェクト
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="todon-muted">プロジェクトを作ってタスクをまとめましょう</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <li key={p.id}>
              <Link href={`/projects/${p.id}`} className="todon-card block p-5 transition hover:border-todon-sky">
                <p className="font-extrabold text-todon-ink">{p.name}</p>
                <p className="text-xs text-todon-ink-muted">タスク {p.taskCount ?? 0} 件</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
