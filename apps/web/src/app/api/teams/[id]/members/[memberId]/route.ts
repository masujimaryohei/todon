import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { BadRequestError, requireUser } from '@/lib/http';
import { updateMemberRoleSchema } from '@/lib/schemas';
import { removeMember, updateMemberRole } from '@/server/teams';

type Ctx = { params: Promise<{ id: string; memberId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { userId } = await requireUser(req);
    const { id, memberId } = await ctx.params;
    const body = await req.json();
    const payload = updateMemberRoleSchema.safeParse(body);
    if (!payload.success) {
      throw new BadRequestError('ロールを確認してください');
    }

    const member = await updateMemberRole(userId, id, memberId, payload.data.role);
    return NextResponse.json(member);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { userId } = await requireUser(req);
    const { id, memberId } = await ctx.params;
    await removeMember(userId, id, memberId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
