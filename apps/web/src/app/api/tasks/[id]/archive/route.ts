import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { requireUser } from '@/lib/http';
import { archiveTask } from '@/server/tasks';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, ctx: RouteCtx) {
  try {
    const { userId } = await requireUser(req);
    const { id } = await ctx.params;

    const task = await archiveTask(userId, id);

    return NextResponse.json(task);
  } catch (error) {
    return handleApiError(error);
  }
}
