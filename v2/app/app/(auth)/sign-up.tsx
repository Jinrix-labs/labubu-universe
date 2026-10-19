import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/lib/auth';
import { colors, radii, spacing } from '@/theme';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const scheme = useColorScheme();
  const theme = colors[scheme];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || password.length < 6) {
      Alert.alert(
        'Check your details',
        'Use a valid email and a password of at least 6 characters.',
      );
      return;
    }

    setSubmitting(true);
    try {
      await signUp(email, password);
      Alert.alert(
        'Welcome',
        'Account created. If email confirmation is enabled, check your inbox before signing in.',
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not sign up.';
      Alert.alert('Sign up failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.hero}>
          <ThemedText variant="hero">Join Collector</ThemedText>
          <ThemedText muted>Save owned figures, wishlist, and shelves.</ThemedText>
        </View>

        <View style={styles.form}>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor={theme.textMuted}
            value={email}
            onChangeText={setEmail}
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
          />
          <TextInput
            placeholder="Password (min 6)"
            placeholderTextColor={theme.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
          />

          <Pressable
            onPress={onSubmit}
            disabled={submitting}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: theme.primary,
                opacity: submitting || pressed ? 0.85 : 1,
              },
            ]}
          >
            <ThemedText variant="bodyStrong" style={{ color: theme.primaryText }}>
              {submitting ? 'Creating…' : 'Create account'}
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <ThemedText muted>Already collecting?</ThemedText>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable>
              <ThemedText variant="bodyStrong" style={{ color: theme.primary }}>
                Sign in
              </ThemedText>
            </Pressable>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  hero: { gap: spacing.sm },
  form: { gap: spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontSize: 16,
  },
  button: {
    borderRadius: radii.md,
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
