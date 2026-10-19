-- Collector app rebuild: Supabase schema
-- Run in Supabase dashboard > SQL Editor
-- Greenfield: run this file once.
-- If you already ran an older schema.sql, apply migrations/002_catalog_fields.sql instead.

-- ============ CATALOG (public, read-only for users) ============

create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null
);

create table series (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  name text not null,
  release_date date,
  unique (brand_id, name)
);

create table figures (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references series(id) on delete cascade,
  name text not null,
  image_url text,
  rarity text not null default 'regular'
    check (rarity in ('regular', 'rare', 'limited', 'secret', 'ultra_rare')),
  est_value_min numeric(10,2),
  est_value_max numeric(10,2),
  original_price numeric(10,2),
  legacy_id text unique,
  created_at timestamptz default now(),
  unique (series_id, name)
);

create table buy_links (
  id uuid primary key default gen_random_uuid(),
  figure_id uuid not null references figures(id) on delete cascade,
  retailer text not null,
  url text not null,
  is_affiliate boolean default false
);

-- ============ USER DATA (private per user) ============

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  is_premium boolean default false,
  created_at timestamptz default now()
);

-- owned: quantity >= 1 (dupes = quantity - 1)
-- wishlist: quantity = 0
create table user_figures (
  user_id uuid not null references auth.users(id) on delete cascade,
  figure_id uuid not null references figures(id) on delete cascade,
  status text not null check (status in ('owned', 'wishlist')),
  quantity int not null default 1 check (quantity >= 0),
  added_at timestamptz default now(),
  primary key (user_id, figure_id)
);

create table collection_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  figure_id uuid references figures(id) on delete set null,
  storage_path text not null,
  created_at timestamptz default now()
);

create table shelves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Shelf',
  theme text not null default 'wood',
  created_at timestamptz default now()
);

-- A slot shows as "owned" or "virtual" (faded) by checking user_figures,
-- so there's no duplicate flag to keep in sync.
create table shelf_slots (
  id uuid primary key default gen_random_uuid(),
  shelf_id uuid not null references shelves(id) on delete cascade,
  figure_id uuid not null references figures(id) on delete cascade,
  position int not null,
  unique (shelf_id, position)
);

-- ============ ROW LEVEL SECURITY ============

alter table brands enable row level security;
alter table series enable row level security;
alter table figures enable row level security;
alter table buy_links enable row level security;
alter table profiles enable row level security;
alter table user_figures enable row level security;
alter table collection_photos enable row level security;
alter table shelves enable row level security;
alter table shelf_slots enable row level security;

-- Catalog: anyone can read
create policy "catalog read" on brands for select using (true);
create policy "catalog read" on series for select using (true);
create policy "catalog read" on figures for select using (true);
create policy "catalog read" on buy_links for select using (true);

-- Profiles: read/update your own (is_premium should only be set server-side)
create policy "own profile read" on profiles for select using (auth.uid() = id);
create policy "own profile update" on profiles for update using (auth.uid() = id);

-- User data: full access to your own rows only
create policy "own rows" on user_figures for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on collection_photos for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on shelves for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own shelf slots" on shelf_slots for all
  using (exists (select 1 from shelves s where s.id = shelf_id and s.user_id = auth.uid()))
  with check (exists (select 1 from shelves s where s.id = shelf_id and s.user_id = auth.uid()));

-- Stop users from flipping their own premium flag
revoke update (is_premium) on profiles from authenticated;

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.shelves (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ HANDY VIEW: series completion ============

create view series_completion with (security_invoker = true) as
select
  s.id as series_id,
  s.name as series_name,
  count(f.id) as total,
  count(uf.figure_id) filter (where uf.status = 'owned') as owned
from series s
join figures f on f.series_id = s.id
left join user_figures uf on uf.figure_id = f.id and uf.user_id = auth.uid()
group by s.id, s.name;
