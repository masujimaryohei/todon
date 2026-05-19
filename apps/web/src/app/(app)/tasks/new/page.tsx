import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { NewTaskForm } from '@/components/new-task-form';
import { getCurrentUserId } from '@/lib/auth/session';
import { listCategories } from '@/server/categories';
import { listTeamsForUser } from '@/server/teams';

export default async function NewTaskPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect('/login');
  }

  const [categories, teams] = await Promise.all([listCategories(userId), listTeamsForUser(userId)]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-emerald-700">最小入力 + 詳細設定</p>
          <h1 className="text-2xl font-semibold text-white">タスクを作成</h1>
        </div>
        <Link href="/tasks" className="text-sm text-emerald-300 hover:underline">
          一覧へ戻る
        </Link>
      </div>
      <Suspense fallback={<p className="text-sm text-slate-400">読み込み中…</p>}>
        <NewTaskForm categories={categories} teams={teams} />
      </Suspense>
    </div>
  );
}
