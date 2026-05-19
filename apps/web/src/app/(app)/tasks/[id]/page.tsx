import { notFound, redirect } from 'next/navigation';

import { TaskDetailClient } from '@/components/task-detail-client';
import { getCurrentUserId } from '@/lib/auth/session';
import { NotFoundError } from '@/lib/http';
import { getTask } from '@/server/tasks';
import { listTeamMembers } from '@/server/teams';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TaskDetailPage({ params }: Props) {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect('/login');
  }

  const { id } = await params;

  let task;

  try {
    task = await getTask(userId, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }

  const members =
    task.scope === 'team' && task.teamId ? await listTeamMembers(userId, task.teamId) : [];

  return <TaskDetailClient task={task} members={members} />;
}
