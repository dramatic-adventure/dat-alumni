# Journey Card — Production Build Spec (V1)

**Status:** Mockups approved → ready to build. Hand this to a fresh task as the anchoring context.
**Prepared:** June 2026 · supersedes the May exploration report (`journey-card-architecture.docx`)
**Approved visual reference (committed):** `app/journey-card-mockup/v17/` (especially `alumni-index/`)
**Data foundation (already built, real code):** `lib/journeyCard.ts`

---

## 1. What a Journey Card is

A participant-authored, post-program record attached to an alumni profile. First use case: PASSAGE: Slovakia 2026. The card is the curated, shareable artifact that crosses from the private program space into the public alumni archive.

## 2. Locked decisions

- **Artists self-publish. DAT does NOT pre-approve a card's content.** (This removes the entire staff draft → preview-token → approve flow the May report assumed.)
- **Every card carries a disclaimer:** "An individual artist's reflection — not necessarily the views of Dramatic Adventure Theatre." Canonical string: `DAT_DISCLAIMER` in `lib/journeyCard.ts`.
- **DAT retains takedown + notify.** Admin can take a card down (reuses the existing `hidden` soft-delete column), records a reason, and notifies the artist why.
- **Project label convention everywhere a program is named:** `Program: Location Year` — e.g. `ACTion: Ecuador 2010`, `PASSAGE: Slovakia 2026`, `Teaching Artist Residency: Slovakia 2017`. Program names keep literal brand casing ("ACTion", never "ACTION").
- **Itinerary is the single source of truth for program facts.** Program-level fields (partners, locations, dates) resolve live from the program/itinerary record via `mergeProgramIntoCard()` keyed by `meta.programId`, so editing the itinerary propagates to every card without re-saving cards. The card row only stores the artist's authored content.
- **Public route:** `/journeys/[alumni-slug]` for a person's journeys (the per-alum adaptive index). The global archive lives at a top-level journeys archive route.
- **Cards never repeat info in surrounding text** — if it's on the card (program/country/year/role), it's not duplicated in captions.

## 3. The unifying architecture (one rule)

A "passport stack" and an "adaptive index" are two states of the same group of cards:

- One card → a single card.
- A group with >1 card → collapses into a **passport stack** (clean iMessage-style pile, buffer space between stacks).
- Click a stack → it **expands into the adaptive index** of just that group.

**Adaptive layout rule** (`pickProfileLayout(count)` in `lib/journeyCard.ts`):
- ≤ 3 cards → **Editorial Index** (Option A)
- ≥ 4 cards → **Inline Rail** (Option B)
- Passport Stack (Option C) is the swipeable alternative.

**Therefore:** an alum profile is just the global archive pre-filtered to one person, rendered as the left-aligned adaptive index. Same component logic, one rule.

## 4. The global archive

Searchable page of every journey card. Default view = **most recently added** (flat, newest first). Facet toggle + search switch into grouped/stacked views:

- **By person** — mini profile cards (the real `FeaturedAlumni` component, `dense` mode). Links to `/journeys/[slug]`.
- **By country** — city/region projects roll into their country. A project crossing borders (e.g. ACTion: Heart of Europe) forms a combined **"Czechia & Slovakia"** multi-country category; on the card itself the label reads the project location ("Heart of Europe"), the label beneath the stack reads "Czechia & Slovakia". Multi-country cards ALSO appear under an individual country's pile **only if that country already has a single-country project** (so Slovakia yes; no Czechia-only pile since there's no Czechia-only project).
- **By program** — the franchise (PASSAGE / ACTion / Teaching Artist Residency).
- **By project** — the specific `Program: Location Year`.

Above the search bar: a rotating **image + quote hero** as a lean-back way in (reconciles the image-led card idea with the clean stamped grid). Controllable dots; head-biased image crop.

## 5. Data model — a Journey Card is its OWN thing

**A Journey Card is not a spotlight or a highlight.** It gets its own dedicated store, type, loader, and API — do NOT reuse the "Spotlights & Highlights" sheet or its `type` field. (The May report's "reuse Spotlights & Highlights" idea is explicitly rejected.)

**Store:** a new dedicated **"Journey Cards"** Google Sheet tab (mirrors how the Spotlights tab is loaded in `lib/loadSpotlightsFromSheet.ts`, but separate). Because it's its own schema, give it proper, first-class columns rather than cramming metadata into a `tags` blob. Suggested columns:

`id, profileSlug, programId, program, location, country, year, title, body, mediaUrls, sortDate, ctaText, ctaUrl, featured, status, removalReason, createdAt`

- `status` → `live` | `removed` (its own soft-delete; an admin takedown sets `removed` + `removalReason`). No dependence on the Spotlights `hidden` column.
- `programId` → reference to the program/itinerary record so program facts resolve live (`mergeProgramIntoCard`).
- `title`/`body`/`mediaUrls` → the artist's authored content; everything else is program scaffolding or state.

**New data layer (its own, not the spotlight loader):**
- `lib/loadJourneyCards.ts` (new) — `loadJourneyCardsForSlug(slug)` and `loadAllJourneyCards()` (full-tab read for the archive), plus `appendJourneyCard()` / `setJourneyCardStatus()`.
- Define a first-class `JourneyCardRow` type for this tab.

**Reusable helpers already in `lib/journeyCard.ts`:** `DAT_DISCLAIMER`, `formatProgramLabel`, `parseProgramLabel`, `mergeProgramIntoCard`, `ProgramRecord`, `pickProfileLayout`, and the `JourneyCard` display type. Note: `spotlightRowToJourneyCard` / `JOURNEY_CARD_TYPE` / the `tags`-encoding helpers were written assuming the reuse approach — replace the mapping with `JourneyCardRow → JourneyCard` now that it has its own columns.

## 6. Components to port from the mockup

All in `app/journey-card-mockup/v17/alumni-index/` — port into real components reading live data:
- `V14StyleCover.tsx` — the passport card (hero + DAT stamp + Program/Country/Year + role; two-tier title for long program names; clean enlarge-on-hover).
- `AdaptiveProfileJourneys.tsx` — the adaptive index (drives `/journeys/[slug]`).
- `JourneyArchive.tsx` — the searchable archive (faceting, stacks, expand, hero slideshow).
- `FeaturedAlumni` (`components/alumni/FeaturedAlumni.tsx`, now with `dense` prop) — by-person tiles.
- The single front-of-house Journey Card flip view: `app/journey-card-mockup/v17/JourneyCardV17.tsx` (light card on the global kraft background; disclaimer + readable back-cover credit; mobile/passport layout also used for portrait iPads).

## 7. API / write path plan — its own route

- **New dedicated route `/api/alumni/journey`** (do not extend the spotlight route).
  - **GET** `?slug=` → one alum's live cards; and a read for the archive backed by `loadAllJourneyCards()`.
  - **POST (artist self-publish — THE ONE REAL GAP):** a logged-in alum publishes a journey card **for their own profile slug only**. Auth: `requireAuth` + the session's profile slug === target slug; **NOT** `isAdmin`. (Mirror the auth pattern in `app/api/alumni/spotlight/route.ts` but swap the admin check for a same-slug check.)
  - **Takedown (admin):** an admin-only action sets `status = "removed"` + `removalReason` on the card's own row, then notifies the artist.
- **Notify:** V1 can be a simple email/mailto step (confirm channel). The reason is stored on the row regardless.
- **Profile Studio:** add a new alum-facing **"Journey"** tab mirroring the existing `highlightPanel` pattern (`StudioTab` union + panel slot in `components/alumni/update/ProfileStudio.tsx`) — but it writes to the Journey Cards store via the new route, not the spotlight route.

## 8. Suggested build sequence

1. **Data + read layer:** create the dedicated "Journey Cards" sheet tab + `lib/loadJourneyCards.ts` (`JourneyCardRow`, `loadJourneyCardsForSlug`, `loadAllJourneyCards`); update `lib/journeyCard.ts` to map `JourneyCardRow → JourneyCard`.
2. **Public display:** `/journeys/[slug]` adaptive index (port `AdaptiveProfileJourneys`) + the card flip view; render `DAT_DISCLAIMER`.
3. **Archive:** the global searchable archive route (port `JourneyArchive`); wire facets to live grouping.
4. **Self-publish:** the scoped alum write route + the Profile Studio "Journey" tab.
5. **Takedown + notify:** admin soft-delete with reason + artist notification.
6. **Verification:** `npm run check` (typecheck + lint), manual pass of publish → display → takedown → archive, image/retina + legibility spot-checks.

## 9. Open questions to resolve early (95%-confidence gate)

1. Self-service write route — scope auth to the alum's own slug. How is the session→profile-slug mapping done today (NextAuth → AlumniRow)? Confirm before writing.
2. The new dedicated "Journey Cards" sheet tab — confirm the exact column set (section 5) and create the tab. (Journey Cards are their own entity, NOT spotlights/highlights.)
3. Takedown notification channel — automated email vs. manual staff step for V1.
4. `/journeys/[slug]` slug source — reuse the existing alumni slug + `loadSlugForwardMap` canonicalization.
5. Should `FeaturedAlumni` get an optional `linkBase`/`href` prop so by-person tiles point to `/journeys/[slug]` (it currently hardcodes `/alumni/[slug]`)?

## 10. Guardrails

- CLAUDE.md: **no changes until 95% confidence** — ask follow-ups first.
- `npm run check` before committing. Netlify build: `DATABASE_URL=file:./dev.db npm run prisma:generate && npm run build`.
- Keep the mockups intact as the visual reference until each production surface replaces them.
