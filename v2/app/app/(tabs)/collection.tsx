import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollectionEmptyState } from '@/components/CollectionEmptyState';
import { CollectionStatsHeader } from '@/components/CollectionStatsHeader';
import { FigureCard } from '@/components/FigureCard';
import { SegmentedControl } from '@/components/SegmentedControl';
import { SeriesCompletionCard } from '@/components/SeriesCompletionCard';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/components/useColorScheme';
import {
  useCollectionSegments,
  useSeriesCompletion,
} from '@/lib/hooks/useUserFigures';
import {
  primaryBuyUrl,
  spareCount,
  type CollectionItem,
  type CollectionSeriesGroup,
} from '@/lib/queries';
import { colors, spacing } from '@/theme';

type Segment = 'owned' | 'wishlist' | 'dupes';

const SEGMENTS: Array<{ value: Segment; label: string }> = [
  { value: 'owned', label: 'Owned' },
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'dupes', label: 'Dupes' },
];

export default function CollectionScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const [segment, setSegment] = useState<Segment>('owned');

  const collection = useCollectionSegments();
  const completion = useSeriesCompletion();

  const groups = useMemo(() => {
    if (segment === 'wishlist') return collection.wishlistGroups;
    if (segment === 'dupes') return collection.dupeGroups;
    return collection.ownedGroups;
  }, [
    segment,
    collection.ownedGroups,
    collection.wishlistGroups,
    collection.dupeGroups,
  ]);

  const itemCount = useMemo(() => {
    if (segment === 'wishlist') return collection.wishlist.length;
    if (segment === 'dupes') return collection.dupes.length;
    return collection.owned.length;
  }, [segment, collection.owned, collection.wishlist, collection.dupes]);

  const loading = collection.isLoading || completion.isLoading;
  const refreshing = collection.isRefetching || completion.isRefetching;
  const error = collection.error ?? completion.error;

  const onRefresh = () => {
    void collection.refetch();
    void completion.refetch();
  };

  const goCatalog = () => router.push('/(tabs)/catalog');

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ThemedText muted>
          {error instanceof Error ? error.message : 'Could not load collection.'}
        </ThemedText>
      </View>
    );
  }

  const completionRows = (completion.data ?? []).filter((row) => row.total > 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.top}>
        <SegmentedControl
          options={SEGMENTS}
          value={segment}
          onChange={setSegment}
        />
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => `${segment}-${item.seriesId}`}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + spacing.xl },
          itemCount === 0 && styles.flexGrow,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            {segment === 'owned' ? (
              <>
                <CollectionStatsHeader stats={collection.stats} />
                {completionRows.length > 0 ? (
                  <View style={styles.completionBlock}>
                    <ThemedText variant="subtitle" style={styles.blockTitle}>
                      Series progress
                    </ThemedText>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.completionRow}
                    >
                      {completionRows.map((row) => (
                        <SeriesCompletionCard
                          key={row.series_id}
                          item={row}
                          onPress={() =>
                            router.push({
                              pathname: '/series/[id]',
                              params: { id: row.series_id },
                            })
                          }
                        />
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyForSegment segment={segment} onBrowse={goCatalog} />
        }
        renderItem={({ item }) => (
          <SeriesSection
            group={item}
            segment={segment}
            onPressFigure={(id) => router.push(`/figure/${id}`)}
          />
        )}
      />
    </View>
  );
}

function EmptyForSegment({
  segment,
  onBrowse,
}: {
  segment: Segment;
  onBrowse: () => void;
}) {
  if (segment === 'wishlist') {
    return (
      <CollectionEmptyState
        title="Wishlist is empty"
        subtitle="Save figures you want from the catalog."
        onCtaPress={onBrowse}
      />
    );
  }
  if (segment === 'dupes') {
    return (
      <CollectionEmptyState
        title="No dupes yet"
        subtitle="Use +1 Dupe on a figure you already own."
        onCtaPress={onBrowse}
      />
    );
  }
  return (
    <CollectionEmptyState
      title="Nothing owned yet"
      subtitle="Mark figures as Owned in the catalog to build your collection."
      onCtaPress={onBrowse}
    />
  );
}

function SeriesSection({
  group,
  segment,
  onPressFigure,
}: {
  group: CollectionSeriesGroup;
  segment: Segment;
  onPressFigure: (id: string) => void;
}) {
  const scheme = useColorScheme();
  const theme = colors[scheme];

  const rows: Array<typeof group.items> = [];
  for (let i = 0; i < group.items.length; i += 2) {
    rows.push(group.items.slice(i, i + 2));
  }

  return (
    <View style={styles.section}>
      <ThemedText variant="subtitle" style={styles.sectionTitle}>
        {group.seriesName}
        <ThemedText muted style={{ color: theme.textMuted }}>
          {`  ·  ${group.items.length}`}
        </ThemedText>
      </ThemedText>
      {rows.map((row, index) => (
        <View key={`${group.seriesId}-${index}`} style={styles.row}>
          {row.map((item) => (
            <View key={item.figure_id} style={styles.cell}>
              <CollectionFigureCard
                item={item}
                segment={segment}
                onPress={() => onPressFigure(item.figure_id)}
              />
            </View>
          ))}
          {row.length === 1 ? <View style={styles.cell} /> : null}
        </View>
      ))}
    </View>
  );
}

function CollectionFigureCard({
  item,
  segment,
  onPress,
}: {
  item: CollectionItem & { figures: NonNullable<CollectionItem['figures']> };
  segment: Segment;
  onPress: () => void;
}) {
  const figure = item.figures;
  const buyUrl =
    segment === 'wishlist' ? primaryBuyUrl(figure) : null;
  const spare =
    segment === 'dupes' ? spareCount(item.quantity) : undefined;

  return (
    <FigureCard
      figure={figure}
      owned={item.status === 'owned'}
      spareCount={spare}
      buyUrl={buyUrl}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  top: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  flexGrow: { flexGrow: 1 },
  completionBlock: {
    marginBottom: spacing.lg,
  },
  blockTitle: {
    marginBottom: spacing.sm,
  },
  completionRow: {
    paddingRight: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
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
