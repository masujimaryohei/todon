import type { TaskTemplate, TaskTemplatePayload } from '@todon/shared';

import { BadRequestError, NotFoundError } from '@/lib/http';
import { prisma } from '@/lib/prisma';

function mapTemplate(row: {
  id: string;
  userId: string;
  name: string;
  payloadJson: string;
  createdAt: Date;
  updatedAt: Date;
}): TaskTemplate {
  let payload: TaskTemplatePayload = { title: '' };
  try {
    payload = JSON.parse(row.payloadJson) as TaskTemplatePayload;
  } catch {
    payload = { title: row.name };
  }

  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    payload,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listTemplates(userId: string) {
  const rows = await prisma.taskTemplate.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });

  return rows.map(mapTemplate);
}

export async function createTemplate(
  userId: string,
  input: { name: string; payload: TaskTemplatePayload },
) {
  const name = input.name.trim();
  if (!name) {
    throw new BadRequestError('テンプレート名を入力してください');
  }

  if (!input.payload.title?.trim()) {
    throw new BadRequestError('テンプレートのタイトルが必要です');
  }

  const row = await prisma.taskTemplate.create({
    data: {
      userId,
      name,
      payloadJson: JSON.stringify(input.payload),
    },
  });

  return mapTemplate(row);
}

export async function deleteTemplate(userId: string, templateId: string) {
  const row = await prisma.taskTemplate.findFirst({ where: { id: templateId, userId } });
  if (!row) {
    throw new NotFoundError('テンプレートが見つかりません');
  }

  await prisma.taskTemplate.delete({ where: { id: templateId } });
}
