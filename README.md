# Roaring Fork Local

A local discovery platform for the Roaring Fork Valley, covering Aspen through Rifle. The application combines a restaurant directory, hyperlocal classifieds, community voting, jobs, housing, events, and local business discovery in one SEO-first Next.js application.

## Stack

- Next.js 16 App Router
- React 19 + TypeScript
- Tailwind CSS 4
- Supabase PostgreSQL, Auth, Realtime, and Storage
- PostGIS-ready database schema
- Cloudflare Turnstile-ready forms
- Vercel deployment target

## Local development

1. Install Node.js 22 LTS or newer.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Start the app:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`.

The application runs with bundled demo data when Supabase variables are not configured.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `database/schema.sql`.
4. Run `database/seed.sql`.
5. Copy the project URL and publishable key into `.env.local`.
6. Add your production URL to Supabase Auth redirect URLs.

## Production

Deploy to Vercel and add all environment variables to the project. For voting, account signup, phone verification, marketplace posting, and suggestion abuse protection, configure Cloudflare Turnstile. In Supabase, also enable Turnstile under Authentication → Bot and Abuse Protection so signup CAPTCHA tokens are validated by Supabase Auth.

## Primary routes

- `/` — homepage
- `/aspen` — town hub
- `/restaurants` — valley restaurant directory
- `/aspen/restaurants/breakfast` — programmatic SEO category page
- `/marketplace` — local classifieds
- `/marketplace/new` — create a listing
- `/vote` — community voting
- `/events` — local events
- `/jobs` — local jobs
- `/housing` — local housing
- `/blog` — local stories and community suggestions
- `/search` — cross-site search
- `/account` — user account
- `/admin` — administration
- `/admin/blog` — blog publishing and suggestion review
- `/admin/votes` — held-vote and fraud-signal review

## Design principle

Indexable pages are generated only for real towns/categories with useful data. Arbitrary search-result URLs are marked `noindex` to avoid thin or duplicate SEO pages.

## Community blog and suggestions

The `/blog` section contains published local posts and a Turnstile-protected suggestion form. Public suggestions are **not** automatically published; they are stored for editor review in `blog_suggestions`. Admins can review suggestions and create posts at `/admin/blog`.

## Hardened voting

Live voting is intentionally routed through `/api/votes`; authenticated clients do not have direct INSERT access to the `votes` table. The production flow uses multiple independent controls:

1. Confirmed user account.
2. Twilio Verify SMS challenge from the Account page.
3. One verified phone hash can belong to only one profile.
4. Cloudflare Turnstile on phone verification, account signup, vote submission and blog suggestions.
5. One vote per account per poll enforced by a PostgreSQL unique constraint.
6. One vote per verified phone per poll enforced by a second PostgreSQL unique index.
7. A long-lived first-party device cookie plus coarse browser signature, IP hash and network hash are used as fraud signals.
8. Rapid attempts are rate-limited.
9. High-risk votes are stored as `held` and do not increment the public total until an admin approves them at `/admin/votes`.
10. Raw IP addresses and raw verified phone numbers are not stored in the application tables used for vote fraud analysis; keyed hashes are stored instead.

No public web voting system can make duplicate human participation mathematically impossible without requiring government identity or equivalent identity proofing. This design deliberately raises the cost of ballot stuffing while avoiding an automatic one-IP-one-vote rule that would incorrectly block families, offices, hotels or shared Wi-Fi.

### Production security environment variables

Set all of these before enabling live voting:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET=
TURNSTILE_HOSTNAME=
VOTE_FRAUD_SECRET=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=
```

Generate `VOTE_FRAUD_SECRET` once and keep it stable. For example on macOS:

```bash
openssl rand -hex 32
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET`, `TWILIO_AUTH_TOKEN`, or `VOTE_FRAUD_SECRET` with a `NEXT_PUBLIC_` prefix.

For an existing database created with an earlier version of this project, run:

```text
database/migrations/002-blog-and-secure-voting.sql
```

For a new Supabase project, run `database/schema.sql` and then `database/seed.sql`.

## Restaurant directory and guided finder

The restaurant directory uses a compact client-side filtering layer over server-loaded restaurant records. It supports town, cuisine, meal, price, open-now, preference tags, sorting, searchable restaurant names and incremental rendering. The same component powers the valley-wide and town-specific directory pages.

The `Help me choose` flow is implemented in `components/food-finder.tsx`. It asks one question at a time, scores restaurants using the same structured fields used by search and SEO, and falls back to closest matches when the database does not contain three exact results. This means it improves automatically as the restaurant database is populated.

## Restaurant directory / advertising rule (v6)

The restaurant directory is intentionally text-first. Free restaurant listings do not receive photo placement. Restaurant photos are rendered only when `restaurants.is_advertiser = true`, and those placements are labeled `Sponsored`.

For an existing Supabase database, run:

```sql
-- database/migrations/003-restaurant-advertising.sql
alter table public.restaurants
  add column if not exists is_advertiser boolean not null default false;
```

Then use `/admin/restaurants` to mark a paid restaurant advertiser. An image URL by itself does not make the image public; the advertiser flag must also be enabled.
