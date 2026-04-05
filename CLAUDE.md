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

**Netlify build command:** `DATABASE_URL=file:./dev.db npm run prisma:generate && npm run build`

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
| `DATABASE_URL` | SQLite path (e.g., `file:./dev.db`) |
| `MAPBOX_TOKEN` | Mapbox for story map |

## Other Instructions

- Do not make any changes until you have 95% confidence in what you need to build.  Ask me follow-up questions until you reach that confidence.
- 

