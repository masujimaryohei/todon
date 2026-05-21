import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { BadRequestError, requireUser } from '@/lib/http';
import { habitLogSchema } from '@/lib/schemas';
import { toggleHabitLog } from '@/server/habits';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { userId } = await requireUser(req);
    const { id } = await ctx.params;
    const body = await req.json();
    const payload = habitLogSchema.safeParse(body);
    if (!payload.success) {
      throw new BadRequestError('日付を確認してください');
    }

    const result = await toggleHabitLog(userId, id, payload.data.day);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
