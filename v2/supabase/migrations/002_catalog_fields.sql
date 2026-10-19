-- Catalog migration decisions (rarity enum, value range, original_price, legacy_id)
-- Apply if you already ran the original schema.sql.
-- Greenfield installs can skip this and use the updated schema.sql instead.
-- Safe to re-run.

-- Rarity: expand allowed values (no data collapse)
alter table figures drop constraint if exists figures_rarity_check;
alter table figures add constraint figures_rarity_check
  check (rarity in ('regular', 'rare', 'limited', 'secret', 'ultra_rare'));

-- Value: keep range (analytics uses midpoint)
alter table figures
  add column if not exists est_value_min numeric(10,2),
  add column if not exists est_value_max numeric(10,2);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'figures'
      and column_name = 'est_value'
  ) then
    update figures
    set
      est_value_min = coalesce(est_value_min, est_value),
      est_value_max = coalesce(est_value_max, est_value)
    where est_value is not null;

    alter table figures drop column est_value;
  end if;
end $$;

-- Optional retail price from legacy catalog
alter table figures
  add column if not exists original_price numeric(10,2);

-- Bridge to old labubuData / labubuLinks ids for seeding buy_links
alter table figures
  add column if not exists legacy_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'figures_legacy_id_key'
  ) then
    alter table figures add constraint figures_legacy_id_key unique (legacy_id);
  end if;
end $$;
