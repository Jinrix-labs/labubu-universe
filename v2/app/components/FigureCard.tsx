import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { RarityBadge } from '@/components/RarityBadge';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/components/useColorScheme';
import type { FigureWithSeries } from '@/lib/queries';
import { colors, radii, spacing } from '@/theme';

type Props = {
  figure: FigureWithSeries;
  owned?: boolean;
  /** Missing / not owned — greyscale faded look */
  faded?: boolean;
  /** Spare dupes (quantity - 1) */
  spareCount?: number;
  buyUrl?: string | null;
  onPress: () => void;
};

export function FigureCard({
  figure,
  owned,
  faded,
  spareCount,
  buyUrl,
  onPress,
}: Props) {
  const scheme = useColorScheme();
  const theme = colors[scheme];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.92 : faded ? 0.55 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <View style={[styles.imageWrap, { backgroundColor: theme.surfaceMuted }]}>
        {figure.image_url ? (
          <Image
            source={{ uri: figure.image_url }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={28} color={theme.textMuted} />
          </View>
        )}
        {faded ? <View style={styles.greyWash} pointerEvents="none" /> : null}
        {owned ? (
          <View style={[styles.check, { backgroundColor: theme.success }]}>
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          </View>
        ) : null}
        {spareCount != null && spareCount > 0 ? (
          <View style={[styles.spare, { backgroundColor: theme.primary }]}>
            <ThemedText variant="caption" style={styles.spareText}>
              +{spareCount}
            </ThemedText>
          </View>
        ) : null}
        {buyUrl ? (
          <Pressable
            onPress={() => {
              void Linking.openURL(buyUrl);
            }}
            hitSlop={8}
            style={[styles.buyBtn, { backgroundColor: theme.surface }]}
          >
            <Ionicons name="cart-outline" size={16} color={theme.primary} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.meta}>
        <ThemedText variant="bodyStrong" numberOfLines={2}>
          {figure.name}
        </ThemedText>
        {figure.series?.name ? (
          <ThemedText variant="caption" muted numberOfLines={1}>
            {figure.series.name}
          </ThemedText>
        ) : null}
        <RarityBadge rarity={figure.rarity} compact />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  imageWrap: {
    aspectRatio: 1,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  greyWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(120, 120, 120, 0.45)',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spare: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: 'center',
  },
  spareText: {
    color: '#FFFFFF',
  },
  buyBtn: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    gap: spacing.xs,
    padding: spacing.md,
  },
});
