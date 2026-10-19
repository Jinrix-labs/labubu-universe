import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/components/useColorScheme';
import type { SeriesCompletion } from '@/lib/queries';
import { colors, radii, spacing } from '@/theme';

type Props = {
  item: SeriesCompletion;
  onPress: () => void;
};

export function SeriesCompletionCard({ item, onPress }: Props) {
  const scheme = useColorScheme();
  const theme = colors[scheme];
  const total = Math.max(0, item.total);
  const owned = Math.min(Math.max(0, item.owned), total || item.owned);
  const progress = total > 0 ? owned / total : 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.top}>
        <ThemedText variant="bodyStrong" numberOfLines={1} style={styles.name}>
          {item.series_name}
        </ThemedText>
        <ThemedText variant="label" style={{ color: theme.primary }}>
          {owned}/{total}
        </ThemedText>
      </View>
      <View style={[styles.track, { backgroundColor: theme.surfaceMuted }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: theme.primary,
              width: `${Math.round(progress * 100)}%`,
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 168,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    marginRight: spacing.sm,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
  },
  track: {
    height: 8,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
  },
});
