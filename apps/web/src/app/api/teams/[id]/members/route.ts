import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { BadRequestError, requireUser } from '@/lib/http';
import { inviteMemberSchema } from '@/lib/schemas';
import { inviteByEmail, listTeamMembers } from '@/server/teams';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { userId } = await requireUser(req);
    const { id } = await ctx.params;
    const members = await listTeamMembers(userId, id);
    return NextResponse.json(members);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { userId } = await requireUser(req);
    const { id } = await ctx.params;
    const body = await req.json();
    const payload = inviteMemberSchema.safeParse(body);
    if (!payload.success) {
      throw new BadRequestError('メールアドレスを確認してください');
    }

    const result = await inviteByEmail(userId, id, payload.data.email);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
