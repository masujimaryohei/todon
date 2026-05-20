import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Team } from '@todon/shared';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuthContext } from '../auth-context';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'TaskCreate'>;

export default function TaskCreateScreen({ navigation }: Props) {
  const route = useRoute<RouteProp<AppStackParamList, 'TaskCreate'>>();
  const presetTeamId = route.params?.teamId ?? '';

  const { client } = useAuthContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [scope, setScope] = useState<'personal' | 'team'>(presetTeamId ? 'team' : 'personal');
  const [teamId, setTeamId] = useState(presetTeamId);
  const [assigneeId, setAssigneeId] = useState('');
  const [memberOptions, setMemberOptions] = useState<{ userId: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const rows = await client.listTeams();
        setTeams(rows);
        if (presetTeamId && rows.some((t) => t.id === presetTeamId)) {
          setTeamId(presetTeamId);
          setScope('team');
          return;
        }

        if (presetTeamId) {
          setTeamId('');
          setScope('personal');
        }
      } catch {
        setTeams([]);
      }
    })();
  }, [client, presetTeamId]);

  useEffect(() => {
    if (scope !== 'team' || !teamId) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const members = await client.listTeamMembers(teamId);
        if (cancelled) {
          return;
        }

        setMemberOptions(
          members.map((m) => ({
            userId: m.userId,
            label: m.user?.name ?? m.user?.email ?? m.userId,
          })),
        );
      } catch {
        if (!cancelled) {
          setMemberOptions([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, scope, teamId]);

  async function onSubmit() {
    const trimmedTitle = title.trim();

    if (trimmedTitle.length === 0) {
      Alert.alert('タイトルを入力してください', '最低限の入力項目です。');

      return;
    }

    if (scope === 'team' && !teamId) {
      Alert.alert('チームを選んでください');
      return;
    }

    setLoading(true);

    try {
      const task = await client.createTask({
        title: trimmedTitle,
        ...(description.trim() ? { description: description.trim() } : {}),
        scope,
        ...(scope === 'team' ? { teamId, assigneeId: assigneeId || undefined } : {}),
      });

      navigation.replace('TaskDetail', {
        taskId: task.id,
      });
    } catch (error) {
      Alert.alert('作成に失敗', error instanceof Error ? error.message : 'もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  }

  function selectPersonal() {
    setScope('personal');
    setTeamId('');
    setAssigneeId('');
  }

  function selectTeamMode() {
    setScope('team');
    setAssigneeId('');
    const firstId = presetTeamId && teams.some((t) => t.id === presetTeamId) ? presetTeamId : teams[0]?.id ?? '';

    setTeamId(firstId);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={styles.container}
    >
      <View style={styles.scopeRow}>
        <TouchableOpacity
          style={[styles.scopeChip, scope === 'personal' ? styles.scopeChipOn : undefined]}
          onPress={selectPersonal}
        >
          <Text style={[styles.scopeLabel, scope === 'personal' ? styles.scopeLabelOn : undefined]}>個人</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.scopeChip, scope === 'team' ? styles.scopeChipOn : undefined]}
          onPress={() => teams.length === 0 ? Alert.alert('チームがありません', 'チーム画面から作成してください。') : selectTeamMode()}
        >
          <Text style={[styles.scopeLabel, scope === 'team' ? styles.scopeLabelOn : undefined]}>チーム</Text>
        </TouchableOpacity>
      </View>

      {scope === 'team' ? (
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>チーム</Text>
          {teams.filter((t) => t.id).map((team) => (
            <TouchableOpacity
              key={team.id}
              style={[styles.teamPick, teamId === team.id ? styles.teamPickOn : undefined]}
              onPress={() => {
                setTeamId(team.id);
                setAssigneeId('');
              }}
            >
              <Text style={styles.teamPickLabel}>{team.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {scope === 'team' && teamId ? (
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>担当（任意）</Text>
          <TouchableOpacity
            style={[styles.teamPick, assigneeId === '' ? styles.teamPickOn : undefined]}
            onPress={() => setAssigneeId('')}
          >
            <Text style={styles.teamPickLabel}>未割当</Text>
          </TouchableOpacity>
          {memberOptions.map((m) => (
            <TouchableOpacity
              key={m.userId}
              style={[styles.teamPick, assigneeId === m.userId ? styles.teamPickOn : undefined]}
              onPress={() => setAssigneeId(m.userId)}
            >
              <Text style={styles.teamPickLabel}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <Text style={styles.label}>タイトル</Text>
      <TextInput
        placeholder="どんなひとつのタスクでもOK"
        style={styles.input}
        placeholderTextColor="#94a3b8"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={[styles.label, styles.spacingTop]}>詳細（任意）</Text>
      <TextInput
        placeholder="メモ / URL / メンバーへの共有内容"
        multiline
        style={[styles.input, styles.multiline]}
        placeholderTextColor="#94a3b8"
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity style={[styles.button, loading ? styles.disabled : undefined]} onPress={() => void onSubmit()} disabled={loading}>
        <Text style={styles.buttonLabel}>{loading ? '送信中…' : '保存する'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancel} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelLabel}>キャンセル</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 20,
    gap: 8,
  },
  scopeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  scopeChip: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 10,
    alignItems: 'center',
  },
  scopeChipOn: {
    borderColor: '#6366f1',
    backgroundColor: '#312e8177',
  },
  scopeLabel: { color: '#94a3b8', fontWeight: '700' },
  scopeLabelOn: { color: '#c7d2fe' },
  section: {
    marginBottom: 8,
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#312e8188',
    padding: 12,
    backgroundColor: '#0f172acc',
  },
  sectionEyebrow: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  teamPick: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  teamPickOn: {
    borderColor: '#818cf8',
    backgroundColor: '#1e1b4b77',
  },
  teamPickLabel: { color: '#e2e8f0', fontWeight: '600' },
  label: {
    color: '#a7f3d0',
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  spacingTop: {
    marginTop: 16,
  },
  input: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#065f4699',
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 14, android: 10 }),
    fontSize: 16,
    color: '#f8fafc',
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: 24,
    backgroundColor: '#34d399',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#022c22',
    fontWeight: '700',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.65,
  },
  cancel: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelLabel: {
    color: '#cbd5f5',
    fontSize: 15,
    fontWeight: '600',
  },
});
