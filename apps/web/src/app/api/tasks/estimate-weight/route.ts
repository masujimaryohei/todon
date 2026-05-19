import { estimateTaskWeight } from '@todon/shared';
import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { requireUser } from '@/lib/http';

export async function GET(req: Request) {
  try {
    await requireUser(req);

    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') ?? '';

    return NextResponse.json({ weight: estimateTaskWeight(title) });
  } catch (error) {
    return handleApiError(error);
  }
}
