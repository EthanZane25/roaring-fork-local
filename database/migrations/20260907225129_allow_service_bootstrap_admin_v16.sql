-- Allow trusted server/database administration to bootstrap and maintain
-- privileged profile fields. Browser users still cannot self-escalate
-- their role or phone verification.

create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin()
     or auth.role() = 'service_role'
     or session_user = 'postgres' then
    return new;
  end if;

  new.role := old.role;
  new.phone_verified := old.phone_verified;
  return new;
end;
$$;
