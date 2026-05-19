import { notFound, redirect } from 'next/navigation';

import { TeamDetailClient } from '@/components/team-detail-client';
import { getCurrentUserId } from '@/lib/auth/session';
import { NotFoundError } from '@/lib/http';
import { listTeamTasks } from '@/server/team-tasks';
import { getTeamForUser, listTeamMembers } from '@/server/teams';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TeamDetailPage({ params }: Props) {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect('/login');
  }

  const { id } = await params;

  let team;
  let members;
  let tasks;

  try {
    [team, members, tasks] = await Promise.all([
      getTeamForUser(userId, id),
      listTeamMembers(userId, id),
      listTeamTasks(userId, id, false),
    ]);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }

  return <TeamDetailClient team={team} members={members} tasks={tasks} />;
}
