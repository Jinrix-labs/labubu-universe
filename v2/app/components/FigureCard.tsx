import { Pressable, StyleSheet, View } from 'react-native';
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
  onPress: () => void;
};

export function FigureCard({ figure, owned, onPress }: Props) {
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
          opacity: pressed ? 0.92 : 1,
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
        {owned ? (
          <View style={[styles.check, { backgroundColor: theme.success }]}>
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          </View>
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
  meta: {
    gap: spacing.xs,
    padding: spacing.md,
  },
});
