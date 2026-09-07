# Roaring Fork Local — V12 audit

This audit uses the `full-redesign-v12` branch as the code baseline and the September 6, 2026 localhost PDF as the visual baseline.

## High-priority visual issues found

1. **Header controls were cramped and visually unstable.**
   - Town and search controls competed for width.
   - The search icon was absolutely positioned over the input, which contributed to the "something in the search bar" appearance in the PDF.
   - Desktop and narrower layouts used different wrapping behavior without a unified control shell.

2. **The home hero did not carry the visual identity of the Roaring Fork Valley.**
   - The line drawing could disappear or render weakly in print/PDF capture.
   - The hero used a large amount of empty white space with little local visual context.
   - V12 phase 1 replaces it with a real Roaring Fork Valley photograph and a restrained overlay.

3. **Component styling was inconsistent.**
   - Some cards were square-edged, some rounded, some border-only, and some shadowed.
   - Header controls, forms, marketplace cards and restaurant filters did not share one radius/spacing/focus system.

4. **The footer was too tall relative to the amount of useful content.**
   - Town links consumed a large amount of vertical space in the PDF.
   - V12 compresses the information architecture while keeping all useful links.

5. **Restaurant filter sticky offset was brittle.**
   - The directory filter was tied to a fixed `top-[58px]` value even though the global header is taller than 58px.
   - This can cause the filter row to hide under the header.
   - V12 removes that brittle sticky behavior.

## Functional issues found

1. **Marketplace cards did not safely handle listings without a photo.**
   - The listing creation API allows an empty `image_url`.
   - The old card always passed `listing.imageUrl` into `next/image`.
   - V12 adds a proper no-photo state.

2. **A newly created marketplace listing did not take the user to the created listing.**
   - The API already returns `{ listing: { id, slug } }`.
   - The form previously reset instead of navigating to the new listing.
   - V12 redirects to the new listing when a production listing is created.

3. **Jobs and Housing are not full user-facing products yet.**
   - Read directories exist.
   - The database has `jobs` and `housing_listings`.
   - There are no public create/edit/detail routes or matching API routes in the current app tree.
   - Current pages intentionally stay reserved when Supabase is not configured.

4. **Events are browse-only.**
   - The events table and directory exist.
   - There is no public event detail route or submit-event workflow.

5. **Several database capabilities have no product UI.**
   - `favorites` exists but has no save/favorites UI.
   - `reports` exists but there is no user-facing report flow.
   - `marketplace_images` exists but the current listing workflow uses one primary photo only.
   - `restaurants.claimed_by` exists but there is no business claim workflow.
   - Marketplace owner RLS supports update/delete, but seller edit/delete UI is not yet present.

6. **Admin coverage is incomplete.**
   - Restaurant, blog and vote review screens exist.
   - Admin user invalidation API exists, but there is no full admin user-management screen in the public app tree.

7. **Voting has legacy technical debt but the current contest path is substantially stronger.**
   - Older `polls`, `poll_options`, `votes` and `vote_attempts` tables remain.
   - Current production restaurant contests use `contests`, `contest_restaurants`, `restaurant_votes`, verified email/phone identity, Turnstile and server-side vote casting.
   - The newer contest architecture should be treated as canonical and the older poll system should eventually be retired or clearly separated.

8. **Production functionality still depends on environment configuration.**
   - Supabase is required for persistent auth, listings, messages, jobs/housing inventory and production data.
   - Twilio Verify is required for phone verification.
   - Cloudflare Turnstile and `VOTE_FRAUD_SECRET` are required for hardened production voting.
   - The repo contains the required environment-variable template and CI checks.

## V12 phase 1 changes

- Modern two-level global header.
- Search control rebuilt without overlapping absolute-positioned UI.
- Town control normalized to the same component system.
- Real Roaring Fork Valley hero photograph with attribution.
- Unified spacing, radius, shadows and focus states.
- Modernized home page sections.
- Modernized marketplace filters and cards.
- Safe no-photo marketplace state.
- Listing creation redirects to the new listing.
- Restaurant directory filter no longer relies on a stale sticky offset.
- Footer compacted.

## Next functional build phases

### Phase 2 — finish the six core products
- Jobs: create, edit, detail and owner management.
- Housing: create, edit, detail and owner management.
- Events: detail and submit-event flow.
- Marketplace: edit/delete, multiple photos, favorites and report listing.

### Phase 3 — account and administration
- Saved listings/favorites.
- User profile settings.
- Admin users screen.
- Report moderation.
- Business/restaurant claim workflow.

### Phase 4 — production hardening
- Run all current database migrations against the production Supabase project.
- Verify storage policies and realtime messaging.
- Configure Turnstile, Twilio Verify and stable fraud secret.
- Smoke-test auth, voting, posting, messaging and admin roles in production.
- Add end-to-end tests for the critical account/vote/listing workflows.
