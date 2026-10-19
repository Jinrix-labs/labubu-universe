import { supabase } from '@/lib/supabase';
import type {
  Rarity,
  Tables,
  UserFigureStatus,
} from '@/lib/database.types';

export type Series = Tables<'series'>;
export type BuyLink = Tables<'buy_links'>;
export type UserFigure = Tables<'user_figures'>;

export type FigureWithSeries = Tables<'figures'> & {
  series: Pick<Series, 'id' | 'name'> | null;
};

export type FigureDetail = FigureWithSeries & {
  buy_links: BuyLink[];
};

/** user_figures row with joined figure (+ nested series). */
export type CollectionItem = UserFigure & {
  figures: FigureWithSeries | null;
};

export type CollectionSeriesGroup = {
  seriesId: string;
  seriesName: string;
  items: Array<CollectionItem & { figures: FigureWithSeries }>;
};

export async function fetchSeries(): Promise<Series[]> {
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchFigures(options?: {
  seriesId?: string | null;
  search?: string;
}): Promise<FigureWithSeries[]> {
  let query = supabase
    .from('figures')
    .select('*, series(id, name)')
    .order('name', { ascending: true });

  if (options?.seriesId) {
    query = query.eq('series_id', options.seriesId);
  }

  const search = options?.search?.trim();
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as FigureWithSeries[];
}

export async function fetchFigureById(id: string): Promise<FigureDetail> {
  const { data, error } = await supabase
    .from('figures')
    .select('*, series(id, name), buy_links(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as FigureDetail;
}

export async function fetchUserFigures(
  userId: string,
): Promise<UserFigure[]> {
  const { data, error } = await supabase
    .from('user_figures')
    .select('*')
    .eq('user_id', userId);

  if (__DEV__) {
    console.log('[fetchUserFigures] raw', {
      userId,
      count: data?.length ?? 0,
      data,
      error,
    });
  }

  if (error) throw error;
  return data ?? [];
}

/**
 * Owned collection with figure + series embeds.
 * Status filter is exact equality on 'owned' (DB check constraint).
 */
export async function fetchOwnedCollection(
  userId: string,
): Promise<CollectionItem[]> {
  const { data, error } = await supabase
    .from('user_figures')
    .select(
      `
      user_id,
      figure_id,
      status,
      quantity,
      added_at,
      figures (
        id,
        series_id,
        name,
        image_url,
        rarity,
        est_value_min,
        est_value_max,
        original_price,
        legacy_id,
        created_at,
        series ( id, name )
      )
    `,
    )
    .eq('user_id', userId)
    .eq('status', 'owned')
    .order('added_at', { ascending: false });

  if (__DEV__) {
    console.log('[fetchOwnedCollection] raw response', {
      userId,
      statusFilter: 'owned',
      count: data?.length ?? 0,
      data,
      error,
      errorMessage: error?.message,
      errorDetails: error?.details,
      errorHint: error?.hint,
      errorCode: error?.code,
    });
  }

  if (error) throw error;

  // Normalize embeds: PostgREST may return object or single-element array.
  const rows: CollectionItem[] = (data ?? []).map((raw) => {
    const row = raw as CollectionItem & {
      figures?: FigureWithSeries | FigureWithSeries[] | null;
    };
    let figure = row.figures ?? null;
    if (Array.isArray(figure)) {
      figure = figure[0] ?? null;
    }
    if (figure && Array.isArray(figure.series)) {
      figure = {
        ...figure,
        series: (figure.series as unknown as Series[])[0] ?? null,
      };
    }
    return { ...row, figures: figure };
  });

  const missingFigure = rows.filter((row) => row.figures == null).length;
  if (__DEV__ && missingFigure > 0) {
    console.warn(
      `[fetchOwnedCollection] ${missingFigure} owned row(s) had null figures join`,
      rows.filter((row) => row.figures == null),
    );
  }

  return rows;
}

/** Group owned items by series; null/missing series → "Unknown series". */
export function groupCollectionBySeries(
  items: CollectionItem[],
): CollectionSeriesGroup[] {
  const groups = new Map<string, CollectionSeriesGroup>();

  for (const item of items) {
    if (!item.figures) {
      // Orphan ownership row — still surface under Unknown so it isn't lost.
      const key = '__unknown__';
      const existing = groups.get(key) ?? {
        seriesId: key,
        seriesName: 'Unknown series',
        items: [],
      };
      // Can't render a card without a figure; skip card but log already warned.
      groups.set(key, existing);
      continue;
    }

    const seriesId = item.figures.series?.id ?? item.figures.series_id;
    const seriesName = item.figures.series?.name ?? 'Unknown series';
    const key = seriesId || '__unknown__';

    const group = groups.get(key) ?? {
      seriesId: key,
      seriesName,
      items: [],
    };

    group.items.push(item as CollectionItem & { figures: FigureWithSeries });
    groups.set(key, group);
  }

  return Array.from(groups.values())
    .filter((g) => g.items.length > 0)
    .sort((a, b) => a.seriesName.localeCompare(b.seriesName));
}

export async function fetchUserFigure(
  userId: string,
  figureId: string,
): Promise<UserFigure | null> {
  const { data, error } = await supabase
    .from('user_figures')
    .select('*')
    .eq('user_id', userId)
    .eq('figure_id', figureId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function upsertUserFigure(input: {
  userId: string;
  figureId: string;
  status: UserFigureStatus;
  quantity: number;
}): Promise<UserFigure> {
  const { data, error } = await supabase
    .from('user_figures')
    .upsert(
      {
        user_id: input.userId,
        figure_id: input.figureId,
        status: input.status,
        quantity: input.quantity,
      },
      { onConflict: 'user_id,figure_id' },
    )
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function markOwned(
  userId: string,
  figureId: string,
): Promise<UserFigure> {
  const existing = await fetchUserFigure(userId, figureId);
  const quantity =
    existing?.status === 'owned' && existing.quantity > 0
      ? existing.quantity
      : 1;

  return upsertUserFigure({
    userId,
    figureId,
    status: 'owned',
    quantity,
  });
}

export async function markWishlist(
  userId: string,
  figureId: string,
): Promise<UserFigure> {
  return upsertUserFigure({
    userId,
    figureId,
    status: 'wishlist',
    quantity: 0,
  });
}

export async function addDupe(
  userId: string,
  figureId: string,
): Promise<UserFigure> {
  const existing = await fetchUserFigure(userId, figureId);
  const base =
    existing?.status === 'owned' && existing.quantity > 0
      ? existing.quantity
      : 1;

  return upsertUserFigure({
    userId,
    figureId,
    status: 'owned',
    quantity: base + 1,
  });
}

export function formatMoney(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `$${Number(value).toFixed(2)}`;
}

export function formatValueRange(
  min: number | null | undefined,
  max: number | null | undefined,
): string {
  if (min == null && max == null) return '—';
  if (min != null && max != null) {
    if (min === max) return formatMoney(min);
    return `${formatMoney(min)} – ${formatMoney(max)}`;
  }
  return formatMoney(min ?? max);
}

export function rarityLabel(rarity: Rarity): string {
  switch (rarity) {
    case 'ultra_rare':
      return 'Ultra Rare';
    case 'secret':
      return 'Secret';
    case 'limited':
      return 'Limited';
    case 'rare':
      return 'Rare';
    default:
      return 'Regular';
  }
}
