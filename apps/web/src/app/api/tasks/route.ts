import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { BadRequestError, requireUser } from '@/lib/http';
import { createTaskSchema } from '@/lib/schemas';
import { createTask, listTasks } from '@/server/tasks';

export async function GET(req: Request) {
  try {
    const { userId } = await requireUser(req);

    const { searchParams } = new URL(req.url);
    const archived = searchParams.get('archived') === 'true';

    const rows = await listTasks(userId, archived);
    return NextResponse.json(rows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await requireUser(req);
    const body = await req.json();
    const payload = createTaskSchema.safeParse(body);
    if (!payload.success) {
      throw new BadRequestError('タスク入力を確認してください');
    }

    const dueAt = payload.data.dueAt ? new Date(payload.data.dueAt) : null;

    const task = await createTask(userId, {
      ...payload.data,
      dueAt,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
