import Link from 'next/link';
import { redirect } from 'next/navigation';

import { NewTaskForm } from '@/components/new-task-form';
import { getCurrentUserId } from '@/lib/auth/session';
import { listCategories } from '@/server/categories';

export default async function NewTaskPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect('/login');
  }

  const categories = await listCategories(userId);

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
      <NewTaskForm categories={categories} />
    </div>
  );
}
