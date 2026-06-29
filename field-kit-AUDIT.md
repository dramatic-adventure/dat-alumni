# Field Kit / Companion — Forward-Looking Audit & Build Assessment

**Date:** 2026-06-28 · **Mode:** read-only analysis (no code changed)
**Audited:** the V17 "traveling-artist" Companion mockup (primary), the V15 field-kit/capture/studio/itinerary-system lineage, and the V17 overview pages.
**Anchored against:** `field-kit-BUILD-SPEC.md` (Slice 1), `journey-card-BUILD-SPEC.md`, `journey-card-AUDIT.md`, and `lib/journeyCard.ts` (the public-artifact handoff boundary).
**Companion to:** `journey-card-AUDIT.md` — this is the *private workspace* side of "two surfaces, one spine." Kept deliberately separate from the V1 Journey Card work.

---

## 0. Read this first — where the mockups actually are

The audit brief said the mockups exist on disk as untracked files under `app/journey-card-mockup/`. **In this working tree they do not.** `app/journey-card-mockup/` was removed in commit `ece64e8` (June 3) **and added to `.gitignore`** (line 78). `git status --ignored` shows no such directory — it is genuinely absent from `/Users/jessebaxter/dev/dat-alumni`.

The files physically survive in a **separate local copy**:
`/Users/jessebaxter/Documents/dat-alumni.OLD-icloud/app/journey-card-mockup/v17/traveling-artist/` (and `…/v15/`).
This audit read them there. **Everything below is real and was audited directly** — but two consequences matter for any build:

1. **`field-kit-BUILD-SPEC.md` is stale on its own premise.** It says *"Approved visual reference (committed): `app/journey-card-mockup/v17/traveling-artist/`"* and *"Keep the mockup intact … do not edit anything under `app/journey-card-mockup/`."* That directory isn't in the repo. A fresh Claude Code task handed that spec **will not find the files** and (per `journey-card-AUDIT.md` §0, which hit the same wall) may wrongly conclude "deleted / nothing to build." **Before any build, copy the V17 traveling-artist mockup back into the working tree** (it'll be gitignored, which is fine) or update the spec to point at the OLD-icloud path.
2. The mockup is the **only** design contract. There is no Figma; the `.tsx` files *are* the spec. Losing the OLD-icloud copy would lose the design.

> **Re-verification (2026-06-28, fresh session):** §0 was independently re-checked against the live working tree and confirmed accurate on every point:
> - `app/journey-card-mockup/` is **physically absent** from `/Users/jessebaxter/dev/dat-alumni` (`ls` → no such file or directory; `git status --ignored` shows no mockup entry).
> - Removed in `ece64e8` ("Remove mockups, docs, and planning files from public repo", Jun 3) and gitignored at `.gitignore:78` (`app/journey-card-mockup/`). Last commit touching the path before that was `070d269`.
> - The mockups exist at `~/Documents/dat-alumni.OLD-icloud/app/journey-card-mockup/v17/traveling-artist/` with all 13 surfaces present.
> - `field-kit-BUILD-SPEC.md` **is** stale on its premise — line 5 claims the reference is "(committed): `app/journey-card-mockup/v17/traveling-artist/`" and lines 16/98/143/153 instruct "do not edit anything under `app/journey-card-mockup/`," a path that is not in the repo. Confirmed.
> - `lib/loadProgram.ts` does not exist (only `lib/programMap.ts`); no `app/field-kit/` route. Confirmed.
> - `journey-card-AUDIT.md` §0 independently reaches the same conclusion about the same removal commit.
>
> **One refinement:** "OLD-icloud" is a misleading name — it is **not a stale backup, it is the live design workspace.** The mockup directories were last modified **Jun 22**, nineteen days *after* the Jun 3 removal commit, so design work continued there after the files left the repo. Treat it as the authoritative, irreplaceable source of the design and **do not delete it.**

---

## 1. Vision summary & completeness

**What the Companion is.** One system, two surfaces, two products:

- **Two surfaces** — the **Field Kit** (mobile, offline-first, installable PWA, used on the ground mid-trip) and the **Journey Card Studio** (desktop, for composing/reviewing/publishing).
- **Two products** — **The Companion** (the *private* in-program workspace: today's mission board, itinerary, capture, traces, composer, library, cohort, field-ops) and **The Journey Card** (the *public* artifact that comes out of it, already built as V1).

The spine is the **itinerary** (`Program → Chapter → ItineraryDay → TimeAnchor`). Captures bind to it; cohort cross-links bind to it; published cards resolve program facts from it. The governing ethos is **offline-first** ("Saved on this device — syncs when reconnected," no scary errors, nothing lost) and **"invitation over instruction / no shame, no metrics"** (chapters are "expected but not mandatory; zero or six, neither is wrong"). The boundary rule: **THE FIELD writes privately; the alumni platform publishes** — nothing is public until the artist stamps it.

**How complete is the design?** Two very different numbers:

- **Design / vision: ~75%.** The *happy-path* visual design is strong, coherent, and remarkably consistent across 14 surfaces — one designed object, not a stack of apps. The shared token system, primitives (`PhoneFrame`, `CompanionTabBar`, `Pill`, `Stamp`, `StatusChip`, `SectionIntro`), the Ecuador-PDF aesthetic (GOAL/TIPS/spirit lines/time-anchors/» markers), and the ethos copy are essentially finished. What's missing from the *design*: virtually all non-happy states (empty / loading / error / **real** offline / permissions / recording-in-progress / upload-failed / push-failed / partial-acknowledgement), and a reconciliation of two competing capture data models (see §4).
- **Production / build: ~2%.** Effectively nothing is built. There is **no** `/field-kit` or `/companion` route, **no** program/itinerary loader (`lib/loadProgram.ts` does not exist), **no** PWA manifest or service worker, **no** push, **no** offline queue. One slice (Today + Itinerary, read-only) is *specced* but not started. The mockups have almost no interactivity: only `ComposerStudio` (face switcher), `CohortCompany` (trip/post toggle + witness switcher), and `RetroactiveJourneyCard` (real spine CRUD) hold any `useState`; every save, upload, check-in, vote, and ack is a no-op driven by fixtures and **deterministic sine-wave "waveforms."**

**Honest scale statement.** This is a **much larger build than the Journey Card V1.** V1 was one entity, one store, three read routes, one scoped write — and it landed in a single commit on top of existing infra. The Companion needs **~10 net-new data stores, a PWA/offline-sync foundation the app has never had, a media pipeline that includes audio, a per-cohort enrollment/role model, and (for the field-ops surfaces) a near-real-time bidirectional channel the current Sheets/Blobs/SQLite architecture does not provide.** Several surfaces are aspirational (live presence, push delivery, offline map tiles/routing, PDF/OCR ingestion); several are buildable soon (itinerary read, capture-to-trace, traces→card draft, resources, retroactive).

---

## 2. Per-surface status table

Design = how complete/coherent the designed surface is. Build = production readiness (all ~2% — shown for the *relative* lift). Tier: **Soon** = buildable on near-term infra · **Infra** = needs a new cross-cutting system · **Aspirational** = assumes infrastructure that's a major project or external-platform-constrained.

| Surface | File | Design | Interactivity | Biggest missing states | Net-new data | Tier |
|---|---|---|---|---|---|---|
| **Field Kit Home / Today** | `shell/Shell.tsx` | Strong (most complete) | None (all links) | empty day, real offline, loading; module count badges lean "metric" | itinerary day, module summaries, cohort-today | Soon (read) |
| **Itinerary** | `itinerary/ItineraryCompanion.tsx` | Strong | None | before-trip / after-trip; real offline; live "today" | **Program/Chapter/Day/TimeAnchor** (the spine) | Soon (read) |
| **Rally Point** | `rally-point/RallyPointDetail.tsx` | Strong (most polished) | None (no-op buttons) | ack states, queued-offline confirm; map is decorative SVG | RallyPoint + RallyAck | Infra (acks) / Aspirational (map+ETA) |
| **Roll Call** | `roll-call/RollCall.tsx` | Strong | None (no-op) | check-in write/queue; closed/all-present; staff view | RollCall + responses | Infra (live fan-in) |
| **Quick Capture** | `capture/QuickCapture.tsx` | Partial — 1 of 7 doors built | None (`useState`-free) | mic permission, post-record review, save/discard, upload | Trace + AmbientSession + media | Infra→Aspirational (audio) |
| **My Traces** | `traces/MyTraces.tsx` | Strong (happy path) | None | empty; **per-trace visibility editor is promised but absent**; playback | Trace store + visibility ladder | Soon (text) / Infra (media) |
| **Composer** | `composer/ComposerStudio.tsx` | Strongest / spec-grade | Face switcher only | real text inputs, recording, upload `uploading`/`failed` states | Entry (richest schema) + MediaQueue | Infra (offline drafts+media) |
| **Field Library** | `resources/ResourcesLibrary.tsx` | Strong | None | per-resource download/queued/failed; batch download | Resource + Shelf | Infra (offline download) |
| **The Company / Cohort** | `cohort/CohortCompany.tsx` | Strong (trip + post-trip) | Trip/post + witness toggle | offline/unresolved cross-link; empty roster | CohortMember + WitnessEntry | Soon (roster) / Infra (cross-links, presence) |
| **Admin Field Ops** | `admin/AdminFieldOps.tsx` | Richest (1,358 lines) | Real local state; clipboard works | push-failed, partial-delivery, online state, auth-failed | AdminUpdate + all field-ops stores | **Aspirational** (push + live acks) |
| **The Itinerary System (Pipeline)** | `pipeline/PipelineStudio.tsx` | Thin by design (explainer) | None | all interactive states; parse-failed/OCR | SourceDoc → ProgramRecord | Soon (manual CRUD) / Aspirational (parsing) |
| **Review & Publish** | `publish/PublishReview.tsx` | Strong, ceremonial | None (no `onClick`) | publish-in-progress/failed; success transition | maps→`JourneyCardRow` (lossy, see §5) | Infra (multi-system write + media gate) |
| **Retroactive** | `retroactive/RetroactiveJourneyCard.tsx` | Strong; most interactive | Real spine CRUD | editable memory fields; alum-auth; persistence | PastProgram + ArchivePrompt | Soon (build) / Infra (alum gate, write) |
| *Chrome (review-only)* | `TravelingArtistChrome.tsx` | Complete as scaffolding | n/a | drop in production (mobile uses tab bar) | n/a | n/a |

**Cross-surface design notes worth fixing before build:**
- **Hand-authored strings that must become derived data:** itinerary mini-stats are wrong ("Five chapters, ten days" but the data holds **6** chapters / **11** days); resources "today's picks" hardcodes "Day 5 · Košice"; cohort's "Theo, Sam, and Dev are on other assignments today" contradicts the track data. Real surfaces must compute these from the spine.
- **Accent type mismatch:** `Chapter.accent` allows `"purple"` (sampleProgram) but `JourneyAccent` (lib/journeyCard.ts) does not — a purple chapter silently becomes teal on publish.
- **"today" is a hardcoded FK** (`PROGRAM.todayDayId = "d05"`). Real "today" needs the device clock mapped to `fullDate`/timezone, which forces the missing **before-trip** and **after-trip** states everywhere.

---

## 3. Ethos & consistency verdict

- **Shared design language: excellent.** Every surface uses the same tokens/primitives and reads as one product. This is the strongest part of the work.
- **"No shame, no metrics": genuinely realized in the *data model and UI*** (cohort shows presence not productivity; `publishedChapters` is deliberately 0 in-trip; ghost chapters say "no anxiety, no pressure"; publish is "not a checklist, not punitive"). **Watch two spots:** the Today mission board's count badges (`rcHere/total`, `ccVotes/total`) and Admin's Company-Choice vote bars / "not yet answered (n)" lists sit right on the no-metrics line. They're operational, not vanity — but decide whether artist-facing counts should be softened or staff-only.
- **Offline-first: consistently *expressed*, nowhere *implemented*.** The copy is perfect and never scary ("saved on device, syncs when signal returns" recurs; the Composer header even spells out IndexedDB + Workbox background-sync). But the *mechanism* is named only in annotations. Static `offline="ready"` props and green "cached" chips are decorative. **This is the single largest gap between the documented ethos and a buildable mockup.**
- **"Two surfaces, one spine": coherent and on-message, but narrated/navigated, not wired.** Traces→Composer→Publish→public card is depicted as links and fixtures; no data actually flows. The handoff onto the real `JourneyCardRow` is **structurally lossy** (see §5).

---

## 4. Data model findings (the canonical "what data this needs")

`sampleProgram.ts` (1,205 lines) is the de-facto schema. Production overlap is **narrow** — only four entities map to real stores:

| Already real (reuse) | Real store |
|---|---|
| `ARTIST` | alumni profile loader (`/alumni/[slug]`, Profile-Owners) |
| `PROGRAM` / `PAST_PROGRAMS` (identity) | `lib/programMap.ts` (no `todayDayId`/`essence`/per-day data) |
| `DRAMA_CLUBS` | `lib/dramaClubMap.ts` (much richer real type; mockup uses a thin subset) |
| Publish destinations | real routes + `lib/journeyCard.ts` |

**Everything else is net-new with no production store:** the itinerary spine (Program-trip / Chapter / ItineraryDay / TimeAnchor), the editable chapter spine with `goal`/`tips`/`prompt`, Resources + Shelves, the Cohort roster with `track`/`publishedChapters`, Traces (+ 4-level visibility ladder), the Entry draft store, the MediaQueue, the entire field-ops layer (RallyPoint / RollCall / CompanyChoice + responses/acks), the Admin push log, WitnessEntry cross-links, ArchivePrompts, and AmbientSession capture state.

**Two competing capture vocabularies must be reconciled before building Capture/Traces/Composer:**
- Capture/Traces use `CaptureKind` + `Trace` — loose `meta` *string* ("Today · Market"), `visibility: private|crew|review|public`, **no `dayId`/`chapterId` FK**, no timestamps, no media-blob ref, no sync status.
- Composer uses `Invitation` (`visibility: card|sealed`) + `Entry` — structured `chapterId` **and** `dayId`, photos/audio, reflection, status. This is the **richest, best-linked** schema.

**Recommendation:** one unified `Trace` entity carrying `chapterId`/`dayId`, real timestamps, a media-blob reference, and a `syncStatus`, that composes into an `Entry` draft. Decide the visibility model: the 4-level ladder (Trace) vs. the binary card/sealed (Invitation) — they conflict.

**Itinerary relationship graph (the spine):** `Chapter --(dayIds[])--> ItineraryDay --(times[])--> TimeAnchor`; both Chapter and Day carry optional `dramaClub`/`partnerOrg` slugs; `Entry.chapterId/dayId` and `MediaQueueItem.entryId` join back; all cohort-keyed data (acks, roll-call, votes, witnesses) joins on `CohortMember.id`. **`partnerOrg` has no production store** — net-new.

**V15 → V17 lineage (what was explored then cut):** V15 had a desktop **editorial Studio** (a staff review-queue that composed crew contributions into a card) and a **source-document → readiness pipeline** with explicit parsing intent, plus share-surface exporters and a post-save "company mosaic." **V17 dropped all of these** in favor of the artist self-curating their own traces + admin field-ops. Worth knowing: the cut Studio is the surface you'd want if DAT ever decides staff should *help compose* cards rather than only take them down.

---

## 5. The handoff — Companion record → Journey Card draft

This is the spine boundary, and it has **real gaps** against `lib/journeyCard.ts`:

1. **Structural mismatch (the load-bearing one).** The Companion's content is **multi-chapter** (`CHAPTERS[]`, each with its own response/photos/prompt; or the retroactive editable `chapters: string[]`). `JourneyCardRow` is **one flat row** — single `title`, `pullQuote`, `body`, `heroUrl`, comma-joined `mediaUrls`. There is **no chapter array and no per-chapter status field** in the row. Publishing therefore needs an **unbuilt flatten/serialize step** (N chapters → one body, choose one pull-quote + one hero). The heavily-marketed "blank chapters become placeholder shapes in the published card" feature **has nowhere to live** in the current schema. Either the serialization is defined, or `JourneyCardRow` grows a chapter structure.
2. **`programId` is the linchpin and is absent from every mockup.** The locked design resolves program facts live via `mergeProgramIntoCard(card, programRecord)` keyed by `programId`. No mockup mints or references one. This is exactly the gap `journey-card-AUDIT.md` §6 already flagged as "written but dead." The Companion's program/itinerary store is what's *supposed* to populate `ProgramRecord` — so building the itinerary loader (Slice 1) is the prerequisite that finally activates the live-merge.
3. **Retroactive cards may legitimately have no `programId`.** 20-year-old trips predate any itinerary store, so there's no `ProgramRecord` to bind — they must rely on the row snapshot (which `lib/journeyCard.ts:24` anticipates as the fallback). Flag: the schema's "live program facts" guarantee silently does not apply to the back-catalog.
4. **Fields never collected** in the publish/retroactive flows: `title`, `primaryRole` (retroactive), `accent` (retroactive → defaults teal), `ctaText/ctaUrl`. And `mediaUrls` can't be written until the upload queue drains.
5. **The publish write itself is a multi-system transaction with no error story:** write `JourneyCardRow` to the "Journey Cards" tab → bust the Netlify Blobs index cache → add a reference to the alumni record. The mockup shows only the warm offline-deferred path; there is no publish-in-progress, publish-failed, or rollback state anywhere.

---

## 6. Production-dependency map (cross-cutting systems)

None of these exist today. Effort is **S** (days) / **M** (1–2 weeks) / **L** (multi-week, or external-platform-constrained). "Blocks" = what can't ship without it.

| # | System | Current status | Effort | Blocks |
|---|---|---|---|---|
| **D1** | **Program/Itinerary store + loader** (`lib/loadProgram.ts`, new Sheet tab(s), CSV/Blobs fallback, `Row→ProgramItinerary` mapping) | None. `programMap.ts` has identity only, no per-day/chapter/time-anchor data. | **M** | Itinerary, Today, Resources today-picks, Cohort "today," **and** activates `mergeProgramIntoCard` for Journey Card V1. The foundation everything binds to. |
| **D2** | **Auth & per-cohort enrollment + roles** (session → artist → "in-program for PASSAGE Slovakia 2026"; artist vs staff) | Partial. `auth.ts` (email-keyed) + `lib/ownership.ts` (admin/owner, Profile-Owners sheet) exist, but there is **no roster / "who is on this program" source** and no per-cohort role. | **M** | Every Companion surface (it's in-program-gated). Admin Field Ops needs the staff role. No roster source exists yet — must be decided. |
| **D3** | **PWA / offline foundation** (manifest, service worker, app-shell + itinerary + roster + safety precache, install affordance, real offline indicators) | None. No manifest, no SW, no PWA lib chosen. | **M** | The entire "Field Kit on a plane / in a jungle" promise. Slice-1 read-only offline. Library choice (Serwist vs next-pwa vs hand-rolled Workbox) is open. |
| **D4** | **Offline write queue + background sync** (IndexedDB draft store, MEDIA_QUEUE, last-write-wins, Workbox background-sync) | None. No IndexedDB usage anywhere in the app. | **L** | Capture writes, Composer drafts, all field-ops acks/votes/check-ins, media uploads. The "nothing gets lost" guarantee. |
| **D5** | **Media pipeline incl. audio** (image **and** audio upload + storage; ambient-sound recording w/ live waveform, voice notes; offline upload queue with `uploading`/`failed`/retry) | **Partial.** `app/api/upload` (Drive-backed, **image-only**, normalized, auth/rate-limited, **synchronous/online-only**) + `app/api/media` + `app/api/img` proxy exist. **No audio, no offline queue, no background sync.** | **L** | Quick Capture (ambient/voice/image), Traces media, Composer photos/audio, Publish media-sync gate. Audio recording/storage is net-new; the existing image path needs an offline-queue wrapper. |
| **D6** | **Real-time / presence** (live roster status for Roll Call + Rally acks; "with you today") | None. Architecture is Sheets/Blobs/SQLite — no websocket/polling/live datastore. | **L** | Roll Call live fan-in, Rally Point ack list, cohort presence. **Conflicts with pure offline-first** — offline you only have last-synced status. Needs a deliberate store-and-forward design, not true real-time. |
| **D7** | **Push / notifications** (Admin pushes Field Updates; acknowledgement tracking; reminders) | None. No web-push, no FCM. | **L** | Admin Field Ops delivery, Rally/Roll-Call reminders, "Roll Call opened" alerts. **iOS PWA web-push is severely constrained** — this is the most platform-risky dependency. The mockup's own fallback is **WhatsApp/SMS copy-paste** (the Field Kit generates copy; humans carry it) — which is the realistic V1. |
| **D8** | **The publish→public-card write + serialization** (flatten multi-chapter → `JourneyCardRow`, mint `id`, set `programId`, drain media, write tab, bust cache, reference alumni record) | None. V1 self-publish route exists (`/api/alumni/journey`) but expects a flat single card, not a Companion multi-chapter record. | **M** | Review & Publish, Retroactive. The actual moment the private workspace becomes public. Depends on D1 (programId) + D5 (media drain). |
| **D9** | **Field-ops data stores** (RallyPoint, RollCall, CompanyChoice, AdminUpdate push log + responses/acks) | None. | **M–L** | Rally Point, Roll Call, Company Choice, Admin Field Ops. Cheap to *store*; expensive to make *live* (needs D6/D7). |
| **D10** | **Offline maps + routing** (cached map tiles, "human landmark," ETA) | None. `MAPBOX_TOKEN` exists for the story map; Rally's map is a decorative SVG. | **L** | Rally Point's map/ETA only. Mapbox offline regions + routing. Lowest priority — the "human landmark beats GPS" copy makes this skippable for V1. |
| **D11** | **Itinerary ingestion / parsing** (PDF/Gdoc/paste → structured chapters; OCR for back-catalog scans) | None. The Pipeline page is honest that this is a "future add-on, not a prerequisite." | **L** | Nothing for V1 — the realistic path is a human typing structured chapters into the D1 store (a CRUD form). Parsing/OCR is a later optimization, plausibly an LLM-extraction job. |

---

## 7. Phased build plan

The guiding principle: **the smallest useful Companion is a read-only field document that makes the spine real and finally activates the Journey Card's `programId` merge.** Then add private capture that produces a draft. Defer everything live (presence/push) and everything aspirational (maps/parsing).

### Phase 0 — Unblock (before any code)
- Restore the V17 traveling-artist mockup into the working tree (or repoint the spec at OLD-icloud). **Without this the build can't reference the design.**
- Resolve the §8 decisions, especially the **enrollment/roster source** (D2) and the **Sheet schema** (D1) — these gate everything.

### Phase 1 — The Field Document (read-only) · *this is the existing Slice-1 spec*
**Ships:** Today/Home + full Itinerary, reading **live** program/itinerary data, installable + offline-precached; in-program auth gate; ops modules + capture spark as **non-interactive stubs.**
**Builds:** D1 (program store + loader) · D2 (enrollment gate, read-only) · D3 (PWA foundation, precache only).
**Why first:** lowest-risk, highest-leverage — proves the data model, gives artists the one thing they need with no signal ("what is today?"), and **activates `mergeProgramIntoCard` for the already-built Journey Card V1** (closes that audit's §6 gap). No writes, no media, no presence.
**Effort:** M–L. **This is the only phase with an approved spec.**

### Phase 2 — Private Capture → Trace → Draft → Publish (the spine, end to end)
**Ships:** Quick Capture (text-first invitations: Field Note, Quote, Prompt, Private Reflection, + **Image** via the existing upload path) → My Traces (with the *real* per-trace visibility editor) → Composer (real inputs + autosave) → Review & Publish writing a real `JourneyCardRow`. Retroactive can ride along here (it's the most build-ready surface and reuses the publish write).
**Builds:** D4 (offline draft queue) · D5 *image slice* (wrap existing upload for offline) · D8 (serialization + publish write) · unified Trace/Entry model (§4).
**Why second:** this is "THE FIELD writes, the platform publishes" actually working — the core value, and self-contained (no live infra). **Defer audio** (ambient/voice) to a sub-phase; it's the heaviest part of D5.
**Effort:** L.

### Phase 3 — The Company & Field Library
**Ships:** Cohort roster (trip + post-trip, witness cross-links resolved at publish time), Field Library with per-resource offline download.
**Builds:** D5 batch-download · cohort store · cross-link generation at publish.
**Why third:** valuable, mostly read/curation, no real-time. Cohort "presence/with-you-today" stays static (data-derived from day assignments, not live).
**Effort:** M.

### Phase 4 — Field Ops (store-and-forward) + Admin
**Ships:** Rally Point, Roll Call, Company Choice, Admin Field Ops — with **WhatsApp/SMS copy-paste as the delivery channel** (the mockup's own stated fallback) and offline-queued acks/votes that sync on reconnect. *Last-synced* status, not live.
**Builds:** D9 (field-ops stores) · D6 as **store-and-forward, not true real-time.**
**Why fourth:** operationally useful but the riskiest data ethos (the only metric-adjacent surfaces) and the first to need bidirectional sync. Shipping it copy-paste-first avoids D7.
**Effort:** L.

### Phase 5 — Aspirational / optimization (only if justified)
Web Push (D7, iOS-constrained), true real-time presence (D6), offline maps + ETA (D10), PDF/OCR itinerary ingestion (D11). Each is a project in itself; none is required for a complete, useful Companion.

**Smallest genuinely useful slice if you want *one* thing:** Phase 1 (itinerary + Today, offline) — and it pays for itself twice by lighting up the Journey Card's program merge.
**Smallest slice that delivers the *vision*:** Phase 1 + Phase 2 (capture → trace → publish).

---

## 8. Decisions I need from you before any build

1. **Mockup location:** restore `v17/traveling-artist/` into the working tree (gitignored), or keep building against the OLD-icloud copy? (Recommend restore — the spec and any future task assume it's there.)
2. **Enrollment / roster (D2) — the hardest gate.** What is the source of truth for "who is on PASSAGE Slovakia 2026," and how does a session map to in-program + role (artist vs staff)? There is **no roster store today.** A new Sheet tab? Reuse `programMap.artists`? This blocks every surface.
3. **Itinerary Sheet schema (D1).** One tab vs. `Program` + `Chapters` + `Days` (+ `Time Anchors`); how to serialize nested `times[]`/`prep[]`/`dayIds`. (The spec recommends separate tabs — confirm before creating, same as the Journey Cards tab was.)
4. **The handoff serialization (§5).** Multi-chapter Companion record → flat `JourneyCardRow`: do we (a) define a flatten step (one body, one hero, one quote), or (b) extend `JourneyCardRow`/the card to carry chapters? This determines whether the "passport with blank-chapter placeholders" survives.
5. **Capture model unification (§4).** One Trace entity with `dayId`/`chapterId` + media ref + sync status? And which visibility model — the 4-level ladder (private/crew/review/public) or binary card/sealed?
6. **No-metrics line.** Soften or staff-gate the artist-facing count badges (Today's roll-call/vote counts, Admin's vote bars / "not yet answered" lists)? Or accept them as operational?
7. **Field-ops delivery (D7).** Confirm WhatsApp/SMS copy-paste is the V1 channel (no web push) — this de-risks the single most platform-constrained dependency and makes Phase 4 buildable.
8. **Real-time stance (D6).** Accept "last-synced, store-and-forward" for Roll Call / Rally / presence (consistent with offline-first), rather than true live? (Recommend yes — true real-time conflicts with the offline-first promise and the current architecture.)
9. **Audio scope (D5).** Is ambient-sound + voice-note capture in V1, or deferred? It's the heaviest media lift (recording, live waveform, storage, playback) and only one of seven capture doors is even designed for it.
10. **PWA library (D3).** Serwist vs `@ducanh2912/next-pwa` vs hand-rolled Workbox, on Next.js 16 App Router.
11. **Scope of *this* engagement:** (a) just Phase 1, (b) Phase 1 + design the missing states/data model for Phase 2, or (c) a deeper correctness/visual review of specific surfaces against intent?

---

*Mockups audited (in `…/dat-alumni.OLD-icloud/app/journey-card-mockup/`): v17/traveling-artist/{shell, itinerary, rally-point, roll-call, capture, traces, composer, resources, cohort, admin, pipeline, publish, retroactive, TravelingArtistOverview, TravelingArtistChrome, parts, sampleProgram} and v15/{V15Overview, field-kit, capture, studio, itinerary-system, data}. Production files checked: lib/journeyCard.ts, lib/loadJourneyCards.ts, lib/programMap.ts, lib/dramaClubMap.ts, auth.ts, lib/ownership.ts, app/api/upload, app/api/media, .gitignore.*
