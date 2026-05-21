import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { BadRequestError, requireUser } from '@/lib/http';
import { createTemplateSchema } from '@/lib/schemas';
import { createTemplate, listTemplates } from '@/server/templates';

export async function GET(req: Request) {
  try {
    const { userId } = await requireUser(req);
    return NextResponse.json(await listTemplates(userId));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await requireUser(req);
    const body = await req.json();
    const payload = createTemplateSchema.safeParse(body);
    if (!payload.success) {
      throw new BadRequestError('テンプレート内容を確認してください');
    }

    const tpl = await createTemplate(userId, payload.data);
    return NextResponse.json(tpl, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
