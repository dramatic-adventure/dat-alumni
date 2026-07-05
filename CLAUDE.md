# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**dat-alumni** is a Next.js 16 (App Router) full-stack application for Dramatic Adventure Theatre (DAT) — an alumni storytelling and community platform with donation processing, an interactive story map, and artist profiles.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run build:seed   # Build with namestack seed generation
npm run check        # Run typecheck + lint together (do this before committing)
npm run lint:fix     # Auto-fix lint issues
npm run typecheck    # TypeScript check only (tsc --noEmit)
npm run prisma:generate  # Regenerate Prisma client after schema changes
```

**Netlify build command (see `netlify.toml`):** `npm run prisma:generate && npm run build`. `prisma:generate` only generates the client — it does not touch the database. Netlify's `DATABASE_URL` (Neon Postgres) is set in the site's env vars, not in this command.

**Schema changes are applied via `prisma db push`, not `prisma migrate`.** The `prisma/migrations/` directory predates the move to Neon and is still SQLite-formatted (see its `migration_lock.toml`) — it does not match the current `postgresql` datasource and nothing in the build pipeline runs `prisma migrate deploy`. To apply a schema change, run `npx prisma db push --schema=prisma/schema.prisma` locally against the real `DATABASE_URL` (e.g. from `.env.local`). Do not add new files to `prisma/migrations/`; they won't be applied by anything.

There are no test commands — this project has no automated test suite.

## Architecture

### Data Flow

```
Browser (React/Client Components)
    ↓
Next.js Server Components / API Routes
    ├── Google Sheets API  ← Primary data source (alumni, stories, drama clubs)
    ├── Netlify Blobs      ← Fallback CSV cache (refreshed every 15 min)
    ├── SQLite/Prisma      ← Donations and Stripe payment records
    └── Stripe API         ← Payment processing
```

### Key Layers

**`/lib`** — Server-side data loading (~94 files). The most critical files:
- `lib/loadAlumni.ts` — Primary alumni data loader; tries Sheets API first, falls back to CSV
- `lib/loadCsv.ts` — CSV loading with Netlify Blobs caching and ISR support
- `lib/csvUrls.ts` — Hardcoded Google Sheets CSV export URLs (avoids Netlify Lambda 4KB env var limit)
- `lib/googleClients.ts` — GCP service account auth (supports `GCP_SA_JSON_BASE64` for Netlify, split vars, or plain JSON)
- `lib/fetchStories.ts`, `lib/dramaClubMap.ts`, `lib/productionMap.ts`, etc. — Domain-specific data loaders

**`/app`** — Next.js App Router pages and API routes
- `/app/api/` — Auth (NextAuth Google OAuth), admin diagnostics, alumni/story data, Stripe webhooks, image proxy
- `/app/alumni/[slug]/`, `/app/story/[slug]/`, `/app/drama-club/[slug]/` — Dynamic profile/content pages

**`/components`** — React components organized by domain (`alumni/`, `donate/`, `map/`, `productions/`, `ui/`, `shared/`)

**`/netlify/functions/refresh-fallbacks.ts`** — Scheduled Netlify function (every 15 min) that refreshes CSV data into Netlify Blobs so the fallback cache stays fresh.

**`/prisma/schema.prisma`** — SQLite schema for `DonationPayment`, `RecurringGift`, and `StripeWebhookEvent`

**`/middleware.ts`** — Edge middleware for slug canonicalization and redirects

**`/auth.ts`** — NextAuth v4 config (Google OAuth)

### Caching Strategy

- React `cache()` is used for request-level memoization across server components
- `ALUMNI_TTL_MS` controls in-memory alumni data TTL (default 60s)
- Netlify Blobs acts as a distributed CDN-level fallback layer for all Google Sheets data
- The scheduled `refresh-fallbacks` function keeps blobs fresh so cold starts don't hit the Sheets API rate limit

### GCP / Google Sheets Auth

Credentials can be provided in three ways (checked in order in `lib/googleClients.ts`):
1. `GCP_SA_JSON_BASE64` — base64-encoded full service account JSON (preferred for Netlify)
2. `GCP_SA_JSON` — raw JSON string
3. Split vars: `GCP_SA_EMAIL`, `GCP_SA_PRIVATE_KEY`, `GCP_PROJECT_ID`

### Slug System

Alumni and content pages use a slug forwarding system (`loadSlugForwardMap`) to canonicalize old/alternate slugs to current ones. This includes a cycle-guard to prevent infinite redirect loops.

## Key Environment Variables

| Variable | Purpose |
|---|---|
| `GCP_SA_JSON_BASE64` | GCP service account credentials (base64) |
| `GOOGLE_SHEET_ID` | Primary Google Sheet ID |
| `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Auth |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Payments |
| `NETLIFY_BLOBS_*` or auto-injected | Netlify Blobs access |
| `DATABASE_URL` | Postgres connection string (Neon) — donation/credential storage. `.env`'s `file:./dev.db` is a stale placeholder, unused in practice |
| `MAPBOX_TOKEN` | Mapbox for story map |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Field Kit web push public key (Slice 3); non-secret, stays in Builds env. See `field-kit-NOTIFICATIONS-SCHEMA.md` |

### Notification secrets live in Netlify Blobs, not env

`VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, and `CRON_SECRET` are **not** set as Netlify
function environment variables. Added to the function env alongside the existing
GCP credentials, they pushed the Lambda env bundle over AWS's 4 KB limit and broke
deploys. They are instead stored in a site-wide, persistent Netlify Blobs store
(`dat-notification-secrets`, no `deployID`, so it survives across deploys) and
read at runtime via `lib/notificationSecrets.ts`, which caches the values on
`globalThis` per warm instance.

- Read path: `lib/webPush.ts`, `app/api/field-kit/push/dispatch/route.ts`, and
  `netlify/functions/send-notifications.ts` all go through
  `lib/notificationSecrets.ts` (`getVapidPrivateKey`, `getVapidSubject`,
  `getCronSecret`).
- Falls back to the same-named env var if Blobs has nothing for a key — this is
  what makes local `next dev` work off `.env.local` without any Blobs
  credentials, and is also what made the rollout reversible (see below).
- To (re)write the secrets: `npm run setup:notification-secrets` (prompts for
  each value with masked input; requires `NETLIFY_SITE_ID` +
  `NETLIFY_AUTH_TOKEN` locally since there's no Netlify runtime to
  auto-inject Blobs credentials outside of Netlify itself).
- `lib/googleClients.ts` and the `GCP_SA_*` vars were deliberately left
  untouched — only the three notification secrets moved.

### Email sends via Gmail API; its secrets follow the same Blobs pattern

All site email goes through `lib/sendEmail.ts` (Gmail API as a dedicated
mailbox, OAuth refresh token scoped to `gmail.send` only — see
`site-BUILD-SPEC-gmail-email.md` for why app passwords and domain-wide
delegation were rejected). `GMAIL_OAUTH_CLIENT_ID` / `GMAIL_OAUTH_CLIENT_SECRET` /
`GMAIL_OAUTH_REFRESH_TOKEN` live in the `dat-email-secrets` Blobs store, read
via `lib/emailSecrets.ts` (same env-var fallback for local dev). Write them
with `npm run setup:email-secrets`; mint the refresh token once with
`npm run mint:gmail-refresh-token`. `CONTACT_FROM_EMAIL` stays a plain env var.
Caveat: Google revokes Gmail-scoped refresh tokens if the sending mailbox's
password changes — if all email breaks at once, re-mint and re-store the token.

## Other Instructions

- Do not make any changes until you have 95% confidence in what you need to build.  Ask me follow-up questions until you reach that confidence.
- 

