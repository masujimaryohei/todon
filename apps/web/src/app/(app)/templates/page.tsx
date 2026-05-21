import { redirect } from 'next/navigation';

import { TemplatesClient } from '@/components/templates-client';
import { getCurrentUserId } from '@/lib/auth/session';

export default async function TemplatesPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect('/login');
  }

  return (
    <div className="space-y-4">
      <p className="todon-eyebrow">v3</p>
      <h1 className="todon-page-title">テンプレート 📋</h1>
      <TemplatesClient />
    </div>
  );
}
