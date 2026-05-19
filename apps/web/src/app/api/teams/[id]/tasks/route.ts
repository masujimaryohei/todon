import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { requireUser } from '@/lib/http';
import { listTeamTasks } from '@/server/team-tasks';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { userId } = await requireUser(req);
    const { id } = await ctx.params;
    const { searchParams } = new URL(req.url);
    const archived = searchParams.get('archived') === 'true';

    const tasks = await listTeamTasks(userId, id, archived);
    return NextResponse.json(tasks);
  } catch (error) {
    return handleApiError(error);
  }
}
