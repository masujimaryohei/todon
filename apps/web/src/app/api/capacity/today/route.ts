import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { BadRequestError, requireUser } from '@/lib/http';
import { capacitySchema } from '@/lib/schemas';
import { getTodayCapacity, setTodayCapacity } from '@/server/capacity';

export async function GET(req: Request) {
  try {
    const { userId } = await requireUser(req);
    const level = await getTodayCapacity(userId);

    return NextResponse.json({ level });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await requireUser(req);
    const body = await req.json();
    const payload = capacitySchema.safeParse(body);

    if (!payload.success) {
      throw new BadRequestError('キャパシティの値を確認してください');
    }

    const level = await setTodayCapacity(userId, payload.data.level);

    return NextResponse.json({ level });
  } catch (error) {
    return handleApiError(error);
  }
}
