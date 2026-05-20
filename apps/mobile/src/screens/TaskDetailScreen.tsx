import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
  Task,
  TaskActivityLog,
  TaskComment,
  TaskWithPeople,
  TeamMember,
} from '@todon/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuthContext } from '../auth-context';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'TaskDetail'>;

const statusJp: Record<Task['status'], string> = {
  todo: '未着手',
  doing: '着手中',
  done: '完了',
  pending: '保留',
  canceled: '中止',
};

export default function TaskDetailScreen({ route, navigation }: Props) {
  const { token, client } = useAuthContext();
  const { taskId } = route.params;

  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<TaskWithPeople | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [activity, setActivity] = useState<TaskActivityLog[]>([]);
  const [pendingAssigneeId, setPendingAssigneeId] = useState<string | ''>('');
  const [commentBody, setCommentBody] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const row = await client.getTask(taskId);
    setTask(row);
    setPendingAssigneeId(typeof row.assigneeId === 'string' ? row.assigneeId : '');

    if (row.scope === 'team' && row.teamId) {
      try {
        const m = await client.listTeamMembers(row.teamId);
        setMembers(m);
      } catch {
        setMembers([]);
      }

      try {
        const [c, a] = await Promise.all([
          client.listTaskComments(taskId),
          client.listTaskActivity(taskId),
        ]);
        setComments(c);
        setActivity(a);
      } catch {
        setComments([]);
        setActivity([]);
      }
    } else {
      setMembers([]);
      setComments([]);
      setActivity([]);
    }
  }, [client, taskId]);

  useEffect(() => {
    let alive = true;

    void (async () => {
      if (!token) {
        return;
      }

      setLoading(true);

      try {
        await load();
      } catch (error) {
        Alert.alert(
          '読み込みに失敗',
          error instanceof Error ? error.message : '詳細情報を取得できませんでした',
        );

        navigation.goBack();
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [load, navigation, token]);

  const subtitle = useMemo(() => {
    if (!task) {
      return '';
    }

    return `${statusJp[task.status] ?? task.status} / ${task.importance} / ${task.urgency} / ${task.weight}`;
  }, [task]);

  async function toggleSubtask(subId: string, completed: boolean) {
    if (!task) {
      return;
    }

    try {
      await client.updateSubtask(subId, { completed });

      await load();
    } catch (error) {
      Alert.alert('更新できませんでした', error instanceof Error ? error.message : '');
    }
  }

  async function markDone() {
    if (!task) {
      return;
    }

    try {
      await client.updateTask(task.id, { status: 'done' });
      navigation.goBack();
    } catch (error) {
      Alert.alert('更新できませんでした', error instanceof Error ? error.message : '');
    }
  }

  async function archive() {
    if (!task) {
      return;
    }

    try {
      await client.archiveTask(task.id);
      navigation.goBack();
    } catch (error) {
      Alert.alert('アーカイブに失敗', error instanceof Error ? error.message : '');
    }
  }

  async function applyAssignee() {
    if (!task || task.scope !== 'team') {
      return;
    }

    const nextVal = pendingAssigneeId === '' ? null : pendingAssigneeId;

    setBusy(true);
    try {
      await client.updateTask(task.id, { assigneeId: nextVal });
      await load();
    } catch (error) {
      Alert.alert('担当の更新に失敗', error instanceof Error ? error.message : '');
    } finally {
      setBusy(false);
    }
  }

  async function submitComment() {
    const trimmed = commentBody.trim();
    if (!task || trimmed.length === 0) {
      return;
    }

    setBusy(true);
    try {
      const created = await client.createTaskComment(task.id, { body: trimmed });
      setComments((prev) => [...prev, created]);
      setCommentBody('');
    } catch (error) {
      Alert.alert('投稿に失敗', error instanceof Error ? error.message : '');
    } finally {
      setBusy(false);
    }
  }

  if (loading || !task) {
    return (
      <View style={[styles.flexCenter, styles.page]}>
        <ActivityIndicator color="#34d399" />
      </View>
    );
  }

  const progress =
    task.subtasks && task.subtasks.length > 0
      ? Math.round((task.subtasks.filter((sub) => sub.completed).length / task.subtasks.length) * 100)
      : null;

  const isTeam = task.scope === 'team' && task.teamId;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>{task.title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {isTeam ? (
        <View style={styles.teamBanner}>
          <Text style={styles.teamBannerText}>チームタスク</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TeamDetail', { teamId: task.teamId! })}>
            <Text style={styles.teamBannerLink}>チーム画面へ</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => void markDone()}>
          <Text style={styles.primaryLabel}>完了にする</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => void archive()}>
          <Text style={styles.secondaryLabel}>アーカイブ</Text>
        </TouchableOpacity>
      </View>

      {isTeam ? (
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>協業</Text>
          <Text style={styles.meta}>
            オーナー: {task.owner?.name ?? task.owner?.email ?? '—'}
          </Text>
          <Text style={styles.meta}>
            担当: {task.assignee?.name ?? task.assignee?.email ?? '未割当'}
          </Text>

          <Text style={[styles.miniLabel, { marginTop: 10 }]}>担当を変更</Text>
          <TouchableOpacity
            style={[styles.assignRow, pendingAssigneeId === '' ? styles.assignRowOn : undefined]}
            onPress={() => setPendingAssigneeId('')}
          >
            <Text style={styles.assignText}>未割当</Text>
          </TouchableOpacity>
          {members.map((m) => (
            <TouchableOpacity
              key={m.userId}
              style={[
                styles.assignRow,
                pendingAssigneeId === m.userId ? styles.assignRowOn : undefined,
              ]}
              onPress={() => setPendingAssigneeId(m.userId)}
            >
              <Text style={styles.assignText}>{m.user?.name ?? m.user?.email ?? m.userId}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            disabled={busy}
            style={[styles.assignSubmit, busy ? styles.opacityDim : undefined]}
            onPress={() => void applyAssignee()}
          >
            <Text style={styles.assignSubmitLabel}>担当を適用</Text>
          </TouchableOpacity>

          <Text style={[styles.miniLabel, { marginTop: 18 }]}>コメント</Text>
          {(comments ?? []).length === 0 ? (
            <Text style={styles.bodyMuted}>まだありません</Text>
          ) : (
            (comments ?? []).map((c) => (
              <View key={c.id} style={styles.commentBox}>
                <Text style={styles.commentMeta}>
                  {c.user?.name ?? c.user?.email ?? 'ユーザー'} ·{' '}
                  {new Date(c.createdAt).toLocaleString('ja-JP')}
                </Text>
                <Text style={styles.commentBody}>{c.body}</Text>
              </View>
            ))
          )}
          <TextInput
            style={styles.commentInput}
            placeholder="コメントを書く"
            placeholderTextColor="#64748b"
            value={commentBody}
            onChangeText={setCommentBody}
            multiline
          />
          <TouchableOpacity
            disabled={busy || !commentBody.trim()}
            style={[styles.commentBtn, busy || !commentBody.trim() ? styles.opacityDim : undefined]}
            onPress={() => void submitComment()}
          >
            <Text style={styles.commentBtnLabel}>投稿</Text>
          </TouchableOpacity>

          <Text style={[styles.miniLabel, { marginTop: 14 }]}>履歴（直近）</Text>
          {activity.slice(0, 12).length === 0 ? (
            <Text style={styles.bodyMuted}>履歴がありません</Text>
          ) : (
            activity.slice(0, 12).map((log) => (
              <Text key={log.id} style={styles.activityLine}>
                {new Date(log.createdAt).toLocaleString('ja-JP')} · {log.action}
                {log.before || log.after ? ` (${log.before ?? '—'} → ${log.after ?? '—'})` : ''}
              </Text>
            ))
          )}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>詳細</Text>
        <Text style={styles.body}>{task.description?.trim() ? task.description : '（詳細なし）'}</Text>

        <Text style={styles.meta}>
          {task.dueAt
            ? `期限: ${new Date(task.dueAt).toLocaleString('ja-JP')}`
            : `期限: 設定なし / タイプ: ${task.dueType}`}
          {task.category ? ` · カテゴリ: ${task.category.name}` : ''}
        </Text>

        {task.archivedAt ? (
          <Text style={styles.meta}>アーカイブ: {new Date(task.archivedAt).toLocaleString('ja-JP')}</Text>
        ) : null}

        {task.deletedAt ? (
          <Text style={[styles.meta, { color: '#f97316' }]}>
            削除済: {new Date(task.deletedAt).toLocaleString('ja-JP')}
          </Text>
        ) : null}
      </View>

      {progress !== null ? <Text style={styles.progress}>サブタスク進捗: {progress}%</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>サブタスク</Text>

        {(task.subtasks ?? []).length === 0 ? (
          <Text style={styles.body}>サブタスクはまだありません</Text>
        ) : (
          (task.subtasks ?? []).map((sub) => (
            <TouchableOpacity
              key={sub.id}
              style={[styles.checkboxRow]}
              activeOpacity={0.8}
              onPress={() => void toggleSubtask(sub.id, !sub.completed)}
            >
              <View style={[styles.badge, sub.completed ? styles.badgeDone : styles.badgeOpen]}>
                <Text style={[styles.badgeLabel, sub.completed ? styles.strikeLabel : undefined]}>{sub.title}</Text>

                <Text style={styles.badgeHint}>{sub.completed ? '完了' : 'タップで切り替え'}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#020617',
  },
  flexCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#020617',
    gap: 16,
  },
  title: {
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '600',
    lineHeight: 32,
  },
  subtitle: {
    marginTop: 4,
    color: '#cbd5f5',
    fontSize: 13,
    lineHeight: 18,
  },
  teamBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4338ca',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1e1b4b44',
    gap: 8,
  },
  teamBannerText: { color: '#c7d2fe', fontWeight: '700', fontSize: 13 },
  teamBannerLink: { color: '#a5b4fc', fontWeight: '700' },
  actions: {
    gap: 10,
    marginTop: 4,
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  primaryBtn: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: '#34d399',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  primaryLabel: {
    color: '#022c22',
    fontWeight: '700',
  },
  secondaryBtn: {
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  secondaryLabel: {
    color: '#fcd34d',
    fontWeight: '600',
  },
  progress: {
    color: '#6ee7b7',
    fontWeight: '600',
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#065f46',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0f172a',
    gap: 10,
  },
  sectionEyebrow: {
    color: '#6ee7b7',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 3,
    fontSize: 11,
  },
  miniLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  body: {
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 22,
  },
  bodyMuted: {
    color: '#64748b',
    fontSize: 13,
  },
  meta: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  checkboxRow: {
    width: '100%',
  },
  badge: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
    borderColor: '#1e293b',
    marginBottom: 8,
    backgroundColor: '#020617',
  },
  badgeDone: {
    borderColor: '#04785740',
    backgroundColor: '#022c2299',
    opacity: 0.85,
  },
  badgeOpen: {
    borderColor: '#065f46',
    backgroundColor: '#031525bb',
  },
  badgeLabel: {
    color: '#f8fafc',
    fontWeight: '600',
  },
  badgeHint: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  strikeLabel: {
    textDecorationLine: 'line-through',
    color: '#a7f3d0aa',
  },
  assignRow: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 6,
  },
  assignRowOn: {
    borderColor: '#818cf8',
    backgroundColor: '#1e1b4b55',
  },
  assignText: { color: '#e2e8f0', fontWeight: '600' },
  assignSubmit: {
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#4338ca',
    paddingVertical: 10,
    alignItems: 'center',
  },
  assignSubmitLabel: { color: '#eef2ff', fontWeight: '700', fontSize: 13 },
  opacityDim: { opacity: 0.55 },
  commentBox: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
    gap: 4,
  },
  commentMeta: { color: '#64748b', fontSize: 11 },
  commentBody: { color: '#e2e8f0', fontSize: 14, lineHeight: 20 },
  commentInput: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
    padding: 12,
    minHeight: 72,
    textAlignVertical: 'top',
    color: '#f8fafc',
    fontSize: 14,
  },
  commentBtn: {
    marginTop: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  commentBtnLabel: {
    color: '#0f172a',
    fontWeight: '700',
  },
  activityLine: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
});
