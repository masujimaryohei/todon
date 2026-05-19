import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { BadRequestError, requireUser } from '@/lib/http';
import { createTeamSchema } from '@/lib/schemas';
import { deleteTeam, getTeamForUser, updateTeamName } from '@/server/teams';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { userId } = await requireUser(req);
    const { id } = await ctx.params;
    const team = await getTeamForUser(userId, id);
    return NextResponse.json(team);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { userId } = await requireUser(req);
    const { id } = await ctx.params;
    const body = await req.json();
    const payload = createTeamSchema.safeParse(body);
    if (!payload.success) {
      throw new BadRequestError('チーム名を確認してください');
    }

    const team = await updateTeamName(userId, id, payload.data.name);
    return NextResponse.json(team);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { userId } = await requireUser(req);
    const { id } = await ctx.params;
    await deleteTeam(userId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
