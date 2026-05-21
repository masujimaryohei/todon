import { redirect } from 'next/navigation';

import { HabitsClient } from '@/components/habits-client';
import { getCurrentUserId } from '@/lib/auth/session';

export default async function HabitsPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect('/login');
  }

  return (
    <div className="space-y-4">
      <p className="todon-eyebrow">v3 · 習慣</p>
      <h1 className="todon-page-title">習慣トラッカー 🌱</h1>
      <p className="todon-muted">週の目標回数を決めて、今日の達成をワンタップで記録</p>
      <HabitsClient />
    </div>
  );
}
