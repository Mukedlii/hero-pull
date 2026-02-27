-- Hero Pull minimal schema

create table if not exists public.player_scores (
  fid bigint primary key,
  score integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists player_scores_score_idx on public.player_scores (score desc);

-- Optional: event log for anti-cheat / auditing
create table if not exists public.score_events (
  id bigserial primary key,
  fid bigint not null,
  action text not null,
  delta integer not null,
  ref text,
  created_at timestamptz not null default now()
);

create index if not exists score_events_fid_created_idx on public.score_events (fid, created_at desc);

-- Items inventory (server-side persistence)
create table if not exists public.player_items (
  id bigserial primary key,
  fid bigint not null,
  item jsonb not null,
  merged_from bigint[],
  created_at timestamptz not null default now()
);

create index if not exists player_items_fid_created_idx on public.player_items (fid, created_at desc);
create index if not exists player_items_rarity_idx on public.player_items ((item->>'rarity'));
create index if not exists player_items_slot_idx on public.player_items ((item->>'slot'));
create index if not exists player_items_set_idx on public.player_items ((item->>'set'));

-- PvP (live, realtime)
create table if not exists public.pvp_matches (
  id uuid primary key,
  status text not null default 'lobby',
  p1_wallet text not null,
  p2_wallet text,
  p1_hero jsonb,
  p2_hero jsonb,
  state jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists pvp_matches_updated_idx on public.pvp_matches (updated_at desc);

-- Wallet-based player stats (used for Arena + Dungeon)
create table if not exists public.player_stats (
  wallet_address text primary key,
  points integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  highest_streak integer not null default 0,
  current_streak integer not null default 0,
  total_pulls integer not null default 0,

  -- Dungeon progression
  current_level integer not null default 1,
  current_floor integer not null default 1,
  highest_level_cleared integer not null default 0,
  highest_floor_cleared integer not null default 0,
  total_dungeon_runs integer not null default 0,
  total_bosses_killed integer not null default 0,

  updated_at timestamptz not null default now()
);

-- If the table already exists, ensure new columns are present.
alter table public.player_stats add column if not exists current_level integer not null default 1;
alter table public.player_stats add column if not exists current_floor integer not null default 1;
alter table public.player_stats add column if not exists highest_level_cleared integer not null default 0;
alter table public.player_stats add column if not exists highest_floor_cleared integer not null default 0;
alter table public.player_stats add column if not exists total_dungeon_runs integer not null default 0;
alter table public.player_stats add column if not exists total_bosses_killed integer not null default 0;
