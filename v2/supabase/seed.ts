/**
 * Idempotent catalog seed: brand → series → figures → buy_links
 *
 * Reads legacy data from the old app at repo root:
 *   labubuData.js, labubuLinks.json
 *
 * Env (v2/supabase/.env — gitignored):
 *   SUPABASE_URL=
 *   SUPABASE_SERVICE_ROLE_KEY=
 *
 * Usage:
 *   cd v2/supabase && npm install && npm run seed
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ws from 'ws';
import { LABUBU_DATA } from '../../labubuData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in v2/supabase/.env',
  );
  process.exit(1);
}

if (
  SUPABASE_URL.includes('YOUR_PROJECT') ||
  SUPABASE_SERVICE_ROLE_KEY.includes('your_service_role')
) {
  console.error(
    'v2/supabase/.env still has placeholder values.\n' +
      'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from:\n' +
      '  Supabase dashboard → Project Settings → API',
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  // Node < 22 has no native WebSocket; seed only needs REST but createClient still inits realtime
  realtime: { transport: ws },
});

const BRAND = { name: 'Pop Mart', slug: 'pop-mart' } as const;

type DbRarity = 'regular' | 'rare' | 'limited' | 'secret' | 'ultra_rare';

const RARITY_MAP: Record<string, DbRarity> = {
  common: 'regular',
  rare: 'rare',
  limited: 'limited',
  secret: 'secret',
  'ultra-rare': 'ultra_rare',
  ultra_rare: 'ultra_rare',
};

type LegacyFigure = {
  id: string;
  name: string;
  series: string;
  releaseDate?: string;
  image?: string;
  rarity: string;
  estimatedValue?: { min?: number; max?: number };
  originalPrice?: number;
};

type LinksFile = {
  figures: Array<{
    id: number | string;
    store_link?: string | null;
  }>;
};

function mapRarity(raw: string): DbRarity {
  const key = raw.trim().toLowerCase();
  const mapped = RARITY_MAP[key];
  if (!mapped) {
    throw new Error(`Unknown rarity "${raw}" — update RARITY_MAP`);
  }
  return mapped;
}

function loadLinksByLegacyId(): Map<string, string> {
  const raw = readFileSync(path.join(repoRoot, 'labubuLinks.json'), 'utf8');
  const data = JSON.parse(raw) as LinksFile;
  const map = new Map<string, string>();
  for (const fig of data.figures ?? []) {
    const url = fig.store_link?.trim();
    if (!url) continue;
    map.set(String(fig.id), url);
  }
  return map;
}

function earliestReleaseDate(figures: LegacyFigure[]): string | null {
  const dates = figures
    .map((f) => f.releaseDate)
    .filter((d): d is string => Boolean(d))
    .sort();
  return dates[0] ?? null;
}

async function upsertBrand(): Promise<string> {
  const { data, error } = await supabase
    .from('brands')
    .upsert(BRAND, { onConflict: 'slug' })
    .select('id')
    .single();

  if (error) throw new Error(`brands upsert: ${error.message}`);
  return data.id as string;
}

async function upsertSeries(
  brandId: string,
  name: string,
  releaseDate: string | null,
): Promise<string> {
  const { data, error } = await supabase
    .from('series')
    .upsert(
      {
        brand_id: brandId,
        name,
        release_date: releaseDate,
      },
      { onConflict: 'brand_id,name' },
    )
    .select('id')
    .single();

  if (error) throw new Error(`series upsert "${name}": ${error.message}`);
  return data.id as string;
}

async function upsertFigure(
  seriesId: string,
  fig: LegacyFigure,
): Promise<string> {
  const legacyId = String(fig.id);
  const row = {
    series_id: seriesId,
    name: fig.name,
    image_url: fig.image ?? null,
    rarity: mapRarity(fig.rarity),
    est_value_min: fig.estimatedValue?.min ?? null,
    est_value_max: fig.estimatedValue?.max ?? null,
    original_price: fig.originalPrice ?? null,
    legacy_id: legacyId,
  };

  const { data, error } = await supabase
    .from('figures')
    .upsert(row, { onConflict: 'legacy_id' })
    .select('id')
    .single();

  if (error) {
    throw new Error(`figures upsert legacy_id=${legacyId}: ${error.message}`);
  }
  return data.id as string;
}

async function upsertBuyLink(figureId: string, url: string): Promise<void> {
  const retailer = 'popmart';

  const { data: existing, error: selectError } = await supabase
    .from('buy_links')
    .select('id')
    .eq('figure_id', figureId)
    .eq('retailer', retailer)
    .maybeSingle();

  if (selectError) {
    throw new Error(`buy_links select: ${selectError.message}`);
  }

  if (existing?.id) {
    const { error } = await supabase
      .from('buy_links')
      .update({ url, is_affiliate: false })
      .eq('id', existing.id);
    if (error) throw new Error(`buy_links update: ${error.message}`);
    return;
  }

  const { error } = await supabase.from('buy_links').insert({
    figure_id: figureId,
    retailer,
    url,
    is_affiliate: false,
  });
  if (error) throw new Error(`buy_links insert: ${error.message}`);
}

async function main() {
  const figures = LABUBU_DATA as LegacyFigure[];
  const linksByLegacyId = loadLinksByLegacyId();

  console.log(`Seeding ${figures.length} figures…`);

  const brandId = await upsertBrand();
  console.log(`Brand: ${BRAND.name} (${brandId})`);

  const bySeries = new Map<string, LegacyFigure[]>();
  for (const fig of figures) {
    const list = bySeries.get(fig.series) ?? [];
    list.push(fig);
    bySeries.set(fig.series, list);
  }

  let figureCount = 0;
  let linkCount = 0;
  let missingLinks = 0;

  for (const [seriesName, seriesFigures] of bySeries) {
    const seriesId = await upsertSeries(
      brandId,
      seriesName,
      earliestReleaseDate(seriesFigures),
    );

    for (const fig of seriesFigures) {
      const figureId = await upsertFigure(seriesId, fig);
      figureCount += 1;

      const url = linksByLegacyId.get(String(fig.id));
      if (url) {
        await upsertBuyLink(figureId, url);
        linkCount += 1;
      } else {
        missingLinks += 1;
      }
    }

    console.log(`  series "${seriesName}": ${seriesFigures.length} figures`);
  }

  console.log(
    `Done. figures=${figureCount}, buy_links=${linkCount}, missing_links=${missingLinks}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
