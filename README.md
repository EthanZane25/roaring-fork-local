# Roaring Fork Local

A focused Aspen-to-Rifle local directory built around six products: Restaurants, Marketplace, Vote, Events, Jobs, and Housing.

## Stack

- Next.js 16 App Router
- React 19 + TypeScript
- Tailwind CSS 4
- Supabase PostgreSQL, Auth, Storage, and RLS
- Cloudflare Turnstile for production abuse protection
- Twilio Verify for SMS phone verification
- Vercel deployment target

## Current information architecture

Public product routes:

- `/` — compact home: headline, tonight, cuisine links, three marketplace listings, account CTA
- `/restaurants` — restaurant directory grouped by one required primary cuisine
- `/restaurants/[slug]` — restaurant detail, photo, and current vote contest
- `/marketplace` — local classifieds
- `/events` — events grouped by day
- `/vote` — the one current restaurant contest
- `/jobs` — reserved until the job inventory is real
- `/housing` — reserved until the housing inventory is real
- `/account` — sign-in state, email/phone verification, and the user’s current vote

Legacy town URLs redirect into these top-level products with a single `?town=` site filter. There is one town selector in the global header rather than separate town chip systems on individual pages.

## Home

Home intentionally does not duplicate the six-product navigation. It contains only:

1. Short hero; search remains in the global header.
2. Three events happening today in the America/Denver timezone.
3. Primary cuisine links: American, Italian, Mexican, Japanese, Cafe & bakery, Other.
4. Three newest marketplace listings.
5. A thin “One account for the whole corridor” CTA.

There is no restaurant card grid or voting widget on Home.

## Restaurant data model

Every restaurant has one required `primary_cuisine`:

- `american`
- `italian`
- `mexican`
- `japanese`
- `cafe-bakery`
- `other`

The existing `cuisines[]`, `search_tags[]`, and `meals[]` fields remain available for search and descriptive tags, but they do not control directory grouping.

For an existing Supabase project, run:

```text
database/migrations/20260826_directory_contests.sql
```

For a new Supabase project, run `database/schema.sql` and then `database/seed.sql`; the consolidated schema already contains the migration.

## Verified contest voting

Production voting never relies on React state, cookies, localStorage, IP address, or device fingerprint as the one-vote lock.

The identity and vote model is:

```text
users: id, email unique, phone_e164 unique, email_verified_at, phone_verified_at, banned_at
contests: id, slug, title, starts_at, ends_at, status
contest_restaurants: contest_id, restaurant_id
restaurant_votes: contest_id, user_id, restaurant_id, created_at, updated_at
  UNIQUE (contest_id, user_id)
```

A production vote requires:

1. Signed-in Supabase account.
2. Confirmed email.
3. Twilio Verify SMS challenge.
4. A unique E.164 phone number assigned to only one app user.
5. Open contest and eligible restaurant.
6. Cloudflare Turnstile when production vote security is enabled.

`POST /api/votes` calls the service-role-only PostgreSQL function `cast_restaurant_vote(...)`. The function uses `INSERT ... ON CONFLICT (contest_id, user_id) DO UPDATE`, so changing a vote updates the same row rather than adding a second vote.

Supporting endpoints:

- `POST /api/votes` — cast or change one verified vote
- `GET /api/votes/me` — current user’s eligibility and existing choice
- `GET /api/contests/[slug]/results` — public results from counted, currently verified, non-banned users only

### Abuse controls

- Vote changes: 5 attempts per hour per user/contest.
- Account creation: loose per-IP rate limit plus Turnstile, designed not to treat shared lodge/library Wi-Fi as one person.
- SMS: rate limits per phone and per IP.
- Device/browser/IP hashes are fraud signals only, never the identity lock.
- Same-device, same-browser-signature, shared-network, same-restaurant burst, and very-new-account patterns contribute to a risk score.
- High-risk votes are stored as `held` and excluded from public totals until staff review.
- Staff can count/reject held votes or invalidate a user from `/admin/votes`; invalidated users are excluded from results.

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

Without Supabase variables the public directory renders bundled demo content. Production account creation, phone verification, and voting require the backend services below.

## Production environment

```env
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SITE_NAME=Roaring Fork Local

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

ADMIN_EMAILS=
```

Generate `VOTE_FRAUD_SECRET` once and keep it stable:

```bash
openssl rand -hex 32
```

Never expose the service-role key, Turnstile secret, Twilio auth token, or vote-fraud secret with a `NEXT_PUBLIC_` prefix.

## Supabase setup

For a fresh project:

1. Run `database/schema.sql` in the Supabase SQL editor.
2. Run `database/seed.sql`.
3. Configure the Supabase URL and keys.
4. Add your production origin to Auth redirect URLs.
5. Configure Turnstile and Twilio Verify before enabling production contests.
6. Set `ADMIN_EMAILS` for staff who can review held votes.

For an existing v6 database, run `database/migrations/20260826_directory_contests.sql`, then rerun the appended contest/cuisine seed section in `database/seed.sql` or seed the current contest from the admin/database console.
