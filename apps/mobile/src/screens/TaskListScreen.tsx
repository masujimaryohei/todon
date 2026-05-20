import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Task } from '@todon/shared';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuthContext } from '../auth-context';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Tasks'>;

export default function TaskListScreen({ navigation }: Props) {
  const auth = useAuthContext();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!auth.token) {
      setTasks([]);
      return;
    }

    const rows = await auth.client.listTasks();
    setTasks(rows);
  }, [auth.client, auth.token]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity hitSlop={12} onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.navLink}>今日</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity hitSlop={12} style={styles.plus} onPress={() => navigation.navigate('TaskCreate')}>
          <Text style={styles.plusLabel}>＋</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'タスクの取得に失敗しました。API URL を確認してください。';

        Alert.alert('読み込みエラー', message);
      }
    })();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } catch {
      Alert.alert('再読込に失敗', '時間をおいて再度お試しください。');
    } finally {
      setRefreshing(false);
    }
  }

  async function onLogout() {
    if (auth.baseUrl) {
      await fetch(`${auth.baseUrl}/api/auth/logout`, {
        method: 'POST',
      }).catch(() => undefined);
    }

    await auth.updateToken(null);
  }

  return (
    <View style={styles.container}>
      <View style={styles.intro}>
        <View>
          <TouchableOpacity onPress={() => navigation.navigate('Teams')}>
            <Text style={styles.teamShortcut}>チーム →</Text>
          </TouchableOpacity>
          <Text style={styles.eyebrow}>個人タスク</Text>
          <Text style={styles.title}>今日のリスト</Text>
          <Text style={styles.note}>認証状態: {auth.token ? '同期中' : '未ログイン'}</Text>
        </View>

        <TouchableOpacity style={styles.logout} onPress={() => void onLogout()}>
          <Text style={styles.logoutLabel}>ログアウト</Text>
        </TouchableOpacity>
      </View>

      {!auth.token ? (
        <View style={{ paddingTop: 32 }}>
          <ActivityIndicator animating />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>まだタスクがありません</Text>
              <Text style={styles.emptyBody}>ヘッダの「＋」から最初のひとことを追加できます</Text>
            </View>
          )}
          contentContainerStyle={tasks.length === 0 ? styles.emptyPadding : styles.listPadding}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardStatus}>{item.status}</Text>
              </View>
              <Text style={styles.cardHint}>
                {item.importance}/{item.urgency}/{item.weight}
                {item.category ? ` · ${item.category.name}` : ''}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  intro: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  teamShortcut: {
    color: '#a5b4fc',
    fontWeight: '700',
    marginBottom: 6,
    fontSize: 14,
  },
  eyebrow: {
    letterSpacing: 6,
    color: '#059669',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 4,
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '600',
  },
  note: {
    marginTop: 4,
    color: '#475569',
    fontSize: 12,
  },
  logout: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logoutLabel: {
    color: '#6ee7b7',
    fontWeight: '600',
  },
  navLink: {
    color: '#6ee7b7',
    fontWeight: '600',
    fontSize: 14,
    paddingHorizontal: 8,
  },
  plus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  plusLabel: {
    color: '#34d399',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
  },
  emptyPadding: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 8,
    gap: 12,
  },
  listPadding: {
    paddingBottom: 96,
    paddingTop: 4,
  },
  empty: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#065f46',
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: '#031525',
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: '#ecfdf5',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyBody: {
    color: '#cbd5f5',
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#065f46',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0f172a',
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    color: '#f8fafc',
    fontWeight: '600',
  },
  cardStatus: {
    color: '#6ee7b7',
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 1,
  },
  cardHint: {
    color: '#94a3b8',
    fontSize: 12,
  },
});
