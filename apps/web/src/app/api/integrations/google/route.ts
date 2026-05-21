import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { requireUser } from '@/lib/http';
import { updateSettings } from '@/server/settings';

/** Google Calendar OAuth は v3 では ICS エクスポートを提供。OAuth は将来拡張。 */
export async function POST(req: Request) {
  try {
    const { userId } = await requireUser(req);

    await updateSettings(userId, { googleCalendarLinked: true });

    return NextResponse.json({
      message:
        'Google 連携の OAuth は準備中です。設定画面の ICS リンクを Google カレンダーに購読してください。',
      icsPath: '/api/calendar/export',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
