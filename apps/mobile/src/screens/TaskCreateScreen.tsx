import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';

import { useAuthContext } from '../auth-context';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'TaskCreate'>;

export default function TaskCreateScreen({ navigation }: Props) {
  const { client } = useAuthContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    const trimmedTitle = title.trim();

    if (trimmedTitle.length === 0) {
      Alert.alert('タイトルを入力してください', '最低限の入力項目です。');

      return;
    }

    setLoading(true);

    try {
      const task = await client.createTask({
        title: trimmedTitle,
        ...(description.trim() ? { description: description.trim() } : {}),
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={styles.container}
    >
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
