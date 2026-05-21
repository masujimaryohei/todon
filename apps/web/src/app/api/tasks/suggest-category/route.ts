import { NextResponse } from 'next/server';
import { suggestCategoryName } from '@todon/shared';

import { handleApiError } from '@/lib/api-utils';
import { BadRequestError, requireUser } from '@/lib/http';

export async function GET(req: Request) {
  try {
    await requireUser(req);
    const title = new URL(req.url).searchParams.get('title') ?? '';
    if (!title.trim()) {
      throw new BadRequestError('title が必要です');
    }

    return NextResponse.json(suggestCategoryName(title));
  } catch (error) {
    return handleApiError(error);
  }
}
