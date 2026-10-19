import { supabase } from '@/lib/supabase';
import type {
  Rarity,
  Tables,
  UserFigureStatus,
} from '@/lib/database.types';

export type Series = Tables<'series'>;
export type BuyLink = Tables<'buy_links'>;
export type UserFigure = Tables<'user_figures'>;
export type SeriesCompletion = {
  series_id: string;
  series_name: string;
  total: number;
  owned: number;
};

export type FigureWithSeries = Tables<'figures'> & {
  series: Pick<Series, 'id' | 'name'> | null;
  buy_links?: BuyLink[];
};

export type FigureDetail = FigureWithSeries & {
  buy_links: BuyLink[];
};

/** user_figures row with joined figure (+ nested series / buy links). */
export type CollectionItem = UserFigure & {
  figures: FigureWithSeries | null;
};

export type CollectionSeriesGroup = {
  seriesId: string;
  seriesName: string;
  items: Array<CollectionItem & { figures: FigureWithSeries }>;
};

export type CollectionStats = {
  totalOwned: number;
  valueMin: number | null;
  valueMax: number | null;
  paidTotal: number | null;
  worthMultiple: number | null;
};

const FIGURE_EMBED = `
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
  series ( id, name ),
  buy_links ( id, figure_id, retailer, url, is_affiliate )
`;

function normalizeFigure(
  raw: FigureWithSeries | FigureWithSeries[] | null | undefined,
): FigureWithSeries | null {
  let figure = raw ?? null;
  if (Array.isArray(figure)) {
    figure = figure[0] ?? null;
  }
  if (!figure) return null;

  let series = figure.series as FigureWithSeries['series'] | Series[] | null;
  if (Array.isArray(series)) {
    series = series[0] ?? null;
  }

  let buyLinks = figure.buy_links;
  if (buyLinks && !Array.isArray(buyLinks)) {
    buyLinks = [buyLinks];
  }

  return {
    ...figure,
    series,
    buy_links: buyLinks ?? [],
  };
}

function normalizeCollectionRows(data: unknown[] | null): CollectionItem[] {
  return (data ?? []).map((raw) => {
    const row = raw as CollectionItem & {
      figures?: FigureWithSeries | FigureWithSeries[] | null;
    };
    return { ...row, figures: normalizeFigure(row.figures) };
  });
}

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
    .select('*, series(id, name), buy_links(*)')
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
  return (data ?? []).map((row) =>
    normalizeFigure(row as FigureWithSeries),
  ).filter((f): f is FigureWithSeries => f != null);
}

export async function fetchFigureById(id: string): Promise<FigureDetail> {
  const { data, error } = await supabase
    .from('figures')
    .select('*, series(id, name), buy_links(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  const figure = normalizeFigure(data as FigureWithSeries);
  if (!figure) throw new Error('Figure not found');
  return { ...figure, buy_links: figure.buy_links ?? [] };
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

/** All user_figures (owned + wishlist) with figure embeds. */
export async function fetchCollectionItems(
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
      figures ( ${FIGURE_EMBED} )
    `,
    )
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  if (__DEV__) {
    console.log('[fetchCollectionItems] raw response', {
      userId,
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
  return normalizeCollectionRows(data as unknown[] | null);
}

/** @deprecated prefer fetchCollectionItems */
export async function fetchOwnedCollection(
  userId: string,
): Promise<CollectionItem[]> {
  const items = await fetchCollectionItems(userId);
  return items.filter((row) => row.status === 'owned');
}

export function filterOwned(items: CollectionItem[]): CollectionItem[] {
  return items.filter((row) => row.status === 'owned' && row.figures != null);
}

export function filterWishlist(items: CollectionItem[]): CollectionItem[] {
  return items.filter(
    (row) => row.status === 'wishlist' && row.figures != null,
  );
}

/** Dupes: owned with quantity > 1. Spare count = quantity - 1. */
export function filterDupes(items: CollectionItem[]): CollectionItem[] {
  return items.filter(
    (row) =>
      row.status === 'owned' && row.quantity > 1 && row.figures != null,
  );
}

export function spareCount(quantity: number): number {
  return Math.max(0, quantity - 1);
}

export function primaryBuyUrl(figure: FigureWithSeries | null): string | null {
  const links = figure?.buy_links ?? [];
  return links[0]?.url ?? null;
}

export function computeCollectionStats(
  items: CollectionItem[],
): CollectionStats {
  const owned = filterOwned(items);

  let valueMin = 0;
  let valueMax = 0;
  let hasValue = false;
  let paidTotal = 0;
  let hasPaid = false;

  for (const item of owned) {
    const fig = item.figures!;
    const qty = Math.max(1, item.quantity);

    if (fig.est_value_min != null || fig.est_value_max != null) {
      hasValue = true;
      valueMin += Number(fig.est_value_min ?? fig.est_value_max ?? 0) * qty;
      valueMax += Number(fig.est_value_max ?? fig.est_value_min ?? 0) * qty;
    }

    if (fig.original_price != null) {
      hasPaid = true;
      paidTotal += Number(fig.original_price) * qty;
    }
  }

  const mid = hasValue ? (valueMin + valueMax) / 2 : null;
  const worthMultiple =
    hasPaid && paidTotal > 0 && mid != null ? mid / paidTotal : null;

  return {
    totalOwned: owned.length,
    valueMin: hasValue ? valueMin : null,
    valueMax: hasValue ? valueMax : null,
    paidTotal: hasPaid ? paidTotal : null,
    worthMultiple,
  };
}

export function groupCollectionBySeries(
  items: CollectionItem[],
): CollectionSeriesGroup[] {
  const groups = new Map<string, CollectionSeriesGroup>();

  for (const item of items) {
    if (!item.figures) continue;

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

export async function fetchSeriesCompletion(): Promise<SeriesCompletion[]> {
  const { data, error } = await supabase
    .from('series_completion')
    .select('series_id, series_name, total, owned')
    .order('series_name', { ascending: true });

  if (__DEV__) {
    console.log('[fetchSeriesCompletion] raw', {
      count: data?.length ?? 0,
      data,
      error,
    });
  }

  if (error) throw error;

  return (data ?? [])
    .filter((row) => row.series_id && row.series_name)
    .map((row) => ({
      series_id: row.series_id as string,
      series_name: row.series_name as string,
      total: Number(row.total ?? 0),
      owned: Number(row.owned ?? 0),
    }));
}

export async function fetchSeriesById(id: string): Promise<Series> {
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchSeriesDetailFigures(
  seriesId: string,
): Promise<FigureWithSeries[]> {
  return fetchFigures({ seriesId });
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

export function formatWorthMultiple(multiple: number | null): string | null {
  if (multiple == null || !Number.isFinite(multiple)) return null;
  const rounded = Math.round(multiple * 10) / 10;
  return `worth ${rounded}× what you paid`;
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
