import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { RarityBadge } from '@/components/RarityBadge';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/components/useColorScheme';
import {
  findUserFigure,
  useAddDupe,
  useMarkOwned,
  useMarkWishlist,
  useUserFigures,
} from '@/lib/hooks/useUserFigures';
import { queryKeys } from '@/lib/queryClient';
import {
  fetchFigureById,
  formatMoney,
  formatValueRange,
} from '@/lib/queries';
import { colors, radii, spacing, type ThemeColors } from '@/theme';

export default function FigureDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const theme = colors[scheme];

  const figureQuery = useQuery({
    queryKey: queryKeys.figure(id ?? ''),
    queryFn: () => fetchFigureById(id!),
    enabled: Boolean(id),
  });

  const userFiguresQuery = useUserFigures();
  const markOwnedMutation = useMarkOwned();
  const markWishlistMutation = useMarkWishlist();
  const addDupeMutation = useAddDupe();

  const figure = figureQuery.data ?? null;
  const userFigure = findUserFigure(userFiguresQuery.data, id ?? '');
  const acting =
    markOwnedMutation.isPending ||
    markWishlistMutation.isPending ||
    addDupeMutation.isPending;

  const run = async (
    action: () => Promise<unknown>,
    label: string,
  ) => {
    try {
      await action();
    } catch (err) {
      Alert.alert(
        label,
        err instanceof Error ? err.message : 'Something went wrong.',
      );
    }
  };

  if (figureQuery.isLoading || userFiguresQuery.isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  if (figureQuery.error || !figure) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ThemedText muted>
          {figureQuery.error instanceof Error
            ? figureQuery.error.message
            : 'Figure not found.'}
        </ThemedText>
      </View>
    );
  }

  const owned = userFigure?.status === 'owned';
  const wishlisted = userFigure?.status === 'wishlist';

  return (
    <>
      <Stack.Screen options={{ title: figure.name }} />
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.imageCard, { backgroundColor: theme.surfaceMuted }]}>
          {figure.image_url ? (
            <Image
              source={{ uri: figure.image_url }}
              style={styles.image}
              contentFit="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <ThemedText muted>No image</ThemedText>
            </View>
          )}
        </View>

        <View style={styles.meta}>
          <ThemedText variant="title">{figure.name}</ThemedText>
          {figure.series?.name ? (
            <ThemedText muted>{figure.series.name}</ThemedText>
          ) : null}
          <RarityBadge rarity={figure.rarity} />
        </View>

        <View
          style={[
            styles.panel,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Row
            label="Estimated value"
            value={formatValueRange(figure.est_value_min, figure.est_value_max)}
          />
          <Row
            label="Original price"
            value={formatMoney(figure.original_price)}
          />
          <Row
            label="Your status"
            value={
              owned
                ? `Owned ×${userFigure?.quantity ?? 1}`
                : wishlisted
                  ? 'Wishlist'
                  : 'Not in collection'
            }
          />
        </View>

        <View style={styles.actions}>
          <ActionButton
            label="Own"
            active={owned}
            disabled={acting}
            onPress={() =>
              run(() => markOwnedMutation.mutateAsync(figure.id), 'Own')
            }
            theme={theme}
          />
          <ActionButton
            label="Wishlist"
            active={wishlisted}
            disabled={acting}
            onPress={() =>
              run(() => markWishlistMutation.mutateAsync(figure.id), 'Wishlist')
            }
            theme={theme}
          />
          <ActionButton
            label="+1 Dupe"
            disabled={acting}
            onPress={() =>
              run(() => addDupeMutation.mutateAsync(figure.id), '+1 Dupe')
            }
            theme={theme}
          />
        </View>

        <View style={styles.linksBlock}>
          <ThemedText variant="subtitle">Buy links</ThemedText>
          {figure.buy_links.length === 0 ? (
            <ThemedText muted>No store links yet.</ThemedText>
          ) : (
            figure.buy_links.map((link) => (
              <Pressable
                key={link.id}
                onPress={() => Linking.openURL(link.url)}
                style={[
                  styles.linkRow,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <ThemedText variant="bodyStrong">{link.retailer}</ThemedText>
                <ThemedText muted numberOfLines={1} style={styles.linkUrl}>
                  {link.url}
                </ThemedText>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText muted>{label}</ThemedText>
      <ThemedText variant="bodyStrong">{value}</ThemedText>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  disabled,
  active,
  theme,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
  theme: ThemeColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionBtn,
        {
          backgroundColor: active ? theme.primary : theme.surface,
          borderColor: active ? theme.primary : theme.border,
          opacity: disabled || pressed ? 0.85 : 1,
        },
      ]}
    >
      <ThemedText
        variant="bodyStrong"
        style={{ color: active ? theme.primaryText : theme.text }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  imageCard: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    aspectRatio: 1,
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { gap: spacing.sm },
  panel: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  linksBlock: { gap: spacing.sm },
  linkRow: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: 4,
  },
  linkUrl: { fontSize: 12 },
});
