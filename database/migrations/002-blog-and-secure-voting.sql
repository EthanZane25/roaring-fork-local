-- Apply this migration to an existing Roaring Fork Local database created before v4.

create table if not exists public.voter_identities (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  phone_hash text not null unique,
  phone_last4 text not null check (char_length(phone_last4) = 4),
  verified_at timestamptz not null default now()
);
alter table public.voter_identities enable row level security;

alter table public.polls add column if not exists poll_type text not null default 'custom';
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='voter_identities' and policyname='Users read own voter identity') then
    create policy "Users read own voter identity" on public.voter_identities for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='voter_identities' and policyname='Admins read voter identities') then
    create policy "Admins read voter identities" on public.voter_identities for select to authenticated using (public.is_admin());
  end if;
  if not exists (select 1 from pg_constraint where conname = 'polls_poll_type_check') then
    alter table public.polls add constraint polls_poll_type_check check (poll_type in ('custom','favorite_restaurant','restaurant_category'));
  end if;
end $$;
create unique index if not exists poll_options_restaurant_unique on public.poll_options(poll_id, restaurant_id) where restaurant_id is not null;

create or replace function public.sync_restaurant_favorite_poll_option()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  favorite_poll_id uuid;
begin
  select id into favorite_poll_id
  from public.polls
  where poll_type = 'favorite_restaurant' and published = true
    and (closes_at is null or closes_at > now())
  order by created_at desc
  limit 1;
  if favorite_poll_id is null then return new; end if;
  if new.published = true then
    update public.poll_options set label = new.name, town_slug = new.town_slug
      where poll_id = favorite_poll_id and restaurant_id = new.id;
    if not found then
      insert into public.poll_options(poll_id,label,town_slug,restaurant_id,sort_order)
      values (favorite_poll_id,new.name,new.town_slug,new.id,1000)
      on conflict do nothing;
    end if;
  else
    delete from public.poll_options where poll_id = favorite_poll_id and restaurant_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists restaurants_sync_favorite_poll on public.restaurants;
create trigger restaurants_sync_favorite_poll
after insert or update of name,town_slug,published on public.restaurants
for each row execute procedure public.sync_restaurant_favorite_poll_option();

alter table public.votes add column if not exists phone_hash text;
alter table public.votes add column if not exists device_hash text;
alter table public.votes add column if not exists fingerprint_hash text;
alter table public.votes add column if not exists ip_hash text;

-- Force all live votes through the hardened server route.
drop policy if exists "Users vote once" on public.votes;
revoke insert on public.votes from authenticated;

create index if not exists votes_device_idx on public.votes(poll_id, device_hash);
create index if not exists votes_fingerprint_idx on public.votes(poll_id, fingerprint_hash);
create unique index if not exists one_vote_per_phone_per_poll on public.votes(poll_id, phone_hash) where phone_hash is not null;

create table if not exists public.vote_attempts (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references public.polls(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  phone_hash text,
  device_hash text,
  fingerprint_hash text,
  ip_hash text,
  network_hash text,
  risk_score smallint not null default 0,
  turnstile_passed boolean not null default false,
  outcome text not null check (outcome in ('counted','held','rejected','duplicate','rate_limited','security_failed')),
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists vote_attempts_poll_created_idx on public.vote_attempts(poll_id, created_at desc);
create index if not exists vote_attempts_device_idx on public.vote_attempts(device_hash, created_at desc);
create index if not exists vote_attempts_network_idx on public.vote_attempts(network_hash, created_at desc);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  author_id uuid references public.profiles(id) on delete set null,
  author_name text not null default 'Roaring Fork Local',
  town_slug text references public.towns(slug),
  image_url text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists blog_posts_published_idx on public.blog_posts(status, published_at desc);

create table if not exists public.blog_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text,
  email text,
  town_slug text references public.towns(slug),
  subject text not null,
  suggestion text not null,
  network_hash text,
  status text not null default 'new' check (status in ('new','reviewing','used','dismissed')),
  created_at timestamptz not null default now()
);
create index if not exists blog_suggestions_status_idx on public.blog_suggestions(status, created_at desc);
create index if not exists blog_suggestions_network_idx on public.blog_suggestions(network_hash, created_at desc);

alter table public.vote_attempts enable row level security;
alter table public.blog_posts enable row level security;
alter table public.blog_suggestions enable row level security;

-- Policies are created in guarded DO blocks for idempotency.
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='votes' and policyname='Admins read all votes') then
    create policy "Admins read all votes" on public.votes for select to authenticated using (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='votes' and policyname='Admins review votes') then
    create policy "Admins review votes" on public.votes for update to authenticated using (public.is_admin()) with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='vote_attempts' and policyname='Admins read vote attempts') then
    create policy "Admins read vote attempts" on public.vote_attempts for select to authenticated using (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='blog_posts' and policyname='Published blog posts public read') then
    create policy "Published blog posts public read" on public.blog_posts for select using (status = 'published' and published_at <= now());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='blog_posts' and policyname='Admins manage blog posts') then
    create policy "Admins manage blog posts" on public.blog_posts for all to authenticated using (public.is_admin()) with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='blog_suggestions' and policyname='Admins read blog suggestions') then
    create policy "Admins read blog suggestions" on public.blog_suggestions for select to authenticated using (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='blog_suggestions' and policyname='Admins update blog suggestions') then
    create policy "Admins update blog suggestions" on public.blog_suggestions for update to authenticated using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;
