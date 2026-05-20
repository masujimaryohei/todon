import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TaskWithPeople, Team, TeamMember } from '@todon/shared';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuthContext } from '../auth-context';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'TeamDetail'>;

export default function TeamDetailScreen({ route, navigation }: Props) {
  const { teamId } = route.params;
  const { client, token } = useAuthContext();

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<TaskWithPeople[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [t, mts, tk] = await Promise.all([
      client.getTeam(teamId),
      client.listTeamMembers(teamId),
      client.listTeamTasks(teamId),
    ]);

    setTeam(t);
    setMembers(mts);
    setTasks(tk);
  }, [client, teamId]);

  useEffect(() => {
    let alive = true;

    void (async () => {
      if (!token) {
        return;
      }

      try {
        setLoading(true);
        await refresh();
      } catch (error) {
        Alert.alert('読み込みエラー', error instanceof Error ? error.message : '');
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
  }, [navigation, refresh, token]);

  const canAdmin = team?.myRole === 'owner' || team?.myRole === 'admin';

  async function onInvite() {
    const mail = inviteEmail.trim().toLowerCase();
    if (!mail.includes('@')) {
      Alert.alert('メールアドレスを入力してください');
      return;
    }

    setBusy(true);
    try {
      const result = await client.inviteTeamMember(teamId, { email: mail });
      if (result.type === 'member') {
        Alert.alert('参加済みユーザー', 'そのメールのユーザーはすでに追加されました');
      } else if (result.invite?.token) {
        Alert.alert(
          '招待を発行しました',
          `未登録向けです。参加者は「招待トークンで参加」に次の値を入力します。\n\n${result.invite.token}`,
        );
      }

      setInviteEmail('');
      await refresh();
    } catch (error) {
      Alert.alert('招待に失敗', error instanceof Error ? error.message : '');
    } finally {
      setBusy(false);
    }
  }

  async function onTeamReview() {
    setBusy(true);
    try {
      await client.generateTeamWeeklyReview(teamId);
      Alert.alert('完了', 'チーム振り返りを生成しました。一覧は Web の振り返り画面と同様に API で取得できます。');
    } catch (error) {
      Alert.alert('失敗', error instanceof Error ? error.message : '');
    } finally {
      setBusy(false);
    }
  }

  function memberLabel(member: TeamMember): string {
    return member.user?.name ?? member.user?.email ?? member.userId;
  }

  if (loading || !team) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
      <Text style={styles.title}>{team.name}</Text>

      <View style={styles.row}>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('TaskCreate', { teamId })}>
          <Text style={styles.btnPrimaryLabel}>タスク作成</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnGhost} onPress={() => void refresh()}>
          <Text style={styles.btnGhostLabel}>更新</Text>
        </TouchableOpacity>
      </View>

      {canAdmin ? (
        <>
          <Text style={styles.sectionTitle}>招待（メール）</Text>
          <View style={styles.inviteRow}>
            <TextInput
              style={styles.inviteInput}
              placeholder="email@example.com"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              keyboardType="email-address"
              value={inviteEmail}
              onChangeText={setInviteEmail}
            />
            <TouchableOpacity
              disabled={busy}
              style={[styles.inviteBtn, busy ? styles.disabled : undefined]}
              onPress={() => void onInvite()}
            >
              <Text style={styles.inviteBtnLabel}>招待</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity disabled={busy} style={styles.reviewBtn} onPress={() => void onTeamReview()}>
            <Text style={styles.reviewBtnLabel}>今週のチーム振り返りを生成</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.muted}>招待・チーム振り返り生成はオーナー/管理者のみ</Text>
      )}

      <Text style={styles.sectionTitle}>メンバー（{members.length}）</Text>
      {members.map((m) => (
        <View key={m.id} style={styles.memberRow}>
          <Text style={styles.memberName}>{memberLabel(m)}</Text>
          <Text style={styles.memberRole}>{m.role}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>チームタスク</Text>

      {tasks.length === 0 ? (
        <Text style={styles.muted}>チームタスクはまだありません</Text>
      ) : (
        tasks.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.taskCard}
            onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
          >
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskHint}>
              {item.status}
              {item.assignee ? ` · 担当: ${item.assignee.name ?? item.assignee.email}` : ''}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: '#020617', padding: 20, gap: 10, paddingBottom: 48 },
  scroll: { flex: 1, backgroundColor: '#020617' },
  centered: { flex: 1, backgroundColor: '#020617', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#f8fafc' },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  btnPrimary: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  btnPrimaryLabel: { color: '#eef2ff', fontWeight: '700' },
  btnGhost: { borderRadius: 10, borderWidth: 1, borderColor: '#475569', paddingVertical: 10, paddingHorizontal: 14 },
  btnGhostLabel: { color: '#94a3b8', fontWeight: '600' },
  disabled: { opacity: 0.55 },
  sectionTitle: { color: '#c7d2fe', fontWeight: '700', marginTop: 8, fontSize: 13 },
  muted: { color: '#64748b', fontSize: 13 },
  inviteRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  inviteInput: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 10, android: 8 }),
    fontSize: 15,
  },
  inviteBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  inviteBtnLabel: { color: '#eef2ff', fontWeight: '700', fontSize: 13 },
  reviewBtn: { marginVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#6366f1', paddingVertical: 10 },
  reviewBtnLabel: { color: '#a5b4fc', fontWeight: '600', textAlign: 'center' },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  memberName: { color: '#e2e8f0', flex: 1 },
  memberRole: { color: '#64748b', fontSize: 12 },
  taskCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#312e81',
    padding: 12,
    backgroundColor: '#0f172a',
    gap: 4,
  },
  taskTitle: { color: '#f8fafc', fontWeight: '600', fontSize: 15 },
  taskHint: { color: '#94a3b8', fontSize: 12 },
});
