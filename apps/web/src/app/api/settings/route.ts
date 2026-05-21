import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { BadRequestError, requireUser } from '@/lib/http';
import { updateSettingsSchema } from '@/lib/schemas';
import { getOrCreateSettings, updateSettings } from '@/server/settings';

export async function GET(req: Request) {
  try {
    const { userId } = await requireUser(req);
    const settings = await getOrCreateSettings(userId);
    return NextResponse.json(settings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await requireUser(req);
    const body = await req.json();
    const payload = updateSettingsSchema.safeParse(body);
    if (!payload.success) {
      throw new BadRequestError('設定内容を確認してください');
    }

    const settings = await updateSettings(userId, payload.data);
    return NextResponse.json(settings);
  } catch (error) {
    return handleApiError(error);
  }
}
