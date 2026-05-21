import { redirect } from 'next/navigation';

import { GanttClient } from '@/components/gantt-client';
import { getCurrentUserId } from '@/lib/auth/session';

export default async function GanttPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect('/login');
  }

  return (
    <div className="space-y-4">
      <p className="todon-eyebrow">v3</p>
      <h1 className="todon-page-title">ガント 📊</h1>
      <p className="todon-muted">開始〜期限のイメージをタイムライン表示（簡易版）</p>
      <GanttClient />
    </div>
  );
}
