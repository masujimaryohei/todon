import { NextResponse } from 'next/server';
import { suggestSubtasks } from '@todon/shared';

import { handleApiError } from '@/lib/api-utils';
import { BadRequestError, requireUser } from '@/lib/http';
import { suggestSubtasksSchema } from '@/lib/schemas';

export async function POST(req: Request) {
  try {
    await requireUser(req);
    const body = await req.json();
    const payload = suggestSubtasksSchema.safeParse(body);
    if (!payload.success) {
      throw new BadRequestError('タイトルを確認してください');
    }

    return NextResponse.json({ suggestions: suggestSubtasks(payload.data.title) });
  } catch (error) {
    return handleApiError(error);
  }
}
