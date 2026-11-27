-- Shared guilds and seasonal progression foundation.
-- Writes are service-role only until wallet-signature authentication is wired.
create table if not exists public.game_seasons (
  id text primary key,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create unique index if not exists game_seasons_one_active on public.game_seasons(active) where active = true;
create table if not exists public.game_guilds (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 3 and 24),
  tag text not null unique check (char_length(tag) between 2 and 5),
  leader_wallet text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);
create table if not exists public.game_guild_members (
  guild_id uuid not null references public.game_guilds(id) on delete cascade,
  wallet_address text not null,
  role text not null default 'member' check (role in ('leader','officer','member')),
  season_xp bigint not null default 0 check (season_xp >= 0),
  joined_at timestamptz not null default now(),
  primary key (guild_id, wallet_address),
  unique (wallet_address)
);
create table if not exists public.game_guild_boss_runs (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.game_guilds(id) on delete cascade,
  season_id text not null references public.game_seasons(id),
  boss_key text not null,
  wallet_address text not null,
  damage bigint not null check (damage > 0),
  created_at timestamptz not null default now()
);
create index if not exists game_guild_members_xp_idx on public.game_guild_members(season_xp desc);
create index if not exists game_guild_boss_runs_guild_idx on public.game_guild_boss_runs(guild_id, season_id, created_at desc);
alter table public.game_seasons enable row level security;
alter table public.game_guilds enable row level security;
alter table public.game_guild_members enable row level security;
alter table public.game_guild_boss_runs enable row level security;
-- Public read only. All writes must go through authenticated server routes after signature verification.
drop policy if exists game_seasons_read on public.game_seasons;
create policy game_seasons_read on public.game_seasons for select using (true);
drop policy if exists game_guilds_read on public.game_guilds;
create policy game_guilds_read on public.game_guilds for select using (true);
drop policy if exists game_guild_members_read on public.game_guild_members;
create policy game_guild_members_read on public.game_guild_members for select using (true);
drop policy if exists game_guild_boss_runs_read on public.game_guild_boss_runs;
create policy game_guild_boss_runs_read on public.game_guild_boss_runs for select using (true);
