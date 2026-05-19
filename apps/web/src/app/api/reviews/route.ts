import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { requireUser } from '@/lib/http';
import { generateWeeklyReview, listWeeklyReviews } from '@/server/weekly-review';

export async function GET(req: Request) {
  try {
    const { userId } = await requireUser(req);

    const reviews = await listWeeklyReviews(userId);

    return NextResponse.json(reviews);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await requireUser(req);

    const review = await generateWeeklyReview(userId);

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
