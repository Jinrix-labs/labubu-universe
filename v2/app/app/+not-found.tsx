import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/components/useColorScheme';
import { colors, spacing } from '@/theme';

export default function NotFoundScreen() {
  const scheme = useColorScheme();
  const theme = colors[scheme];

  return (
    <>
      <Stack.Screen options={{ title: 'Oops' }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ThemedText variant="title">Screen not found</ThemedText>
        <Link href="/(tabs)/catalog" style={{ marginTop: spacing.md }}>
          <ThemedText style={{ color: theme.primary }}>Go to catalog</ThemedText>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
});
