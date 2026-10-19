import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FigureCard } from '@/components/FigureCard';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/components/useColorScheme';
import { useOwnedCollection } from '@/lib/hooks/useUserFigures';
import type { CollectionSeriesGroup } from '@/lib/queries';
import { colors, spacing } from '@/theme';

export default function CollectionScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useOwnedCollection();

  const groups = data?.groups ?? [];
  const totalOwned = data?.items.filter((i) => i.figures).length ?? 0;

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ThemedText muted>
          {error instanceof Error ? error.message : 'Could not load collection.'}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.seriesId}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + spacing.xl },
          groups.length === 0 && styles.flexGrow,
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText muted>
              {totalOwned === 0
                ? 'Mark figures as Owned in the catalog to see them here.'
                : `${totalOwned} owned`}
            </ThemedText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <ThemedText muted>Your collection is empty.</ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <SeriesSection
            group={item}
            onPressFigure={(id) => router.push(`/figure/${id}`)}
          />
        )}
      />
    </View>
  );
}

function SeriesSection({
  group,
  onPressFigure,
}: {
  group: CollectionSeriesGroup;
  onPressFigure: (id: string) => void;
}) {
  const scheme = useColorScheme();
  const theme = colors[scheme];

  // Chunk into pairs for a 2-column grid without nested VirtualizedLists.
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
              <FigureCard
                figure={item.figures}
                owned
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: {
    paddingHorizontal: spacing.lg,
  },
  flexGrow: { flexGrow: 1 },
  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
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
