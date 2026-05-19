import type { Task as PrismaTask } from '@prisma/client';
import type { TeamRole } from '@todon/shared';

import { ForbiddenError, NotFoundError } from '@/lib/http';
import { prisma } from '@/lib/prisma';

export function isTeamRole(value: string): value is TeamRole {
  return value === 'owner' || value === 'admin' || value === 'member';
}

export async function getMembership(userId: string, teamId: string) {
  return prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    include: { user: { select: { id: true, email: true, name: true, createdAt: true } } },
  });
}

export async function requireMembership(userId: string, teamId: string) {
  const membership = await getMembership(userId, teamId);
  if (!membership) {
    throw new ForbiddenError('このチームに参加していません');
  }

  return membership;
}

export async function requireTeamAdmin(userId: string, teamId: string) {
  const membership = await requireMembership(userId, teamId);
  if (membership.role !== 'owner' && membership.role !== 'admin') {
    throw new ForbiddenError('管理者権限が必要です');
  }

  return membership;
}

export async function requireTeamOwner(userId: string, teamId: string) {
  const membership = await requireMembership(userId, teamId);
  if (membership.role !== 'owner') {
    throw new ForbiddenError('オーナー権限が必要です');
  }

  return membership;
}

export async function listUserTeamIds(userId: string) {
  const rows = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });

  return rows.map((r) => r.teamId);
}

export async function canAccessTask(userId: string, task: PrismaTask) {
  if (task.deletedAt) {
    return false;
  }

  if (task.scope === 'personal') {
    return task.userId === userId;
  }

  if (task.teamId) {
    const membership = await getMembership(userId, task.teamId);
    return Boolean(membership);
  }

  return false;
}

export async function canEditTask(userId: string, task: PrismaTask) {
  if (!(await canAccessTask(userId, task))) {
    return false;
  }

  if (task.scope === 'personal') {
    return task.userId === userId;
  }

  if (!task.teamId) {
    return false;
  }

  const membership = await getMembership(userId, task.teamId);
  if (!membership) {
    return false;
  }

  if (membership.role === 'owner' || membership.role === 'admin') {
    return true;
  }

  return task.assigneeId === userId || task.ownerId === userId;
}

export async function requireTaskAccess(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({ where: { id: taskId, deletedAt: null } });
  if (!task) {
    throw new NotFoundError('タスクが見つかりません');
  }

  if (!(await canAccessTask(userId, task))) {
    throw new ForbiddenError('このタスクを閲覧する権限がありません');
  }

  return task;
}

export async function requireTaskEdit(userId: string, taskId: string) {
  const task = await requireTaskAccess(userId, taskId);

  if (!(await canEditTask(userId, task))) {
    throw new ForbiddenError('このタスクを編集する権限がありません');
  }

  return task;
}
