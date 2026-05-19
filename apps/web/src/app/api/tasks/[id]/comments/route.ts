import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { BadRequestError, requireUser } from '@/lib/http';
import { createCommentSchema } from '@/lib/schemas';
import { createTaskComment, listTaskComments } from '@/server/comments';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { userId } = await requireUser(req);
    const { id } = await ctx.params;
    const comments = await listTaskComments(userId, id);
    return NextResponse.json(comments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { userId } = await requireUser(req);
    const { id } = await ctx.params;
    const body = await req.json();
    const payload = createCommentSchema.safeParse(body);
    if (!payload.success) {
      throw new BadRequestError('コメントを確認してください');
    }

    const comment = await createTaskComment(userId, id, payload.data.body);
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
