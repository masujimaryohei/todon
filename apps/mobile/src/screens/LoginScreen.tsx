import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuthContext } from '../auth-context';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { client, updateToken, baseUrl } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!baseUrl) {
      Alert.alert('構成エラー', 'app.json の expo.extra.apiUrl か EXPO_PUBLIC_API_URL を設定してください。');

      return;
    }

    setLoading(true);

    try {
      const auth = await client.login({ email, password });

      await updateToken(auth.token);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'ログインに失敗しました。ネットワークと API を確認してください。';

      Alert.alert('ログインできませんでした', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        <View style={styles.brand}>
          <Text style={styles.brandeyebrow}>TODON</Text>
          <Text style={styles.title}>TodoN（トドン）</Text>
          <Text style={styles.sub}>モバイルから同じデータに接続できます</Text>
          <Text style={styles.hint}>API: {baseUrl || '(未設定)'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>メール</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={styles.input}
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[styles.label, styles.labelSpacing]}>パスワード</Text>
          <TextInput secureTextEntry style={styles.input} placeholder="••••••••" value={password} onChangeText={setPassword} />

          <TouchableOpacity
            style={[styles.button, loading ? styles.disabled : undefined]}
            disabled={loading || !email || !password}
            onPress={() => void onSubmit()}
          >
            <Text style={styles.buttonLabel}>{loading ? '送信中…' : 'ログイン'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>アカウントを作成する</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  inner: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  brand: {
    marginBottom: 32,
  },
  brandeyebrow: {
    letterSpacing: 10,
    color: '#10b981',
    fontSize: 12,
    textAlign: 'center',
  },
  title: {
    marginTop: 8,
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '600',
    textAlign: 'center',
  },
  sub: {
    marginTop: 8,
    color: '#cbd5f5',
    fontSize: 14,
    textAlign: 'center',
  },
  hint: {
    marginTop: 12,
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#065f46',
    padding: 20,
    backgroundColor: '#0f172a',
  },
  label: {
    color: '#a7f3d0',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  labelSpacing: {
    marginTop: 16,
  },
  input: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 14, android: 10 }),
    color: '#f8fafc',
    fontSize: 16,
    backgroundColor: '#020617',
  },
  button: {
    marginTop: 24,
    borderRadius: 10,
    backgroundColor: '#34d399',
    paddingVertical: 14,
  },
  buttonLabel: {
    textAlign: 'center',
    color: '#022c22',
    fontWeight: '600',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.55,
  },
  linkRow: {
    marginTop: 18,
    alignItems: 'center',
  },
  linkText: {
    color: '#6ee7b7',
    fontSize: 14,
    fontWeight: '600',
  },
});
