create extension if not exists pgcrypto;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Budget du foyer',
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  invite_code text not null unique default lower(encode(gen_random_bytes(8), 'hex')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (household_id, user_id)
);

create table if not exists public.household_budget_state (
  household_id uuid primary key references public.households (id) on delete cascade,
  budget_state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users (id) on delete set null
);

create or replace function public.current_household_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select household_id
  from public.household_members
  where user_id = auth.uid()
  limit 1;
$$;

create or replace function public.get_my_household()
returns table (
  household_id uuid,
  household_name text,
  invite_code text,
  role text,
  owner_user_id uuid
)
language sql
security definer
set search_path = public
stable
as $$
  select
    h.id as household_id,
    h.name as household_name,
    h.invite_code,
    hm.role,
    h.owner_user_id
  from public.household_members hm
  join public.households h on h.id = hm.household_id
  where hm.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.create_household(initial_name text, initial_budget_state jsonb default '{}'::jsonb)
returns table (
  household_id uuid,
  invite_code text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household public.households;
begin
  if auth.uid() is null then
    raise exception 'Vous devez etre connecte pour creer un foyer.';
  end if;

  if exists (select 1 from public.household_members where user_id = auth.uid()) then
    raise exception 'Cet utilisateur appartient deja a un foyer.';
  end if;

  insert into public.households (name, owner_user_id)
  values (coalesce(nullif(trim(initial_name), ''), 'Budget du foyer'), auth.uid())
  returning * into new_household;

  insert into public.household_members (household_id, user_id, role)
  values (new_household.id, auth.uid(), 'owner');

  insert into public.household_budget_state (household_id, budget_state, updated_by)
  values (new_household.id, coalesce(initial_budget_state, '{}'::jsonb), auth.uid());

  return query
  select new_household.id, new_household.invite_code;
end;
$$;

create or replace function public.join_household(invite_code_input text)
returns table (
  household_id uuid,
  household_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_household public.households;
begin
  if auth.uid() is null then
    raise exception 'Vous devez etre connecte pour rejoindre un foyer.';
  end if;

  if exists (select 1 from public.household_members where user_id = auth.uid()) then
    raise exception 'Cet utilisateur appartient deja a un foyer.';
  end if;

  select *
  into target_household
  from public.households
  where invite_code = lower(trim(invite_code_input))
  limit 1;

  if target_household.id is null then
    raise exception 'Code d invitation invalide.';
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (target_household.id, auth.uid(), 'member');

  return query
  select target_household.id, target_household.name;
end;
$$;

revoke all on function public.current_household_id() from public;
revoke all on function public.get_my_household() from public;
revoke all on function public.create_household(text, jsonb) from public;
revoke all on function public.join_household(text) from public;

grant execute on function public.current_household_id() to authenticated;
grant execute on function public.get_my_household() to authenticated;
grant execute on function public.create_household(text, jsonb) to authenticated;
grant execute on function public.join_household(text) to authenticated;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_budget_state enable row level security;

drop policy if exists "budget_state_select" on public.household_budget_state;
create policy "budget_state_select"
on public.household_budget_state
for select
to authenticated
using (household_id = public.current_household_id());

drop policy if exists "budget_state_insert" on public.household_budget_state;
create policy "budget_state_insert"
on public.household_budget_state
for insert
to authenticated
with check (household_id = public.current_household_id());

drop policy if exists "budget_state_update" on public.household_budget_state;
create policy "budget_state_update"
on public.household_budget_state
for update
to authenticated
using (household_id = public.current_household_id())
with check (household_id = public.current_household_id());

alter publication supabase_realtime add table public.household_budget_state;
