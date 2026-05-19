import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { requireUser } from '@/lib/http';
import { buildDashboard } from '@/server/dashboard';

export async function GET(req: Request) {
  try {
    const { userId } = await requireUser(req);

    const dash = await buildDashboard(userId);

    return NextResponse.json(dash);
  } catch (error) {
    return handleApiError(error);
  }
}
