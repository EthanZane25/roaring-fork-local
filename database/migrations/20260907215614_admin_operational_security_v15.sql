-- Harden privileged profile fields and enable admin operational access.

create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  new.role := old.role;
  new.phone_verified := old.phone_verified;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileged_fields on public.profiles;
create trigger protect_profile_privileged_fields
before update on public.profiles
for each row execute function public.protect_profile_privileged_fields();

drop policy if exists "Admins update profiles" on public.profiles;
create policy "Admins update profiles" on public.profiles
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins manage restaurant reviews" on public.restaurant_reviews;
create policy "Admins manage restaurant reviews" on public.restaurant_reviews
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins manage admin audit log" on public.admin_audit_log;
create policy "Admins manage admin audit log" on public.admin_audit_log
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins read site error logs" on public.site_error_logs;
create policy "Admins read site error logs" on public.site_error_logs
for select to authenticated
using (public.is_admin());

drop policy if exists "Admins read site metrics" on public.site_metrics;
create policy "Admins read site metrics" on public.site_metrics
for select to authenticated
using (public.is_admin());

drop policy if exists "Admins read ad events" on public.ad_events;
create policy "Admins read ad events" on public.ad_events
for select to authenticated
using (public.is_admin());

drop policy if exists "Active advertisers are readable" on public.advertisers;

drop policy if exists "Public site settings are readable" on public.site_settings;
drop policy if exists "Public read site settings" on public.site_settings;
create policy "Public read site settings" on public.site_settings
for select using (key in ('branding','homepage','footer','features','seo'));
