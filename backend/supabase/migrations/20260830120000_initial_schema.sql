create extension if not exists "pgcrypto";

create type public.location_type as enum ('home', 'office', 'campus', 'outdoors', 'other');
create type public.adventure_status as enum ('awaiting_scan', 'analyzing', 'ready', 'completed');
create type public.quest_type as enum ('observation', 'visual_clue', 'reasoning');
create type public.quest_difficulty as enum ('easy', 'medium', 'hard');
create type public.quest_status as enum ('available', 'completed');

create table public.adventures (
  id uuid primary key default gen_random_uuid(),
  location_type public.location_type not null,
  status public.adventure_status not null default 'awaiting_scan',
  xp integer not null default 0 check (xp >= 0),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.environment_scans (
  id uuid primary key default gen_random_uuid(),
  adventure_id uuid not null references public.adventures(id) on delete cascade,
  image_count integer not null check (image_count = 3),
  context jsonb not null,
  created_at timestamptz not null default now(),
  unique (adventure_id)
);

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  adventure_id uuid not null references public.adventures(id) on delete cascade,
  type public.quest_type not null,
  title text not null,
  description text not null,
  difficulty public.quest_difficulty not null,
  xp integer not null check (xp > 0),
  status public.quest_status not null default 'available',
  order_index integer not null check (order_index between 0 and 2),
  created_at timestamptz not null default now(),
  unique (adventure_id, order_index)
);

create table public.quest_attempts (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  success boolean not null,
  confidence numeric(4, 3) not null check (confidence between 0 and 1),
  explanation text not null,
  scavvy_reaction text not null,
  created_at timestamptz not null default now()
);

create table public.hints (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  level integer not null check (level between 1 and 3),
  text text not null,
  audio_url text,
  created_at timestamptz not null default now()
);

create index quests_adventure_id_idx on public.quests(adventure_id);
create index attempts_quest_id_idx on public.quest_attempts(quest_id);
create index hints_quest_id_idx on public.hints(quest_id);

alter table public.adventures enable row level security;
alter table public.environment_scans enable row level security;
alter table public.quests enable row level security;
alter table public.quest_attempts enable row level security;
alter table public.hints enable row level security;

create or replace function public.increment_adventure_xp(adventure_id uuid, xp_amount integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.adventures set xp = xp + xp_amount where id = adventure_id;
$$;
