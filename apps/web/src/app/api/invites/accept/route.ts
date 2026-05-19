import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { BadRequestError, requireUser } from '@/lib/http';
import { acceptInviteSchema } from '@/lib/schemas';
import { acceptInvite } from '@/server/teams';

export async function POST(req: Request) {
  try {
    const { userId } = await requireUser(req);
    const body = await req.json();
    const payload = acceptInviteSchema.safeParse(body);
    if (!payload.success) {
      throw new BadRequestError('招待トークンを確認してください');
    }

    const team = await acceptInvite(userId, payload.data.token);
    return NextResponse.json(team);
  } catch (error) {
    return handleApiError(error);
  }
}
