import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { BadRequestError, requireUser } from '@/lib/http';
import { createProjectSchema } from '@/lib/schemas';
import { createProject, listProjects } from '@/server/projects';

export async function GET(req: Request) {
  try {
    const { userId } = await requireUser(req);
    return NextResponse.json(await listProjects(userId));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await requireUser(req);
    const body = await req.json();
    const payload = createProjectSchema.safeParse(body);
    if (!payload.success) {
      throw new BadRequestError('プロジェクト名を確認してください');
    }

    const project = await createProject(userId, payload.data);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
