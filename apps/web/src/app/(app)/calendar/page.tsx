import { redirect } from 'next/navigation';

import { CalendarClient } from '@/components/calendar-client';
import { getCurrentUserId } from '@/lib/auth/session';

export default async function CalendarPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect('/login');
  }
  return (
    <div className="space-y-4">
      <p className="todon-eyebrow">v3</p>
      <h1 className="todon-page-title">カレンダー 📅</h1>
      <p className="todon-muted">期限・開始日のあるタスクを月表示します</p>
      <CalendarClient />
    </div>
  );
}
