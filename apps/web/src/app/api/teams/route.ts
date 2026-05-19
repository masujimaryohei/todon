import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { BadRequestError, requireUser } from '@/lib/http';
import { createTeamSchema } from '@/lib/schemas';
import { createTeam, listTeamsForUser } from '@/server/teams';

export async function GET(req: Request) {
  try {
    const { userId } = await requireUser(req);
    const teams = await listTeamsForUser(userId);
    return NextResponse.json(teams);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await requireUser(req);
    const body = await req.json();
    const payload = createTeamSchema.safeParse(body);
    if (!payload.success) {
      throw new BadRequestError('チーム名を確認してください');
    }

    const team = await createTeam(userId, payload.data.name);
    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
