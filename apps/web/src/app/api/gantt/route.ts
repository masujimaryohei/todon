import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { BadRequestError, requireUser } from '@/lib/http';
import { getGanttItems } from '@/server/calendar';

export async function GET(req: Request) {
  try {
    const { userId } = await requireUser(req);
    const { searchParams } = new URL(req.url);
    const startStr = searchParams.get('start');
    const endStr = searchParams.get('end');

    if (!startStr || !endStr) {
      throw new BadRequestError('start と end が必要です');
    }

    const items = await getGanttItems(userId, new Date(startStr), new Date(endStr));
    return NextResponse.json(items);
  } catch (error) {
    return handleApiError(error);
  }
}
