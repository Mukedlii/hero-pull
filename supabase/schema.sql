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
