import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { requireUser } from '@/lib/http';
import { getIcsForUser } from '@/server/calendar';

export async function GET(req: Request) {
  try {
    const { userId } = await requireUser(req);
    const ics = await getIcsForUser(userId);

    return new NextResponse(ics, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="todon.ics"',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
