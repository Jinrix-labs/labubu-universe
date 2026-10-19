import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/components/useColorScheme';
import type { Series } from '@/lib/queries';
import { colors, radii, spacing } from '@/theme';

type Props = {
  series: Series[];
  selectedId: string | null;
  onSelect: (seriesId: string | null) => void;
};

export function SeriesFilter({ series, selectedId, onSelect }: Props) {
  const scheme = useColorScheme();
  const theme = colors[scheme];

  const chips: Array<{ id: string | null; label: string }> = [
    { id: null, label: 'All' },
    ...series.map((item) => ({ id: item.id, label: item.name })),
  ];

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroller}
        contentContainerStyle={styles.row}
      >
        {chips.map((chip) => {
          const selected = chip.id === selectedId;
          return (
            <Pressable
              key={chip.id ?? 'all'}
              onPress={() => onSelect(chip.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? theme.primary : theme.surface,
                  borderColor: selected ? theme.primary : theme.border,
                },
              ]}
            >
              <ThemedText
                variant="label"
                style={{ color: selected ? theme.primaryText : theme.text }}
                numberOfLines={1}
              >
                {chip.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const CHIP_HEIGHT = 36;

const styles = StyleSheet.create({
  wrap: {
    height: CHIP_HEIGHT + spacing.md,
    marginBottom: spacing.sm,
    justifyContent: 'center',
  },
  scroller: {
    height: CHIP_HEIGHT + spacing.md,
  },
  row: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    height: CHIP_HEIGHT + spacing.md,
  },
  chip: {
    height: CHIP_HEIGHT,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md + 2,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 220,
  },
});
