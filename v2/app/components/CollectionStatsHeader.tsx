import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/components/useColorScheme';
import {
  formatMoney,
  formatValueRange,
  formatWorthMultiple,
  type CollectionStats,
} from '@/lib/queries';
import { colors, radii, spacing, type ThemeColors } from '@/theme';

type Props = {
  stats: CollectionStats;
};

export function CollectionStatsHeader({ stats }: Props) {
  const scheme = useColorScheme();
  const theme = colors[scheme];
  const worth = formatWorthMultiple(stats.worthMultiple);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.row}>
        <Stat
          label="Owned"
          value={String(stats.totalOwned)}
          theme={theme}
        />
        <Stat
          label="Est. value"
          value={formatValueRange(stats.valueMin, stats.valueMax)}
          theme={theme}
        />
      </View>
      {worth ? (
        <ThemedText variant="caption" style={{ color: theme.primary }}>
          {worth}
          {stats.paidTotal != null
            ? ` · paid ${formatMoney(stats.paidTotal)}`
            : ''}
        </ThemedText>
      ) : stats.paidTotal != null ? (
        <ThemedText muted variant="caption">
          Paid {formatMoney(stats.paidTotal)}
        </ThemedText>
      ) : null}
    </View>
  );
}

function Stat({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: ThemeColors;
}) {
  return (
    <View style={styles.stat}>
      <ThemedText muted variant="caption">
        {label}
      </ThemedText>
      <ThemedText variant="subtitle" style={{ color: theme.text }}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  stat: {
    flex: 1,
    gap: 2,
  },
});
