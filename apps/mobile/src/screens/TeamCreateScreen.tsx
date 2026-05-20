import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAuthContext } from '../auth-context';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'TeamCreate'>;

export default function TeamCreateScreen({ navigation }: Props) {
  const { client } = useAuthContext();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('チーム名を入力してください');
      return;
    }

    setLoading(true);
    try {
      const team = await client.createTeam({ name: trimmed });
      navigation.replace('TeamDetail', { teamId: team.id });
    } catch (error) {
      Alert.alert('作成に失敗', error instanceof Error ? error.message : '');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>チーム名</Text>
      <TextInput
        style={styles.input}
        placeholder="例: プロダクト A"
        placeholderTextColor="#94a3b8"
        value={name}
        onChangeText={setName}
        maxLength={64}
      />

      <TouchableOpacity
        style={[styles.button, loading ? styles.disabled : undefined]}
        disabled={loading}
        onPress={() => void onSubmit()}
      >
        <Text style={styles.buttonLabel}>{loading ? '作成中…' : '作成する'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancel} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelLabel}>キャンセル</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 20,
    gap: 8,
  },
  label: { color: '#a5b4fc', fontWeight: '600', fontSize: 12, textTransform: 'uppercase' },
  input: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3730a399',
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 14, android: 10 }),
    fontSize: 16,
    color: '#f8fafc',
  },
  button: {
    marginTop: 24,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonLabel: { color: '#eef2ff', fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.65 },
  cancel: {
    marginTop: 16,
    alignItems: 'center',
  },
  cancelLabel: { color: '#94a3b8', fontWeight: '600' },
});
