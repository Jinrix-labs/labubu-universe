import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FigureCard } from '@/components/FigureCard';
import { SeriesFilter } from '@/components/SeriesFilter';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/components/useColorScheme';
import { useOwnedIds } from '@/lib/hooks/useUserFigures';
import { queryKeys } from '@/lib/queryClient';
import { fetchFigures, fetchSeries } from '@/lib/queries';
import { colors, radii, spacing } from '@/theme';

export default function CatalogScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();

  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const seriesQuery = useQuery({
    queryKey: queryKeys.series,
    queryFn: fetchSeries,
  });

  const figuresQuery = useQuery({
    queryKey: queryKeys.figures(selectedSeriesId, debouncedSearch),
    queryFn: () =>
      fetchFigures({
        seriesId: selectedSeriesId,
        search: debouncedSearch,
      }),
  });

  const ownedQuery = useOwnedIds();

  const loading =
    seriesQuery.isLoading || figuresQuery.isLoading || ownedQuery.isLoading;
  const error =
    seriesQuery.error ?? figuresQuery.error ?? ownedQuery.error ?? null;
  const refreshing =
    seriesQuery.isRefetching ||
    figuresQuery.isRefetching ||
    ownedQuery.isRefetching;

  const onRefresh = () => {
    void seriesQuery.refetch();
    void figuresQuery.refetch();
    void ownedQuery.refetch();
  };

  const figures = figuresQuery.data ?? [];
  const series = seriesQuery.data ?? [];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerBlock}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search figures"
          placeholderTextColor={theme.textMuted}
          style={[
            styles.search,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      <SeriesFilter
        series={series}
        selectedId={selectedSeriesId}
        onSelect={setSelectedSeriesId}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <ThemedText muted>
            {error instanceof Error ? error.message : 'Could not load catalog.'}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={figures}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <ThemedText muted>No figures match that filter.</ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <FigureCard
                figure={item}
                owned={ownedQuery.ownedIds.has(item.id)}
                onPress={() => router.push(`/figure/${item.id}`)}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBlock: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  search: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  row: {
    gap: spacing.md,
  },
  cell: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
});
