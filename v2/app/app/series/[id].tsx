import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FigureCard } from '@/components/FigureCard';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/components/useColorScheme';
import { useOwnedIds } from '@/lib/hooks/useUserFigures';
import { queryKeys } from '@/lib/queryClient';
import {
  fetchSeriesById,
  fetchSeriesDetailFigures,
  type FigureWithSeries,
} from '@/lib/queries';
import { colors, spacing } from '@/theme';

export default function SeriesDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const ownedQuery = useOwnedIds();

  const seriesQuery = useQuery({
    queryKey: queryKeys.seriesDetail(id ?? ''),
    queryFn: async () => {
      const [series, figures] = await Promise.all([
        fetchSeriesById(id!),
        fetchSeriesDetailFigures(id!),
      ]);
      return { series, figures };
    },
    enabled: Boolean(id),
  });

  const loading = seriesQuery.isLoading || ownedQuery.isLoading;
  const figures = seriesQuery.data?.figures ?? [];
  const seriesName = seriesQuery.data?.series.name ?? 'Series';
  const ownedCount = figures.filter((f) =>
    ownedQuery.ownedIds.has(f.id),
  ).length;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Series' }} />
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  if (seriesQuery.error || !seriesQuery.data) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Series' }} />
        <ThemedText muted>
          {seriesQuery.error instanceof Error
            ? seriesQuery.error.message
            : 'Series not found.'}
        </ThemedText>
      </View>
    );
  }

  // Pair into rows for 2-col grid
  const rows: FigureWithSeries[][] = [];
  for (let i = 0; i < figures.length; i += 2) {
    rows.push(figures.slice(i, i + 2));
  }

  return (
    <>
      <Stack.Screen options={{ title: seriesName }} />
      <FlatList
        style={{ backgroundColor: theme.background }}
        data={rows}
        keyExtractor={(_, index) => `row-${index}`}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText variant="title">{seriesName}</ThemedText>
            <ThemedText muted>
              {ownedCount}/{figures.length} owned · missing figures are faded
            </ThemedText>
          </View>
        }
        renderItem={({ item: row }) => (
          <View style={styles.row}>
            {row.map((figure) => {
              const owned = ownedQuery.ownedIds.has(figure.id);
              return (
                <View key={figure.id} style={styles.cell}>
                  <FigureCard
                    figure={figure}
                    owned={owned}
                    faded={!owned}
                    onPress={() => router.push(`/figure/${figure.id}`)}
                  />
                </View>
              );
            })}
            {row.length === 1 ? <View style={styles.cell} /> : null}
          </View>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cell: {
    flex: 1,
  },
});
