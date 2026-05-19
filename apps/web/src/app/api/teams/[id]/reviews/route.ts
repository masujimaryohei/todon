import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { requireUser } from '@/lib/http';
import { generateTeamWeeklyReview } from '@/server/weekly-review';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { userId } = await requireUser(req);
    const { id } = await ctx.params;

    const review = await generateTeamWeeklyReview(userId, id);
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
