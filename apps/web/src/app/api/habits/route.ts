import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { BadRequestError, requireUser } from '@/lib/http';
import { createHabitSchema } from '@/lib/schemas';
import { createHabit, listHabits } from '@/server/habits';

export async function GET(req: Request) {
  try {
    const { userId } = await requireUser(req);
    return NextResponse.json(await listHabits(userId));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await requireUser(req);
    const body = await req.json();
    const payload = createHabitSchema.safeParse(body);
    if (!payload.success) {
      throw new BadRequestError('習慣の入力を確認してください');
    }

    const habit = await createHabit(userId, payload.data);
    return NextResponse.json(habit, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
