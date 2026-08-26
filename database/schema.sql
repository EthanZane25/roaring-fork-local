-- Roaring Fork Local production schema
-- Run in Supabase SQL Editor on a new project.

create extension if not exists pgcrypto;
create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm;

create type public.user_role as enum ('user', 'business', 'moderator', 'admin');
create type public.listing_status as enum ('draft', 'active', 'sold', 'expired', 'removed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  phone_verified boolean not null default false,
  home_town_slug text,
  role public.user_role not null default 'user',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.voter_identities (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  phone_hash text not null unique,
  phone_last4 text not null check (char_length(phone_last4) = 4),
  verified_at timestamptz not null default now()
);

create table public.towns (
  slug text primary key,
  name text not null,
  county text not null,
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null,
  location extensions.geography(Point, 4326) generated always as (
    extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography
  ) stored,
  published boolean not null default true
);
create index towns_location_gix on public.towns using gist(location);

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  town_slug text not null references public.towns(slug),
  address text not null,
  phone text,
  website text,
  description text not null default '',
  cuisines text[] not null default '{}',
  meals text[] not null default '{}',
  search_tags text[] not null default '{}',
  price_level smallint not null default 2 check (price_level between 1 and 4),
  latitude numeric(9,6),
  longitude numeric(9,6),
  location extensions.geography(Point, 4326) generated always as (
    case when latitude is null or longitude is null then null
    else extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography end
  ) stored,
  image_url text,
  is_advertiser boolean not null default false,
  open_now boolean,
  local_votes integer not null default 0,
  claimed_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index restaurants_town_idx on public.restaurants(town_slug);
create index restaurants_tags_gin on public.restaurants using gin(search_tags);
create index restaurants_cuisines_gin on public.restaurants using gin(cuisines);
create index restaurants_name_trgm on public.restaurants using gin(name gin_trgm_ops);
create index restaurants_location_gix on public.restaurants using gist(location);

create table public.restaurant_hours (
  id bigint generated always as identity primary key,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  opens_at time,
  closes_at time,
  note text,
  unique (restaurant_id, day_of_week, opens_at)
);

create table public.restaurant_menus (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  url text not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 100),
  description text not null check (char_length(description) between 5 and 4000),
  town_slug text not null references public.towns(slug),
  category_slug text not null,
  price numeric(12,2) not null default 0 check (price >= 0),
  image_url text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  location extensions.geography(Point, 4326) generated always as (
    case when latitude is null or longitude is null then null
    else extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography end
  ) stored,
  status public.listing_status not null default 'active',
  seller_name text,
  seller_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index marketplace_status_created_idx on public.marketplace_listings(status, created_at desc);
create index marketplace_town_category_idx on public.marketplace_listings(town_slug, category_slug);
create index marketplace_title_trgm on public.marketplace_listings using gin(title gin_trgm_ops);
create index marketplace_location_gix on public.marketplace_listings using gist(location);

create table public.marketplace_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, listing_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.marketplace_listings(id) on delete set null,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(listing_id, buyer_id, seller_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index messages_conversation_created_idx on public.messages(conversation_id, created_at);

create table public.polls (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  poll_type text not null default 'custom' check (poll_type in ('custom','favorite_restaurant','restaurant_category')),
  closes_at timestamptz,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null,
  town_slug text references public.towns(slug),
  restaurant_id uuid references public.restaurants(id) on delete set null,
  vote_count integer not null default 0,
  sort_order integer not null default 0,
  unique (poll_id, label)
);
create index poll_options_poll_idx on public.poll_options(poll_id);
create unique index poll_options_restaurant_unique on public.poll_options(poll_id, restaurant_id) where restaurant_id is not null;

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  phone_hash text,
  device_hash text,
  fingerprint_hash text,
  ip_hash text,
  risk_score smallint not null default 0,
  status text not null default 'counted' check (status in ('counted','held','rejected')),
  created_at timestamptz not null default now(),
  constraint one_vote_per_user_per_poll unique (poll_id, user_id)
);
create index votes_poll_idx on public.votes(poll_id);
create index votes_option_idx on public.votes(option_id);
create index votes_device_idx on public.votes(poll_id, device_hash);
create index votes_fingerprint_idx on public.votes(poll_id, fingerprint_hash);
create unique index one_vote_per_phone_per_poll on public.votes(poll_id, phone_hash) where phone_hash is not null;

create table public.vote_attempts (
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
create index vote_attempts_poll_created_idx on public.vote_attempts(poll_id, created_at desc);
create index vote_attempts_device_idx on public.vote_attempts(device_hash, created_at desc);
create index vote_attempts_network_idx on public.vote_attempts(network_hash, created_at desc);

create table public.blog_posts (
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
create index blog_posts_published_idx on public.blog_posts(status, published_at desc);

create table public.blog_suggestions (
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
create index blog_suggestions_status_idx on public.blog_suggestions(status, created_at desc);
create index blog_suggestions_network_idx on public.blog_suggestions(network_hash, created_at desc);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  town_slug text not null references public.towns(slug),
  venue text not null,
  category_slug text not null default 'community',
  starts_at timestamptz not null,
  ends_at timestamptz,
  source_url text,
  owner_id uuid references public.profiles(id) on delete set null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create index events_starts_idx on public.events(starts_at);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  title text not null,
  company text not null,
  town_slug text not null references public.towns(slug),
  description text not null default '',
  pay_text text not null default '',
  employment_type text not null default 'Full time',
  status text not null default 'active' check (status in ('active','filled','expired','removed')),
  created_at timestamptz not null default now()
);

create table public.housing_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text not null default '',
  town_slug text not null references public.towns(slug),
  price numeric(12,2) not null check (price >= 0),
  bedrooms numeric(4,1) not null default 0,
  listing_type text not null,
  status text not null default 'active' check (status in ('active','rented','expired','removed')),
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

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

  if favorite_poll_id is null then
    return new;
  end if;

  if new.published = true then
    update public.poll_options
      set label = new.name, town_slug = new.town_slug
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

create trigger restaurants_sync_favorite_poll
after insert or update of name,town_slug,published on public.restaurants
for each row execute procedure public.sync_restaurant_favorite_poll_option();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','moderator')
  );
$$;

create or replace function public.refresh_poll_vote_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE','DELETE') and old.status = 'counted' then
    update public.poll_options
      set vote_count = greatest(vote_count - 1, 0)
      where id = old.option_id;
  end if;
  if tg_op in ('INSERT','UPDATE') and new.status = 'counted' then
    update public.poll_options
      set vote_count = vote_count + 1
      where id = new.option_id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger votes_refresh_counts
after insert or update or delete on public.votes
for each row execute procedure public.refresh_poll_vote_count();

alter table public.profiles enable row level security;
alter table public.voter_identities enable row level security;
alter table public.towns enable row level security;
alter table public.restaurants enable row level security;
alter table public.restaurant_hours enable row level security;
alter table public.restaurant_menus enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.marketplace_images enable row level security;
alter table public.favorites enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.votes enable row level security;
alter table public.vote_attempts enable row level security;
alter table public.blog_posts enable row level security;
alter table public.blog_suggestions enable row level security;
alter table public.events enable row level security;
alter table public.jobs enable row level security;
alter table public.housing_listings enable row level security;
alter table public.reports enable row level security;

create policy "Public profiles are readable" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users read own voter identity" on public.voter_identities for select to authenticated using (user_id = auth.uid());
create policy "Admins read voter identities" on public.voter_identities for select to authenticated using (public.is_admin());

-- Prevent clients from self-promoting to admin or marking their own phone as verified.
revoke update on public.profiles from authenticated;
grant update (display_name, home_town_slug, avatar_url, updated_at) on public.profiles to authenticated;

create policy "Towns public read" on public.towns for select using (published = true);
create policy "Restaurants public read" on public.restaurants for select using (published = true);
create policy "Restaurant hours public read" on public.restaurant_hours for select using (true);
create policy "Restaurant menus public read" on public.restaurant_menus for select using (true);
create policy "Admins manage restaurants" on public.restaurants for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage restaurant hours" on public.restaurant_hours for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage restaurant menus" on public.restaurant_menus for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Active listings public read" on public.marketplace_listings for select using (status = 'active' or owner_id = auth.uid() or public.is_admin());
create policy "Authenticated users create listings" on public.marketplace_listings for insert to authenticated with check (
  owner_id = auth.uid()
  and seller_verified = coalesce((select phone_verified from public.profiles where id = auth.uid()), false)
);
create policy "Owners update listings" on public.marketplace_listings for update to authenticated using (owner_id = auth.uid() or public.is_admin()) with check (
  public.is_admin()
  or (
    owner_id = auth.uid()
    and seller_verified = coalesce((select phone_verified from public.profiles where id = auth.uid()), false)
  )
);
create policy "Owners delete listings" on public.marketplace_listings for delete to authenticated using (owner_id = auth.uid() or public.is_admin());

create policy "Marketplace images public read" on public.marketplace_images for select using (true);
create policy "Owners insert listing images" on public.marketplace_images for insert to authenticated with check (
  exists(select 1 from public.marketplace_listings l where l.id = listing_id and l.owner_id = auth.uid())
);

create policy "Users read own favorites" on public.favorites for select to authenticated using (user_id = auth.uid());
create policy "Users create own favorites" on public.favorites for insert to authenticated with check (user_id = auth.uid());
create policy "Users delete own favorites" on public.favorites for delete to authenticated using (user_id = auth.uid());

create policy "Conversation participants read" on public.conversations for select to authenticated using (buyer_id = auth.uid() or seller_id = auth.uid());
create policy "Buyers create conversations" on public.conversations for insert to authenticated with check (
  buyer_id = auth.uid()
  and buyer_id <> seller_id
  and exists (
    select 1 from public.marketplace_listings l
    where l.id = listing_id and l.owner_id = seller_id and l.status = 'active'
  )
);
create policy "Participants read messages" on public.messages for select to authenticated using (
  exists(select 1 from public.conversations c where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid()))
);
create policy "Participants send messages" on public.messages for insert to authenticated with check (
  sender_id = auth.uid() and exists(select 1 from public.conversations c where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid()))
);

create policy "Polls public read" on public.polls for select using (published = true);
create policy "Poll options public read" on public.poll_options for select using (true);
create policy "Users read own votes" on public.votes for select to authenticated using (user_id = auth.uid());
-- Votes are inserted only by the server-side secure voting API using the service role.
-- There is intentionally no authenticated-client INSERT policy on public.votes.
create policy "Admins read all votes" on public.votes for select to authenticated using (public.is_admin());
create policy "Admins review votes" on public.votes for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins read vote attempts" on public.vote_attempts for select to authenticated using (public.is_admin());

create policy "Published blog posts public read" on public.blog_posts for select using (status = 'published' and published_at <= now());
create policy "Admins manage blog posts" on public.blog_posts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins read blog suggestions" on public.blog_suggestions for select to authenticated using (public.is_admin());
create policy "Admins update blog suggestions" on public.blog_suggestions for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Events public read" on public.events for select using (published = true);
create policy "Jobs public read" on public.jobs for select using (status = 'active');
create policy "Housing public read" on public.housing_listings for select using (status = 'active');

create policy "Authenticated users create reports" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "Admins read reports" on public.reports for select to authenticated using (public.is_admin());
create policy "Admins update reports" on public.reports for update to authenticated using (public.is_admin());

-- Storage bucket used by marketplace listing photos.
insert into storage.buckets (id, name, public)
values ('marketplace', 'marketplace', true)
on conflict (id) do nothing;

create policy "Marketplace images are public" on storage.objects
for select using (bucket_id = 'marketplace');

create policy "Authenticated users upload marketplace images" on storage.objects
for insert to authenticated with check (
  bucket_id = 'marketplace'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users manage their marketplace images" on storage.objects
for update to authenticated using (
  bucket_id = 'marketplace'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users delete their marketplace images" on storage.objects
for delete to authenticated using (
  bucket_id = 'marketplace'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Realtime chat
alter publication supabase_realtime add table public.messages;
