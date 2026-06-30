# Field Kit — Slice 3: Notifications (schema, env, ops)

Web-push backbone with two trigger paths: a Google Sheet `notify` toggle (scanned
by a scheduled function) and the in-app admin console (`/field-kit/admin`).

> Companion to `field-kit-ITINERARY-SCHEMA.md`. The rally point is attached to the
> `/api/field-kit/itinerary` payload, so it precaches offline with the itinerary
> and rides the existing LiveRefresh change-detection.

---

## 1. New Google Sheet tabs (create in `ALUMNI_SHEET_ID`)

Header row 1 must use these exact column names (order tolerant; matched case-insensitively).

### `Field Kit Push Subscriptions`
One row per device push subscription. **Deduped by `endpoint`.** Written by the
subscribe endpoint; dead subscriptions (404/410) are pruned automatically.

| programId | alumniSlug | endpoint | keys | createdAt |
|---|---|---|---|---|
| passage-slovakia-2026 | jesse-baxter | https://fcm.googleapis.com/… | `{"p256dh":"…","auth":"…"}` | 2026-06-30T12:00:00.000Z |

### `Field Kit Notifications`
The notifications log + Sheet-toggle trigger source. `sentAt` is the exactly-once
guard. To fire one from the Sheet: add a row, set `notify` to `TRUE`, leave
`sentAt` empty — the cron sends it within ~1 min and stamps `sentAt`.

| id | programId | type | title | body | link | notify | sentAt |
|---|---|---|---|---|---|---|---|
| n_abc123 | passage-slovakia-2026 | update | Change of plans | Meet at the theater at 6 | /field-kit/itinerary | TRUE | _(empty → will send)_ |

- `type`: `update` or `rally`.
- `notify`: `TRUE`/`FALSE` (also accepts 1/yes/y).
- Admin-console sends append a row with `sentAt` already set (so the cron skips it).

### `Field Kit Rally Point`
One row **per program** (latest wins). Upserted by the admin "Set rally point" action.

| programId | location | lookFor | meetTime | departure | updatedAt |
|---|---|---|---|---|---|
| passage-slovakia-2026 | Main square fountain | Yellow DAT flag | 3:30pm | 3:45pm sharp | 2026-06-30T12:00:00.000Z |

---

## 2. Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | client + server | VAPID public key (non-secret by design; the browser needs it to subscribe). |
| `VAPID_PRIVATE_KEY` | server | VAPID private key. **Secret.** |
| `VAPID_SUBJECT` | server | `mailto:` or `https:` contact for VAPID. Optional — defaults to `mailto:hello@dramaticadventure.com`. |
| `CRON_SECRET` | server + Netlify fn | Shared secret the scheduled function sends to authorize `/api/field-kit/push/dispatch`. **Secret.** Without it the dispatch route refuses to run. |

Reused (already configured): `ALUMNI_SHEET_ID`, `FIELD_KIT_PROGRAM_ID`,
`ADMIN_EMAILS` (admin gate), `APP_BASE_URL` (dispatch base URL; falls back to
Netlify's `URL`/`DEPLOY_PRIME_URL`).

Generate VAPID keys once: `npx web-push generate-vapid-keys`.

New dependency: **`web-push`** (+ `@types/web-push` dev).

---

## 3. Scheduled function

`netlify/functions/send-notifications.ts` runs every minute (`* * * * *`, mirrors
`refresh-fallbacks.ts`). It is a **thin trigger**: it POSTs
`/api/field-kit/push/dispatch` with the `x-cron-secret` header. The real work
(authenticated Sheets read/stamp + web-push) lives in that route because it imports
`server-only` modules that don't load in the esbuild-bundled function. The route is
idempotent — it claims each row by stamping `sentAt` before sending.

---

## 4. Gating summary (defense in depth)

- `/api/field-kit/push/subscribe` · `…/unsubscribe` — `getFieldKitAccess` /
  `guardFieldKitApi`: anon → 401, non-roster → 403. programId + slug are
  server-derived; one program's member can't subscribe under another.
- `/api/field-kit/admin/*` — `guardFieldKitAdminApi`: same, **plus** `access.isAdmin`.
- `/field-kit/admin` page — `requireFieldKitPage` then `notFound()` for non-admins.
  The AccountMenu "Staff console" link is convenience, not the boundary.
- `sendToProgram` fans out only to the program's `clusterRoster` subscriptions, so
  one program can never notify another's roster.

---

## 5. Manual verification

1. Set the four env vars; create the three tabs. `npm run dev`.
2. Install the PWA (iOS 16.4+ requires standalone). Account menu → **Get trip
   alerts** → grant permission. A row appears in `Field Kit Push Subscriptions`.
3. **Sheet path:** add a `Field Kit Notifications` row, `notify=TRUE`, `sentAt`
   empty. Within ~1 min the push arrives and `sentAt` gets stamped.
4. **Admin path:** open `/field-kit/admin` (admin account) → Send field update →
   push arrives immediately; tapping opens the itinerary. Set rally point → push
   arrives, the rally card shows on Today, and it's in the itinerary payload.
