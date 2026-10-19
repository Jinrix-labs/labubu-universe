import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/components/useColorScheme';
import { rarityLabel } from '@/lib/queries';
import type { Rarity } from '@/lib/database.types';
import { palette, radii, rarityColors, spacing } from '@/theme';

type Props = {
  rarity: Rarity;
  compact?: boolean;
};

export function RarityBadge({ rarity, compact }: Props) {
  const scheme = useColorScheme();
  const token = rarityColors[rarity];
  const bg = scheme === 'dark' ? token.darkBg : token.bg;
  const text = scheme === 'dark' ? token.darkText : token.text;
  const label = rarityLabel(rarity);

  if (rarity === 'ultra_rare') {
    return (
      <LinearGradient
        colors={[palette.ultraPink, palette.ultraCoral]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.badge, compact && styles.compact]}
      >
        <ThemedText
          variant="caption"
          style={[styles.gradientText, compact && styles.compactText]}
        >
          {label}
        </ThemedText>
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.badge,
        compact && styles.compact,
        { backgroundColor: bg },
      ]}
    >
      <ThemedText
        variant="caption"
        style={[{ color: text }, compact && styles.compactText]}
      >
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
  },
  compact: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
  },
  gradientText: {
    color: '#FFFFFF',
  },
  compactText: {
    fontSize: 10,
  },
});
