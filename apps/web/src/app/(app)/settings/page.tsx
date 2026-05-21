import { redirect } from 'next/navigation';

import { SettingsClient } from '@/components/settings-client';
import { getCurrentUserId } from '@/lib/auth/session';
import { getOrCreateSettings } from '@/server/settings';

export default async function SettingsPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect('/login');
  }

  const settings = await getOrCreateSettings(userId);

  return (
    <div className="space-y-4">
      <p className="todon-eyebrow">v3</p>
      <h1 className="todon-page-title">設定 ⚙️</h1>
      <SettingsClient initial={settings} />
    </div>
  );
}
