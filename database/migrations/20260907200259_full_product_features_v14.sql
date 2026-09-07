alter table public.restaurants
  add column if not exists reservation_url text,
  add column if not exists parking_notes text,
  add column if not exists editor_pick boolean not null default false,
  add column if not exists kid_friendly boolean not null default false,
  add column if not exists patio boolean not null default false,
  add column if not exists dietary_tags text[] not null default '{}',
  add column if not exists best_for_tags text[] not null default '{}',
  add column if not exists last_checked_at timestamptz,
  add column if not exists rating_average numeric(3,2) not null default 0,
  add column if not exists rating_count integer not null default 0;

alter table public.marketplace_listings
  add column if not exists condition text,
  add column if not exists delivery_available boolean not null default false,
  add column if not exists location_note text,
  add column if not exists expires_at timestamptz,
  add column if not exists sold_at timestamptz,
  add column if not exists views_count integer not null default 0;

create index if not exists marketplace_expires_status_idx on public.marketplace_listings(status, expires_at);

alter table public.events
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists image_url text,
  add column if not exists ticket_url text;

create table if not exists public.restaurant_reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text,
  body text not null check (char_length(body) between 10 and 2000),
  verified_local boolean not null default false,
  status text not null default 'published' check (status in ('published','held','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);

create index if not exists restaurant_reviews_restaurant_idx on public.restaurant_reviews(restaurant_id, status, created_at desc);

alter table public.restaurant_reviews enable row level security;
drop policy if exists "Public reviews are readable" on public.restaurant_reviews;
create policy "Public reviews are readable" on public.restaurant_reviews for select using (status = 'published' or user_id = auth.uid());
drop policy if exists "Users can create own reviews" on public.restaurant_reviews;
create policy "Users can create own reviews" on public.restaurant_reviews for insert with check (user_id = auth.uid());
drop policy if exists "Users can update own reviews" on public.restaurant_reviews;
create policy "Users can update own reviews" on public.restaurant_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Users can delete own reviews" on public.restaurant_reviews;
create policy "Users can delete own reviews" on public.restaurant_reviews for delete using (user_id = auth.uid());

create or replace function public.refresh_restaurant_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  rid := coalesce(new.restaurant_id, old.restaurant_id);
  update public.restaurants r
  set rating_average = coalesce(x.avg_rating, 0),
      rating_count = coalesce(x.review_count, 0),
      updated_at = now()
  from (
    select restaurant_id, round(avg(rating)::numeric, 2) as avg_rating, count(*)::int as review_count
    from public.restaurant_reviews
    where restaurant_id = rid and status = 'published'
    group by restaurant_id
  ) x
  where r.id = rid;
  if not found then
    update public.restaurants set rating_average = 0, rating_count = 0, updated_at = now() where id = rid;
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists restaurant_review_rating_refresh on public.restaurant_reviews;
create trigger restaurant_review_rating_refresh after insert or update or delete on public.restaurant_reviews
for each row execute function public.refresh_restaurant_rating();

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('restaurant','marketplace','event','job','housing')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);
create index if not exists saved_items_user_idx on public.saved_items(user_id, created_at desc);
alter table public.saved_items enable row level security;
drop policy if exists "Users manage own saved items" on public.saved_items;
create policy "Users manage own saved items" on public.saved_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.event_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  remind_at timestamptz not null,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, event_id, remind_at)
);
alter table public.event_reminders enable row level security;
drop policy if exists "Users manage own event reminders" on public.event_reminders;
create policy "Users manage own event reminders" on public.event_reminders for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.admin_audit_log (
  id bigserial primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log(created_at desc);
alter table public.admin_audit_log enable row level security;

create table if not exists public.site_error_logs (
  id bigserial primary key,
  level text not null default 'error',
  source text not null default 'web',
  message text not null,
  stack text,
  path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists site_error_logs_created_idx on public.site_error_logs(created_at desc);
alter table public.site_error_logs enable row level security;

create table if not exists public.site_metrics (
  id bigserial primary key,
  metric text not null,
  value numeric not null,
  path text,
  rating text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists site_metrics_created_idx on public.site_metrics(created_at desc);
alter table public.site_metrics enable row level security;

create table if not exists public.ad_events (
  id bigserial primary key,
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  event_type text not null check (event_type in ('impression','click')),
  town_slug text,
  path text,
  created_at timestamptz not null default now()
);
create index if not exists ad_events_campaign_idx on public.ad_events(campaign_id, event_type, created_at desc);
alter table public.ad_events enable row level security;

create or replace function public.consume_rate_limit(p_kind text, p_key_hash text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare recent_count integer;
begin
  delete from public.security_rate_events where created_at < now() - interval '2 days';
  select count(*) into recent_count
  from public.security_rate_events
  where kind = p_kind
    and key_hash = p_key_hash
    and created_at >= now() - make_interval(secs => p_window_seconds);
  if recent_count >= p_limit then
    return false;
  end if;
  insert into public.security_rate_events(kind, key_hash) values (p_kind, p_key_hash);
  return true;
end $$;

revoke all on function public.consume_rate_limit(text,text,integer,integer) from public;
grant execute on function public.consume_rate_limit(text,text,integer,integer) to service_role;

insert into public.site_settings(key,value,description) values
('branding', '{"siteName":"Roaring Fork Local","tagline":"People · Places · Community"}'::jsonb, 'Site identity'),
('homepage', '{"heroTitle":"The valley, without the noise.","heroSubtitle":"The restaurants worth knowing, a cleaner local marketplace, and what is happening nearby.","heroImage":"/roaring-fork-valley-hero.jpg"}'::jsonb, 'Homepage content'),
('features', '{"restaurants":true,"marketplace":true,"events":true,"jobs":true,"housing":true,"vote":true,"blog":true}'::jsonb, 'Feature visibility'),
('footer', '{"description":"A useful local source from Aspen to Rifle."}'::jsonb, 'Footer content'),
('seo', '{"title":"Roaring Fork Local | Aspen to Rifle","description":"Restaurants, marketplace, events, jobs, housing and local voting across the Roaring Fork Valley."}'::jsonb, 'Default SEO')
on conflict (key) do nothing;
