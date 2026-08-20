-- ============================================================
-- MatchMind — Step 6b: invite linking
-- Run in Supabase: SQL Editor -> New query -> paste all -> Run.
-- Safe to run more than once.
-- ============================================================

-- Let a linked scout READ the matches of players they're linked to
drop policy if exists "matches linked read" on public.matches;
create policy "matches linked read" on public.matches
  for select using (
    auth.uid() = owner
    or exists (select 1 from public.links l where l.player = matches.owner and l.scout = auth.uid())
  );

-- Let a scout with 'record' permission INSERT a match owned by that player
drop policy if exists "matches linked insert" on public.matches;
create policy "matches linked insert" on public.matches
  for insert with check (
    auth.uid() = owner
    or exists (
      select 1 from public.links l
      where l.player = matches.owner and l.scout = auth.uid() and l.permission = 'record'
    )
  );

-- Get (or create) MY invite code
create or replace function public.my_invite_code()
returns text language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  select code into v_code from public.invites where player = auth.uid() limit 1;
  if v_code is null then
    loop
      v_code := upper(substr(md5(random()::text), 1, 6));
      exit when not exists (select 1 from public.invites where code = v_code);
    end loop;
    insert into public.invites (code, player) values (v_code, auth.uid());
  end if;
  return v_code;
end; $$;

-- Redeem someone else's code (I become their scout)
create or replace function public.redeem_invite(invite_code text)
returns json language plpgsql security definer set search_path = public as $$
declare v_player uuid; v_name text;
begin
  select player into v_player from public.invites where code = upper(trim(invite_code));
  if v_player is null then return json_build_object('ok', false, 'error', 'Invalid code'); end if;
  if v_player = auth.uid() then return json_build_object('ok', false, 'error', 'That is your own code'); end if;
  insert into public.links (player, scout, permission)
    values (v_player, auth.uid(), 'record')
    on conflict (player, scout) do nothing;
  select name into v_name from public.profiles where id = v_player;
  return json_build_object('ok', true, 'name', coalesce(nullif(v_name, ''), 'Player'), 'player', v_player);
end; $$;

-- List all my links (either direction), with names
create or replace function public.my_links()
returns table (player uuid, scout uuid, permission text, player_name text, scout_name text)
language sql security definer set search_path = public as $$
  select l.player, l.scout, l.permission,
         coalesce(nullif(pp.name, ''), 'Player') as player_name,
         coalesce(nullif(sp.name, ''), 'Scout')  as scout_name
  from public.links l
  left join public.profiles pp on pp.id = l.player
  left join public.profiles sp on sp.id = l.scout
  where l.player = auth.uid() or l.scout = auth.uid();
$$;

grant execute on function public.my_invite_code()      to authenticated;
grant execute on function public.redeem_invite(text)   to authenticated;
grant execute on function public.my_links()            to authenticated;
