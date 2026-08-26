-- Apply this migration to an existing Roaring Fork Local database created before v6.

-- Restaurant photos are a paid advertising benefit.
-- Free restaurant listings remain text-only throughout the public directory.
alter table public.restaurants
  add column if not exists is_advertiser boolean not null default false;

comment on column public.restaurants.is_advertiser is
  'When true, the restaurant may receive labeled sponsored photo placement on public pages.';
