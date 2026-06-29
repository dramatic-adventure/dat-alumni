# Journey Card — Build Audit & Punch List

**Date:** 2026-06-28 · **Mode:** read-only analysis (no code changed)
**Audited against:** `journey-card-BUILD-SPEC.md` (V1), `lib/journeyCard.ts`, and the spec's named mockups.

---

## 0. Headline (read this first)

**The premise of the audit is out of date in two ways, both in your favor:**

1. **The mockups no longer exist.** `app/journey-card-mockup/` was deleted in commit `ece64e8` ("Remove mockups, docs, and planning files from public repo", ~June 3). There is **no `v17/` directory** — it was never committed under that name. The spec points at a visual reference that isn't in the tree anymore. The only surviving trace is descriptive comments in the ported components ("Ported from the approved v17 mockup…").

2. **The feature was already built.** The entire V1 — dedicated store, loader, types, all three routes, the API with self-publish + takedown, the Studio tab, and email notification — landed in a single commit `4da0654` ("Add Journey Card feature: dedicated store, public routes, self-publish", 2026-06-23). It is **not mockup code**; it is wired, integrated, and **`npm run check` passes clean** (typecheck + lint, exit 0).

So this is not "finish building from mockups." It is **"verify an already-built feature and do the operational + integration work to actually launch it."** That changes the punch list completely.

### Status: ~85% real

| Layer | State |
|---|---|
| Data model / types / helpers (`lib/journeyCard.ts`) | ✅ Real, complete |
| Dedicated store/loader (`lib/loadJourneyCards.ts`) | ✅ Real, complete |
| Public routes (`/journeys`, `/journeys/[slug]`, `/journeys/[slug]/[cardId]`) | ✅ Real |
| Display components (cover, adaptive index, archive w/ facets + hero, card view) | ✅ Real (ported) |
| API (`/api/alumni/journey` GET/POST/PATCH) | ✅ Real, correct auth |
| Self-publish auth (owner-or-admin, own slug only) | ✅ Real, correctly scoped |
| Profile Studio "Journey" tab | ✅ Real, mounted |
| Takedown + Resend email notify | ✅ Real |
| **"Journey Cards" Google Sheet tab created** | ❓ **Unverified — likely the actual blocker** |
| **Env vars present in Netlify** | ❓ Unverified |
| **Discoverability (any link into `/journeys`)** | ❌ **Missing — zero entry points** |
| **Itinerary-as-source-of-truth (`mergeProgramIntoCard`)** | ❌ **Not wired** (written but dead; deferred to "Companion") |
| Manual QA pass (publish → display → takedown → archive) | ❌ Not done |

The remaining 15% is **operations, one integration gap, one deferred locked-decision, and QA** — not feature code.

---

## 1. Spec build sequence (§8) — item by item

**1. Data + read layer** — ✅ **Done.**
- `lib/loadJourneyCards.ts` exists: `TAB = "Journey Cards"`, 22-column canonical `HEADERS`, and `loadJourneyCardsForSlug`, `loadAllJourneyCards`, `loadAllJourneyCardsIncludingRemoved`, `findJourneyCardRowById`, `appendJourneyCard`, `setJourneyCardStatus`.
- `lib/journeyCard.ts` already maps `JourneyCardRow → JourneyCard` via `journeyCardRowToCard()`. The spec's worry — "replace the `spotlightRowToJourneyCard` / `JOURNEY_CARD_TYPE` reuse mapping" — is **moot**; none of the rejected Spotlights-reuse code remains. It's a clean, first-class entity. No `tags`-blob, no spotlight dependency.

**2. Public display** — ✅ **Done.**
- `app/journeys/[slug]/page.tsx` → `AdaptiveProfileJourneys` (editorial ≤3 / rail ≥4 via `pickProfileLayout`). Uses real slug canonicalization (`resolveCanonicalSlug` + `getSlugAliases`), DAT-role fallback title.
- `app/journeys/[slug]/[cardId]/page.tsx` → single-card `JourneyCardView`, renders `DAT_DISCLAIMER`.

**3. Archive** — ✅ **Done.**
- `app/journeys/page.tsx` → `JourneyArchive`. Facets implemented: recent / person / country / program / project. By-person uses the real `FeaturedAlumni` (`dense`). Rotating image+quote hero (`JourneysHero`, dots, 5s rotation, head-bias via CSS). Multi-country `&` combine logic present (`countriesOf`, `cs.join(" & ")`).

**4. Self-publish** — ✅ **Done.**
- `app/api/alumni/journey/route.ts` POST: `requireAuth` + `assertCanEditProfile(alumniId)` (owner-OR-admin, **not** bare `isAdmin`), with cross-profile id-spoof guard. Studio "Journey" tab (`JourneyStudioPanel`) wired in `ProfileStudio.tsx` + `update-form.tsx`.

**5. Takedown + notify** — ✅ **Done.**
- PATCH sets `status` + `removalReason` (append-only, history preserved). Emails the artist via Resend **only when an admin removes a card they don't own**. Falls back gracefully (reason stored, warning logged) if Resend env is absent.

**6. Verification** — ⚠️ **Partial.** `npm run check` passes. The **manual** pass (publish → display → takedown → archive, retina/legibility) has not been done and can't be until the sheet tab + env are confirmed.

---

## 2. Data layer — verdict

A dedicated store **exists** and is correct. `lib/loadJourneyCards.ts` reads/writes a separate `"Journey Cards"` tab in the alumni spreadsheet (`ALUMNI_SHEET_ID`). **No Spotlights & Highlights reuse remains anywhere** — the rejected approach is fully gone. Reads degrade gracefully: if the tab doesn't exist, `loadAllJourneyCards()` / `loadJourneyCardsForSlug()` return `[]` (so the feature silently shows nothing); writes throw a clear "ensure a 'Journey Cards' tab exists" error.

---

## 3. Routes & API — verdict

All present, no gap vs. spec:
- `/journeys` (archive), `/journeys/[slug]` (adaptive index), `/journeys/[slug]/[cardId]` (single card) — note the per-card segment is `[cardId]`, matching the `href: /journeys/${slug}/${id}` in `journeyCardRowToCard`.
- `/api/alumni/journey` with GET (`?slug=`, `?all=1`, `?includeRemoved=1` gated to owner/admin), POST, PATCH.
- `middleware.ts` does **not** touch `/journeys` (only `/alumni/[slug]`) — fine, the routes do their own canonicalization.

---

## 4. Auth gap — verdict: **no gap, the mapping exists**

The session→profile-slug mapping the self-publish path needs is already in production use:
- Session carries `user.email` only (`auth.ts`). No slug on the session — resolved server-side per request, which is correct.
- `resolveSlugToAlumniId(spreadsheetId, slug)` → `assertCanEditProfile(req, alumniId)` (`lib/ownership.ts`). `assertCanEditProfile` = `requireAuth` → admin short-circuit → else `getAlumniIdForOwnerEmail()` must equal the target `alumniId` (reads the **Profile-Owners** sheet, Gmail-normalized). Same gate the existing profile editor uses (`/api/alumni/owner`). The journey route uses it correctly.

Spec §9.5 (should `FeaturedAlumni` get `linkBase`/`href`?) is **already resolved** — it has `dense?: boolean` and `linkBase = "/alumni"` props, and the archive passes `linkBase` so by-person tiles point at `/journeys/[slug]`.

---

## 5. Code health

- **`npm run check`: clean** (typecheck + lint, exit 0).
- **No `localStorage`/`sessionStorage`**, no hardcoded sample-data fixtures, no `TODO`/`FIXME` in the journey code. The grep hits for "mock"/"sample" are port-attribution comments; "placeholder" hits are legit `<input placeholder>` and the search box.
- **No broken imports to the deleted mockups** (would have failed the build).
- **`Date.now()` is used** for card-id suffixes (`makeJourneyCardId`) and `new Date().toISOString()` for timestamps — appropriate at request time on the server, not a mockup-ism.
- **One dead-but-harmless area:** `mergeProgramIntoCard`, `ProgramRecord`, and the `programId` column are defined but **never called/populated** anywhere outside `lib/journeyCard.ts` (see §6). Not a build risk; an unfulfilled feature.

---

## 6. The one real feature gap: itinerary is *not yet* the source of truth

Spec §2 locks: *"Itinerary is the single source of truth… program-level fields resolve live via `mergeProgramIntoCard()` keyed by `programId`."* In reality:
- `mergeProgramIntoCard()` / `ProgramRecord` are **never invoked** in any route or component.
- The Studio form (`JourneyStudioPanel`) has **no `programId` field** — it captures program/location/country/year as free text per card.
- So today every card renders from its **own stored snapshot**; editing a program/itinerary will **not** propagate. `lib/journeyCard.ts` even acknowledges this: *"Until the Companion phase ships that store, the card row's own snapshot is used."*

This is a deliberate deferral, but it contradicts a **locked decision**, so it needs an explicit V1 ruling (ship without it, or wire it now). See decisions below.

---

## 7. Prioritized punch list to ship V1

Sequenced; each item has effort (S/M/L) and blocking dependency.

### P0 — Launch blockers (mostly ops, do first)
1. **Create the `"Journey Cards"` tab in the alumni spreadsheet** with the exact 22-column header from `HEADERS` in `lib/loadJourneyCards.ts` (`id, profileSlug, programId, program, location, country, year, title, primaryRole, pullQuote, heroUrl, accent, dates, body, mediaUrls, ctaText, ctaUrl, featured, sortDate, status, removalReason, createdAt`). **— S. Blocks: everything.** This is almost certainly why the feature looks "unfinished" — without it, every page renders empty and publishing throws. *(Your action, not code.)*
2. **Confirm Netlify env vars:** `ALUMNI_SHEET_ID` (already used app-wide — should be set), `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` (the last two only affect takedown emails; absence degrades gracefully). **— S. Blocks: publish (1st var), notify (others).**

### P1 — Discoverability (the feature is invisible without this)
3. **Add entry points into `/journeys`.** There is currently **no link anywhere** — not in nav, footer, or the alumni profile page. At minimum: a "Journeys" nav/footer link to `/journeys`, and a "View journeys" link from `/alumni/[slug]` → `/journeys/[slug]`. **— S–M. Blocks: nothing; but without it nobody finds the feature.**

### P2 — Verification (can't complete until P0 done)
4. **Manual QA pass with one real card** (ideally a PASSAGE: Slovakia 2026 card): publish from Studio → appears on `/journeys/[slug]` and `/journeys` → admin takedown sets `removed` + emails artist → restore. Spot-check retina/legibility and the disclaimer. **— M. Depends on: #1, #2.**
5. **Confirm the image host is allowed** for hero/media URLs (next/image domains or the existing image proxy) — the archive/cover use `<img src>` with a `safeMediaUrl` guard, so verify real Google-hosted photos actually render and aren't blocked. **— S. Depends on: #4.**

### P3 — Locked-decision reconciliation
6. **Decide + (maybe) wire `mergeProgramIntoCard`.** Either (a) accept the per-card snapshot for V1 and update the spec to mark itinerary-merge as V2/Companion, or (b) add a `programId` picker to the Studio form, a minimal `ProgramRecord` lookup, and call `mergeProgramIntoCard` at render in the three routes. **— (a) S / (b) L. Blocks: nothing for launch; it's a spec-fidelity choice.**

### P4 — Polish (post-launch, optional)
7. SEO/sitemap inclusion for `/journeys` + per-alum pages; OG images for shared cards. **— M.**
8. Empty-state copy on `/journeys/[slug]` when an alum has zero cards (today it shows the DAT-role fallback only). **— S.**

---

## 8. Decisions I need from you before any code changes

1. **Has the `"Journey Cards"` sheet tab been created** in the alumni spreadsheet (and are `RESEND_API_KEY` / `CONTACT_FROM_EMAIL` set in Netlify)? This single answer determines whether P0 is "already done" or the main blocker.
2. **Itinerary source-of-truth (the locked decision in §2):** ship V1 on per-card snapshots and defer `mergeProgramIntoCard` to the Companion phase, or wire `programId` + program lookup now? (Recommend: **defer**, ship the snapshot, note it in the spec.)
3. **Discoverability:** where do you want `/journeys` surfaced — main nav, footer, the alumni profile page, or all three? And should it launch publicly now or stay unlinked (soft launch) until a batch of real cards exists?
4. **Notify channel** is currently automated Resend email on admin-initiated takedown. Confirm that's the V1 behavior you want (vs. a manual staff step).
5. **Scope of this engagement:** given the feature is built, do you want me to (a) just do the launch/QA/discoverability work (P0–P2), (b) also reconcile the itinerary decision (P3), or (c) a deeper line-by-line correctness/visual review of the ported components against your design intent?

---

*Files referenced: `app/api/alumni/journey/route.ts`, `lib/loadJourneyCards.ts`, `lib/journeyCard.ts`, `lib/notifyJourneyTakedown.ts`, `lib/ownership.ts`, `app/journeys/**`, `components/journeys/**`, `app/alumni/update/studio/JourneyStudioPanel.tsx`, `components/alumni/update/ProfileStudio.tsx`, `components/alumni/FeaturedAlumni.tsx`.*
