import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/lib/auth';
import { colors, radii, spacing } from '@/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const scheme = useColorScheme();
  const theme = colors[scheme];

  const onSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert(
        'Sign out failed',
        error instanceof Error ? error.message : 'Try again.',
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <ThemedText variant="title">Profile</ThemedText>
        <ThemedText muted>{user?.email ?? 'Signed in'}</ThemedText>
        <ThemedText muted style={styles.note}>
          Full profile editing comes later. Sign out is available now.
        </ThemedText>

        <Pressable
          onPress={onSignOut}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: theme.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <ThemedText variant="bodyStrong" style={{ color: theme.primaryText }}>
            Sign out
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  note: {
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  button: {
    marginTop: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
});
