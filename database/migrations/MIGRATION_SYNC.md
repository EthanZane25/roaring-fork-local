# Supabase migration synchronization

These files synchronize the GitHub repository with the live Roaring Fork Local Supabase migration history as of September 7, 2026.

Represented production migrations:

- `20260907181054_admin_control_center_and_advertising`
- `20260907200259_full_product_features_v14`
- `20260907200417_public_site_content_policies_v14`
- `20260907215614_admin_operational_security_v15`

The first three SQL files reproduce the statements recorded in the live `supabase_migrations.schema_migrations` history. V15 was applied after the admin/security audit to protect privileged profile fields and add the RLS policies required by the operational admin control center.

Do not manually rerun migrations against an already-migrated production project. Add future schema changes as new migration files and apply them through the normal Supabase migration workflow.
