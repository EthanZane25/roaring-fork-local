create table if not exists public.advertisers (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text,
  email text,
  phone text,
  website text,
  status text not null default 'prospect' check (status in ('prospect','active','inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.advertisers(id) on delete cascade,
  name text not null,
  placement text not null check (placement in ('home_featured','home_sponsored','restaurants_featured','marketplace_featured','events_featured','jobs_featured','housing_featured','sitewide_banner')),
  town_slug text references public.towns(slug) on delete set null,
  headline text not null default '',
  body text not null default '',
  image_url text,
  destination_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'draft' check (status in ('draft','active','paused','ended')),
  priority integer not null default 0,
  monthly_price numeric(12,2),
  billing_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create index if not exists ad_campaigns_placement_status_idx on public.ad_campaigns(placement,status,priority desc);
create index if not exists ad_campaigns_dates_idx on public.ad_campaigns(starts_at,ends_at);
create index if not exists ad_campaigns_town_idx on public.ad_campaigns(town_slug);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.advertisers enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.site_settings enable row level security;

create policy "Admins manage advertisers" on public.advertisers
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Public read active ad campaigns" on public.ad_campaigns
for select using (
  status = 'active'
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);

create policy "Admins manage ad campaigns" on public.ad_campaigns
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Admins manage site settings" on public.site_settings
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Public read site settings" on public.site_settings
for select using (key in ('branding','homepage','footer','features','seo'));

create policy "Admins manage events" on public.events
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage jobs" on public.jobs
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage housing" on public.housing_listings
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage marketplace listings" on public.marketplace_listings
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage marketplace images" on public.marketplace_images
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage conversations" on public.conversations
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage messages" on public.messages
for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.site_settings(key,value,description)
values
('branding', jsonb_build_object('siteName','Roaring Fork Local','tagline','People · Places · Community'), 'Site identity and logo text'),
('homepage', jsonb_build_object('heroTitle','Local life, all in one place.','heroSubtitle','Food, classifieds, jobs, housing & local votes from Aspen to Rifle.','heroImage','/roaring-fork-valley-hero.jpg'), 'Homepage hero content'),
('footer', jsonb_build_object('description','A useful local source for the Roaring Fork corridor, from Aspen through Rifle.'), 'Footer copy'),
('features', jsonb_build_object('restaurants',true,'marketplace',true,'vote',true,'events',true,'jobs',true,'housing',true,'blog',true), 'Public feature toggles'),
('seo', jsonb_build_object('title','Roaring Fork Local | Aspen to Rifle','description','Local restaurants, marketplace, events, jobs, housing and community voting from Aspen to Rifle.'), 'Default SEO metadata')
on conflict (key) do nothing;

insert into storage.buckets(id,name,public)
values ('advertising','advertising',true)
on conflict (id) do nothing;

create policy "Advertising assets public" on storage.objects
for select using (bucket_id = 'advertising');
create policy "Admins upload advertising assets" on storage.objects
for insert to authenticated with check (bucket_id = 'advertising' and public.is_admin());
create policy "Admins update advertising assets" on storage.objects
for update to authenticated using (bucket_id = 'advertising' and public.is_admin()) with check (bucket_id = 'advertising' and public.is_admin());
create policy "Admins delete advertising assets" on storage.objects
for delete to authenticated using (bucket_id = 'advertising' and public.is_admin());
