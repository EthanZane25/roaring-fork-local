-- Roaring Fork Local: cuisine-first directory + verified restaurant contests
-- Apply after the original schema on an existing Supabase project.

-- One required primary cuisine per restaurant. Existing arrays remain available for search tags/extras.
alter table public.restaurants add column if not exists primary_cuisine text;
update public.restaurants set primary_cuisine = case slug
  when 'white-house-tavern' then 'american'
  when 'the-pullman' then 'american'
  when 'silo' then 'american'
  when 'mezzaluna-aspen' then 'italian'
  when 'sake-aspen' then 'japanese'
  when 'paradise-bakery' then 'cafe-bakery'
  when 'brick-pony' then 'american'
  when 'sammy-pizza' then 'italian'
  else coalesce(primary_cuisine, 'other')
end
where primary_cuisine is null or primary_cuisine = '';
alter table public.restaurants alter column primary_cuisine set default 'other';
alter table public.restaurants alter column primary_cuisine set not null;
do $$ begin
  alter table public.restaurants add constraint restaurants_primary_cuisine_check
    check (primary_cuisine in ('american','italian','mexican','japanese','cafe-bakery','other'));
exception when duplicate_object then null;
end $$;
create index if not exists restaurants_primary_cuisine_idx on public.restaurants(primary_cuisine);

-- Application-level user identity used for voting eligibility.
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  phone_e164 text,
  email_verified_at timestamptz,
  phone_verified_at timestamptz,
  banned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists users_email_lower_unique on public.users(lower(email));
create unique index if not exists users_phone_e164_unique on public.users(phone_e164) where phone_e164 is not null;

insert into public.users(id,email,email_verified_at,created_at,updated_at)
select id, lower(email), email_confirmed_at, created_at, now()
from auth.users
where email is not null
on conflict (id) do update
set email = excluded.email,
    email_verified_at = excluded.email_verified_at,
    updated_at = now();

create table if not exists public.contests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','open','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.contest_restaurants (
  contest_id uuid not null references public.contests(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  primary key (contest_id, restaurant_id)
);

create table if not exists public.restaurant_votes (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  status text not null default 'counted' check (status in ('counted','held','rejected')),
  risk_score smallint not null default 0,
  device_hash text,
  fingerprint_hash text,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contest_id, user_id)
);
create index if not exists restaurant_votes_contest_idx on public.restaurant_votes(contest_id, status);
create index if not exists restaurant_votes_restaurant_idx on public.restaurant_votes(contest_id, restaurant_id, status);
create index if not exists restaurant_votes_device_idx on public.restaurant_votes(contest_id, device_hash);
create index if not exists restaurant_votes_ip_idx on public.restaurant_votes(contest_id, ip_hash);

create table if not exists public.restaurant_vote_attempts (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid references public.contests(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  restaurant_id uuid references public.restaurants(id) on delete set null,
  device_hash text,
  fingerprint_hash text,
  ip_hash text,
  risk_score smallint not null default 0,
  outcome text not null check (outcome in ('counted','held','rejected','rate_limited','security_failed')),
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists restaurant_vote_attempts_user_idx on public.restaurant_vote_attempts(user_id, created_at desc);
create index if not exists restaurant_vote_attempts_ip_idx on public.restaurant_vote_attempts(ip_hash, created_at desc);
create index if not exists restaurant_vote_attempts_device_idx on public.restaurant_vote_attempts(device_hash, created_at desc);

create table if not exists public.security_rate_events (
  id bigint generated always as identity primary key,
  kind text not null,
  key_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists security_rate_events_lookup_idx on public.security_rate_events(kind, key_hash, created_at desc);

-- One database transaction for both initial cast and change-vote operations.
create or replace function public.cast_restaurant_vote(
  p_contest_id uuid,
  p_user_id uuid,
  p_restaurant_id uuid,
  p_status text,
  p_risk_score smallint,
  p_device_hash text,
  p_fingerprint_hash text,
  p_ip_hash text
)
returns table (id uuid, status text, restaurant_id uuid, updated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.users u
    where u.id = p_user_id
      and u.email_verified_at is not null
      and u.phone_verified_at is not null
      and u.banned_at is null
  ) then
    raise exception 'user_not_eligible';
  end if;

  if not exists (
    select 1 from public.contests c
    where c.id = p_contest_id
      and c.status = 'open'
      and c.starts_at <= now()
      and c.ends_at > now()
  ) then
    raise exception 'contest_not_open';
  end if;

  if not exists (
    select 1 from public.contest_restaurants cr
    where cr.contest_id = p_contest_id and cr.restaurant_id = p_restaurant_id
  ) then
    raise exception 'restaurant_not_eligible';
  end if;

  return query
  insert into public.restaurant_votes(
    contest_id,user_id,restaurant_id,status,risk_score,device_hash,fingerprint_hash,ip_hash,created_at,updated_at
  ) values (
    p_contest_id,p_user_id,p_restaurant_id,p_status,p_risk_score,p_device_hash,p_fingerprint_hash,p_ip_hash,now(),now()
  )
  on conflict (contest_id,user_id) do update
  set restaurant_id = excluded.restaurant_id,
      status = excluded.status,
      risk_score = excluded.risk_score,
      device_hash = excluded.device_hash,
      fingerprint_hash = excluded.fingerprint_hash,
      ip_hash = excluded.ip_hash,
      updated_at = now()
  returning public.restaurant_votes.id, public.restaurant_votes.status, public.restaurant_votes.restaurant_id, public.restaurant_votes.updated_at;
end;
$$;
revoke all on function public.cast_restaurant_vote(uuid,uuid,uuid,text,smallint,text,text,text) from public, anon, authenticated;
grant execute on function public.cast_restaurant_vote(uuid,uuid,uuid,text,smallint,text,text,text) to service_role;

-- Keep app identity synchronized with Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  if new.email is not null then
    insert into public.users (id, email, email_verified_at, created_at, updated_at)
    values (new.id, lower(new.email), new.email_confirmed_at, coalesce(new.created_at, now()), now())
    on conflict (id) do update
    set email = excluded.email,
        email_verified_at = excluded.email_verified_at,
        updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated_rfl on auth.users;
create trigger on_auth_user_updated_rfl
  after update of email,email_confirmed_at on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.users enable row level security;
alter table public.contests enable row level security;
alter table public.contest_restaurants enable row level security;
alter table public.restaurant_votes enable row level security;
alter table public.restaurant_vote_attempts enable row level security;
alter table public.security_rate_events enable row level security;

create policy "Users read own vote identity" on public.users for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "Contests public read" on public.contests for select using (true);
create policy "Contest restaurants public read" on public.contest_restaurants for select using (true);
create policy "Users read own restaurant votes" on public.restaurant_votes for select to authenticated using (user_id = auth.uid());
create policy "Admins review restaurant votes" on public.restaurant_votes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins read restaurant vote attempts" on public.restaurant_vote_attempts for select to authenticated using (public.is_admin());
create policy "Admins read rate events" on public.security_rate_events for select to authenticated using (public.is_admin());

-- No client INSERT/UPDATE policy exists for restaurant_votes. Cast/change happens only through the server service role.
