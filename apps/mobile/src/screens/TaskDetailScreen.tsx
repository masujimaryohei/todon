import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Task } from '@todon/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
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
  const [task, setTask] = useState<Task | null>(null);

  const load = useCallback(async () => {
    const row = await client.getTask(taskId);
    setTask(row);
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

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>{task.title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => void markDone()}>
          <Text style={styles.primaryLabel}>完了にする</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => void archive()}>
          <Text style={styles.secondaryLabel}>アーカイブ</Text>
        </TouchableOpacity>
      </View>

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
          <Text style={styles.meta}>
            アーカイブ: {new Date(task.archivedAt).toLocaleString('ja-JP')}
          </Text>
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
    gap: 20,
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
  actions: {
    gap: 10,
    marginTop: 8,
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
  body: {
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 22,
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
});
