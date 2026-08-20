-- ============================================================
-- MatchMind — database schema
-- HOW TO USE: Supabase dashboard -> SQL Editor -> New query ->
-- paste ALL of this -> Run.  (Safe to run more than once.)
-- ============================================================

-- 1) Profiles: one row per signed-up user
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  role        text not null default 'player',   -- 'player' | 'scout'
  created_at  timestamptz not null default now()
);

-- 2) Matches: each saved match belongs to a user (stored as JSON)
create table if not exists public.matches (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null references auth.users(id) on delete cascade,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists matches_owner_idx on public.matches(owner);

-- 3) Invite codes a player shares, and the links they create
create table if not exists public.invites (
  code        text primary key,
  player      uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create table if not exists public.links (
  id          uuid primary key default gen_random_uuid(),
  player      uuid not null references auth.users(id) on delete cascade,
  scout       uuid not null references auth.users(id) on delete cascade,
  permission  text not null default 'record',    -- 'record' | 'view'
  created_at  timestamptz not null default now(),
  unique (player, scout)
);

-- ---- Row Level Security: users only touch their own rows ----
alter table public.profiles enable row level security;
alter table public.matches  enable row level security;
alter table public.invites  enable row level security;
alter table public.links    enable row level security;

drop policy if exists "profiles self" on public.profiles;
create policy "profiles self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "matches owner" on public.matches;
create policy "matches owner" on public.matches
  for all using (auth.uid() = owner) with check (auth.uid() = owner);

drop policy if exists "invites owner" on public.invites;
create policy "invites owner" on public.invites
  for all using (auth.uid() = player) with check (auth.uid() = player);

drop policy if exists "links mine" on public.links;
create policy "links mine" on public.links
  for all using (auth.uid() = player or auth.uid() = scout)
  with check (auth.uid() = player or auth.uid() = scout);

-- ---- Auto-create a profile row when someone signs up ----
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'player')
  );
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
