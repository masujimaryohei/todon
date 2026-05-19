import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { requireUser } from '@/lib/http';
import { listTaskActivity } from '@/server/activity';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { userId } = await requireUser(req);
    const { id } = await ctx.params;
    const logs = await listTaskActivity(userId, id);
    return NextResponse.json(logs);
  } catch (error) {
    return handleApiError(error);
  }
}
