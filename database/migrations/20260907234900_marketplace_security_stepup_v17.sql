do $$
begin
  alter type public.listing_status add value if not exists 'held' after 'draft';
exception
  when duplicate_object then null;
end $$;

create table if not exists public.security_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  user_id uuid references auth.users(id) on delete set null,
  listing_id uuid references public.marketplace_listings(id) on delete set null,
  device_hash text,
  ip_hash text,
  network_hash text,
  user_agent_hash text,
  decision text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists security_events_event_created_idx on public.security_events(event_type, created_at desc);
create index if not exists security_events_user_created_idx on public.security_events(user_id, created_at desc);
create index if not exists security_events_device_created_idx on public.security_events(device_hash, created_at desc);
create index if not exists security_events_ip_created_idx on public.security_events(ip_hash, created_at desc);

create table if not exists public.security_stepups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null,
  device_hash text not null,
  verified_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint security_stepups_purpose_check check (purpose in ('create_listing')),
  constraint security_stepups_expiry_check check (expires_at > verified_at)
);

create index if not exists security_stepups_lookup_idx
  on public.security_stepups(user_id, purpose, device_hash, expires_at desc)
  where used_at is null;

alter table public.security_events enable row level security;
alter table public.security_stepups enable row level security;

drop policy if exists "Admins read security events" on public.security_events;
create policy "Admins read security events"
on public.security_events
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins read security stepups" on public.security_stepups;
create policy "Admins read security stepups"
on public.security_stepups
for select
to authenticated
using (public.is_admin());

grant select on public.security_events to authenticated;
grant select on public.security_stepups to authenticated;
grant all on public.security_events to service_role;
grant all on public.security_stepups to service_role;
grant usage, select on sequence public.security_events_id_seq to service_role;
