drop policy if exists "Public site settings are readable" on public.site_settings;
create policy "Public site settings are readable" on public.site_settings for select using (true);

drop policy if exists "Active advertisers are readable" on public.advertisers;
create policy "Active advertisers are readable" on public.advertisers for select using (status = 'active');

drop policy if exists "Active campaigns are readable" on public.ad_campaigns;
create policy "Active campaigns are readable" on public.ad_campaigns for select using (
  status = 'active'
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);
