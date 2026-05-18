# Opportunities Seed — Repo Findings & Review

_Updated 2026-05-18 (v4). Reflects Season 20 / Ecuador hub strategy pass: 52 records (up from 48),
4 new Ecuador/Quito listings, compensation/incentive framing overhaul, travel language corrected,
timeline labels fixed on `coming_soon` records. v4: `data/opportunities.json` is now an
evergreen-only fallback (25 records). Read before touching the Sheet or publishing anything._

---

## 1. How /opportunities Is Built

### Data source

Opportunities are read from a dedicated **"Opportunities" tab** in the same Google Spreadsheet used for alumni data (`ALUMNI_SHEET_ID`). The server-only loader (`lib/loadOpportunities.ts`) calls the Sheets API using the existing service-account credentials, then falls back to **`data/opportunities.json`** if the API call fails or the tab doesn't exist yet.

This means:
- The Sheet is the live source of truth.
- `data/opportunities.json` is a **static fallback/seed** — the site never breaks even if the Sheet is unreachable.
- To add/edit opportunities _without_ touching the Sheet, edit `data/opportunities.json` directly.

### Parser & schema

`lib/opportunities.ts` defines the full schema: 27 columns, exact order `A:AA`. The parser (`csvRowsToSeed` + `normalize`) is tolerant — unknown enum values fall back to safe defaults rather than crashing.

**Key parsing rules for rich-content columns:**

| Column | In-Sheet encoding | Parser splits on |
|---|---|---|
| `what_youll_do` | One item per line | `\n` |
| `who_you_are` | One item per line | `\n` |
| `requirements` | One item per line | `\n` |
| `perks` | One item per line | `\n` |
| `timeline` | `Label :: Detail` per line | `\n`, then `::` |
| `faq` | `Q :: A` per line | `\n`, then `::` |
| `long_description` | Free-text paragraphs | Rendered as-is |

### Routing

The repo **does** have an `/app/opportunities` route directory:
- `app/opportunities/page.tsx` — listing page
- `app/opportunities/[id]/page.tsx` — detail page
- `app/opportunities/[id]/OpportunityDetailClient.tsx` — client component

The route is fully in place and operational. The schema and loader are also in place.

### Sort order

`sortOpportunities()` sorts: **featured first**, then by type bucket (`plx → artist → audition → arts_admin → job → participant → volunteer`), then by the `order` field, then by `deadline`. The `order` values in the seed rows are set within each type group (1–n per group) to give fine-grained control.

---

## 2. Can Claude Write Directly to the Google Sheet?

**No. Not now. Do not proceed without explicit confirmation.**

The repo has **read-only** Sheets access for opportunities — `lib/loadOpportunities.ts` uses `spreadsheets.values.get` only. There is no write-enabled path for the Opportunities tab.

**The safe import path is:**

### Option A — CSV (Recommended, handles multiline cells automatically)

1. Open the Google Sheet (`ALUMNI_SHEET_ID`).
2. Create a new tab named exactly **`Opportunities`** (case-sensitive).
3. File → Import → Upload → **`opportunities_sheet_import.csv`**
4. Select **"Replace current sheet"** and **"Detect automatically"** for separator.
5. Done — all list fields will have real in-cell newlines. No manual conversion needed.

> Run `python3 generate_sheet_import.py` any time to regenerate `opportunities_sheet_import.csv`
> from `opportunities_seed_records.json`.

### Option B — TSV with manual Find & Replace

1. Open the Google Sheet and create/select the **`Opportunities`** tab.
2. Paste the header row first, then paste the data rows from `opportunities_seed_rows.tsv`.
3. In the list-field columns, replace separators with actual newlines using Find & Replace → "Regular expression":
   - In `what_youll_do`, `who_you_are`, `requirements`, `perks`: replace `; ` → `\n`
   - In `timeline` and `faq`: replace ` \| ` → `\n`
4. Verify the `status` column — change any rows from `coming_soon` to `open` when ready.

**Option A is simpler.** Use Option B only if you have a specific reason to prefer TSV paste.

### Option C — Static fallback (fastest local preview)

Replace `data/opportunities.json` with `opportunities_seed_records.json` to serve the new rows immediately from the static fallback, with no Sheet edit required.

```bash
cp data/opportunities.json data/opportunities.json.bak
cp opportunities_seed_records.json data/opportunities.json
npm run dev
```

Restore with `cp data/opportunities.json.bak data/opportunities.json` when done reviewing.

---

## 3. Enum / Value Assumptions

| Field | Assumption | Note |
|---|---|---|
| `type` | Internship/Apprenticeship rows use `plx` | Matches existing PLX rows. Differentiator is `plx_program`. |
| `type` | Core paid/contract roles use `job` | Displays as "Arts Admin / On the Team" in the UI. |
| `type` | Artist general-roster roles use `artist` | Evergreen open calls. |
| `type` | Local Artist / Cultural Collaborator uses `participant` | Reflects community co-creator framing. |
| `type` | PASSAGE: Slovakia 2026 uses `participant` | Participation-fee model; displays as "Artist / Join the Work". |
| `hub` | All 4 Ecuador roles use `quito` | `quito` is a valid hub enum value. ✓ |
| `hub` | Slovakia/Central Europe roles use `brno` | Only Central Europe hub in enum. See Slovakia hub note below. |
| `hub` | All remote/distributed roles use `remote` | Local Project Producer is `remote` since it's project-dependent. |
| `role_types` | `storyteller` used for playwrights, dramaturgs | `playwright` and `dramaturg` not in enum. Consider adding. |
| `role_types` | `designer` used for production roles alongside `arts_admin` | No `stage_manager` in enum. Consider adding. |
| `status` | ED and Development Lead → `open` | Actively accepting applications. |
| `status` | Managing Producer, Communications Lead, Participant/Donor Coordinator → `coming_soon` | Not yet actively hiring; change to `open` when ready. |
| `status` | All intern/apprentice rows → `coming_soon` | Change to `open` when applications are ready. |
| `status` | Artist general-roster rows → `evergreen` | Rolling; UI renders "Rolling Basis". |
| `status` | Slovakia 2026 roles (PASSAGE artist, local producer) → `open` | Urgent; project is July 12–August 2. |
| `featured` | 10 roles featured (see below) | Adjust based on layout capacity and current priorities. |
| `season` | Job roles → `2026–2027` or `Season 21`; Artist roster/volunteer → blank | Blank season = evergreen/not season-specific. |
| `deadline` | PASSAGE Slovakia artist: `2026-06-15` | Tentative — confirm with Jesse. Project runs July 12–Aug 2. |
| `deadline` | Slovakia 2026 Local Producer: `2026-05-31` | Urgent hire; adjust if needed. |
| `compensation` | All stipend amounts left as TBD | See decisions section below. |
| `compensation` | Ecuador roles → phased contract/stipend/fellowship language | Honest about early-stage capacity; phased growth framed as real. |

---

## 4. Featured Roles (10)

These 10 roles have `featured: TRUE`:

1. `executive-director` — job / remote
2. `development-partnerships-lead` — job / remote
3. `managing-producer` — job / remote
4. `communications-story-lead` — job / remote
5. `local-project-producer` — job / remote
6. `slovakia-2026-local-producer` — job / brno *(urgent)*
7. `passage-slovakia-2026-artist` — participant / brno
8. `teaching-artist` — artist / remote
9. `ecuador-development-partnerships-lead` — job / quito *(NEW)*
10. `ecuador-program-partnerships-coordinator` — job / quito *(NEW)*

Consider whether 10 featured is the right count for your layout. Once the Slovakia project wraps (August 2026), demote both Slovakia roles to `closed`. The two Ecuador featured roles signal the hub-building strategy prominently.

---

## 5. PASSAGE: Slovakia 2026 — Two Listings Explained

| Record | ID | What it is | Fee model | Status |
|---|---|---|---|---|
| Traveling Ensemble Artist Roster | `traveling-ensemble-artist` | Evergreen artist bench for future paid ensemble projects | Paid when placed | evergreen |
| PASSAGE: Slovakia 2026 — Traveling Artist | `passage-slovakia-2026-artist` | Specific July 12–Aug 2 project; participation fee model | Artist participation fee (not paid) | open |

Key PASSAGE Slovakia facts in the record:
- Dates: July 12–August 2, 2026
- Cities: Bratislava, Košice, Zemplínska Teplica, Slovenský Raj
- Final shared performance: August 1, Košice
- Not a paid engagement — participation fee model, like an international residency
- Application deadline tentatively set at June 15, 2026 — **confirm before publishing**

### Slovakia hub limitation

The `hub` enum in `lib/opportunities.ts` does not include `slovakia` or `bratislava`. Both Slovakia records (`slovakia-2026-local-producer` and `passage-slovakia-2026-artist`) currently use `hub: brno` — the only Central Europe value in the enum — which means they may display as "Brno / Czechia" in any UI that renders hub metadata directly.

**Recommendation:** Create a small, isolated code task to add `slovakia` to `OPPORTUNITY_HUBS` and a `HUB_META` entry in `lib/opportunities.ts` before public launch. This is a safe, two-line enum expansion that does not require data migration. Do not block publishing on this — the record content is correct; only the display label may be slightly off.

---

## 6. Ecuador Hub Strategy — What Was Added

Four new records target DAT's Ecuador/Quito hub-building strategy:

| Record | ID | Hub | Status | Featured |
|---|---|---|---|---|
| Ecuador-Based Development & Partnerships Lead | `ecuador-development-partnerships-lead` | quito | coming_soon | TRUE |
| Ecuador Program & Partnerships Coordinator | `ecuador-program-partnerships-coordinator` | quito | coming_soon | TRUE |
| Ecuador Local Producer / Ground Coordinator | `ecuador-local-producer` | quito | evergreen | FALSE |
| Bilingual Communications & Story Coordinator — Ecuador | `ecuador-bilingual-story-coordinator` | quito | coming_soon | FALSE |

**Framing principles applied:**
- All four use `hub: quito` (valid enum value ✓).
- All four reference "DAT's Ecuador Founding Hub Team" — framing these as foundational builder roles.
- All four specify bilingual Spanish/English as strongly preferred or required.
- None use "cheap," "low-cost," "assistant," or language that frames Ecuador as a travel destination.
- Compensation is framed honestly as phased contract/stipend/fellowship/low-retainer with explicit growth path.
- Ecuador administrators are positioned as local leaders and hub-builders, not subordinate to US staff.

**Existing roles revised to include Ecuador pathway language:**
- `development-partnerships-lead` — Ecuador hub connection in long_description; bilingual note
- `local-project-producer` — Ecuador/Quito framing strengthened; bilingual note
- `participant-donor-coordinator` — Ecuador pathway note added; bilingual asset noted
- `communications-story-lead` — bilingual note added to who_you_are
- `drama-club-teaching-artist-lead` — Ecuador Teaching Artist framing strengthened
- `development-intern` — Ecuador note; bilingual asset noted
- `communications-storytelling-intern` — Ecuador content territory noted; bilingual encouraged
- `program-operations-intern` — Ecuador program coordination note
- `alumni-community-engagement-intern` — Ecuador community note
- `producing-apprentice` — Ecuador hub-building note
- `community-engagement-apprentice` — Ecuador community engagement note (with Quito mention)
- `documentation-apprentice` — Ecuador documentary material note

---

## 7. Compensation & Incentive Language — Changes Made

### Travel language (all roles)

All instances of:
- "International travel" (as a standalone perk)
- "International expedition travel"
- "International production experience"
- "Annual international travel"
- "Annual international expedition travel"

…have been replaced with conditional framing such as:

> "Field travel may be available when aligned with program needs and funding; travel is discussed before engagement and is not a substitute for agreed compensation."

The PASSAGE Slovakia FAQ retains the phrase "International travel to/from Slovakia is not included" — this is an honest clarification, not an overpromise, and is correct.

### ED FAQ fix

The Executive Director FAQ answer previously said "Quarterly in-person gatherings and annual international expedition travel." This has been replaced with conditional field-access language that is honest about expectations.

### coming_soon timeline labels

All `coming_soon` records previously had `"Applications Open"` as a timeline label, which was contradictory. These have been changed to:
- `"Expressions of Interest"` for job roles (with "write to jobs@dramaticadventure.com")
- `"Coming Soon"` for PLX intern/apprentice roles (with "express interest now")

### Non-cash incentives strengthened

All intern, apprentice, and stipend/volunteer roles now include more specific non-cash value:
- Explicit mentorship language (named roles where possible)
- Portfolio outputs described concretely
- Professional title and credits language
- Network access to DAT's global alumni and artistic community
- Priority consideration for future paid roles
- Letters of recommendation after successful completion
- Invitations to donor events, salons, convenings, and field briefings
- Field access / travel as conditional possibility (not guarantee)

### Stipend language

All "Stipend (amount TBD)" entries have been updated to "Stipend (amount confirmed before acceptance; target TBD based on funding)" — making clear that DAT commits to sharing the amount before a candidate accepts.

---

## 8. Decisions Jesse Should Make Before Publishing

**Compensation (most urgent)**
- [ ] Set salary range for Executive Director (currently "range shared with qualified applicants")
- [ ] Set salary/contract range for Development & Partnerships Lead, Managing Producer, Communications & Story Lead
- [ ] Set hourly/retainer rate for Bookkeeper and Participant & Donor Coordinator
- [ ] Set internship stipend amounts (currently "target TBD based on funding")
- [ ] Set apprenticeship stipend amounts (currently "target TBD based on funding")
- [ ] Set PASSAGE Slovakia participation fee amount (currently "amount shared with accepted applicants")
- [ ] Set contract fee for Slovakia 2026 Local Producer and Drama Club Teaching Artist Lead
- [ ] Set starting compensation range for Ecuador roles (currently "amount to be finalized based on scope, funding, and candidate location")

**Status / Timing (urgent for Slovakia)**
- [ ] Confirm application deadline for PASSAGE Slovakia 2026 artist (currently June 15, 2026)
- [ ] Confirm deadline for Slovakia 2026 Local Producer (currently May 31, 2026 — very soon)
- [ ] Confirm which job roles are actively accepting applications now vs. coming soon
- [ ] When do internship/apprenticeship applications open? Update `status` from `coming_soon` to `open` and set `deadline` when ready.

**Ecuador roles**
- [ ] Confirm whether `ecuador-development-partnerships-lead` and `ecuador-program-partnerships-coordinator` should both be `featured: TRUE`, or whether one should be demoted (currently 10 featured total — may be too many for the layout)
- [ ] Consider whether `ecuador-bilingual-story-coordinator` should be folded into one of the other Ecuador roles or kept separate
- [ ] Confirm that `ecuador-local-producer` (evergreen) is correct — it will always appear in the listing

**apply_url**
- All apply URLs are set as `/apply?opp=[id]`. Confirm this matches the universal /apply form routing, or update to external links (Airtable, JotForm, etc.).

**hero_image**
- All new rows have blank `hero_image`. Existing images in `/public/images/opportunities/`: `PLX-hero.jpg`, `admin-collab.jpg`, `team-adventure.jpg`, `teaching-one-story-at-a-time.jpg`, `volunteer-popup.jpg`, `artist-development.jpg`, `collaboration-joy.jpg`. Assign to appropriate rows — the Ecuador records in particular would benefit from Ecuador-specific images.

**Drama Club Teaching Artist Lead type**
- Currently listed as `type: job`. If you prefer it shown as an artist roster role rather than a staff hire, change to `type: artist`. The current framing (project-based paid contract, skill-based) makes `job` the better fit, but it's a judgment call.

**Slovakia hub enum**
- Add `slovakia` to `OPPORTUNITY_HUBS` and `HUB_META` in `lib/opportunities.ts` before public launch. Currently using `brno`. See section 5 above.

**role_types enum gaps**
- `playwright`, `dramaturg`, `stage_manager`, `musician`, `movement_director`, `visual_artist` don't exist in `OPPORTUNITY_ROLE_TYPES`. Affected rows fall back to closest available values.

**learn_more_url**
- Intern rows link to `/internships` and apprentice rows link to `/apprenticeships`. Confirm these pages exist before going live.

**contact_email**
- Job roles → `jobs@dramaticadventure.com`
- Artist/casting roles → `casting@dramaticadventure.com`
- Volunteer/general roles → `info@dramaticadventure.com`
- Confirm these inboxes are active and monitored.

---

## 9. Is the Data Safe to Preview?

**Yes.** To preview immediately:

```bash
cp data/opportunities.json data/opportunities.json.bak
cp opportunities_seed_records.json data/opportunities.json
npm run dev
```

The data is valid JSON, all 52 records pass schema validation, all enum values are legal, and no production code was changed. Restore with `cp data/opportunities.json.bak data/opportunities.json` when done.

---

## 10. File Locations & What Each File Is For

| File | Purpose |
|---|---|
| `opportunities_seed_records.json` | **Clean source of truth.** Edit this; regenerate others from it. Drop into `data/opportunities.json` for immediate preview. |
| `opportunities_sheet_import.csv` | **Sheet-ready import.** Properly quoted CSV with real in-cell newlines. Use File → Import in Google Sheets. Regenerate with `python3 generate_sheet_import.py`. |
| `opportunities_seed_rows.tsv` | Human-readable TSV reference. Requires semicolon/pipe → newline conversion before use in Sheets (see Option B above). Also regenerated by `generate_sheet_import.py`. |
| `generate_sheet_import.py` | Script to regenerate both CSV and TSV from the JSON. Run after any JSON edits. |
| `apply_opp_changes.py` | Transformation script used for the v3 pass (Ecuador + incentive framing). Keep for reference; idempotent if re-run on the original v2 JSON. |
| `opportunities_transform.py` | One-time transformation script (Season 20 cleanup). Keep for reference. |
| `opportunities_review.md` | This document. |

---

## 11. Change Log

### v3 — 2026-05-18 (Ecuador hub strategy + incentive framing pass)

**New records (4):**
- `ecuador-development-partnerships-lead` — Ecuador hub / Quito / coming_soon / featured
- `ecuador-program-partnerships-coordinator` — Ecuador hub / Quito / coming_soon / featured
- `ecuador-local-producer` — Ecuador hub / Quito / evergreen / not featured
- `ecuador-bilingual-story-coordinator` — Ecuador hub / Quito / coming_soon / not featured

**Modified records (26):**
- `executive-director` — fixed FAQ "annual international expedition travel" → conditional field access language
- `development-partnerships-lead` — added Ecuador pathway language to long_description and perks; strengthened non-cash perks
- `managing-producer` — fixed timeline "Applications Open" → "Expressions of Interest"
- `communications-story-lead` — fixed timeline; added bilingual Spanish/English note to who_you_are
- `local-project-producer` — strengthened Ecuador/Quito framing; added bilingual note for Ecuador engagements
- `participant-donor-coordinator` — fixed timeline; added Ecuador pathway note; strengthened perks
- `drama-club-teaching-artist-lead` — strengthened Ecuador framing; added "Ecuador Founding Hub Team" language
- `development-intern` — fixed timeline; added Ecuador note; strengthened non-cash perks; updated stipend language
- `communications-storytelling-intern` — fixed timeline; added Ecuador/bilingual note; strengthened perks
- `program-operations-intern` — fixed timeline; added Ecuador note; strengthened perks
- `alumni-community-engagement-intern` — fixed timeline; added Ecuador note; strengthened perks
- `digital-website-intern` — fixed timeline; added mentorship and priority consideration perks
- `production-intern` — fixed timeline; added mentorship and priority consideration perks
- `research-dramaturgy-intern` — fixed timeline; added mentorship and network access perks
- `producing-apprentice` — fixed timeline; replaced "International expedition travel" → conditional travel language; added Ecuador note; overhauled perks
- `teaching-artist-apprentice` — fixed timeline; overhauled perks with specific mentorship and conditional travel
- `community-engagement-apprentice` — fixed timeline; replaced "International travel" → conditional; added Ecuador/Quito note; overhauled perks
- `stage-management-production-apprentice` — fixed timeline; replaced "International production experience" → conditional; overhauled perks
- `documentation-apprentice` — fixed timeline; replaced "International travel" → conditional; added Ecuador note; overhauled perks
- `devising-ensemble-apprentice` — fixed timeline; replaced "International travel" → conditional; overhauled perks
- `dramaturgy-adaptation-apprentice` — fixed timeline; replaced "International travel" → conditional; overhauled perks
- `alumni-outreach-captain` — strengthened perks
- `story-collector` — strengthened perks
- `grant-research-volunteer` — strengthened perks
- `data-crm-volunteer` — strengthened perks
- `program-recruitment-ambassador` — strengthened perks
- `travel-logistics-research-volunteer` — strengthened perks
- `community-partner-liaison` — strengthened perks
- `board-committee-member` — strengthened perks
- `host-committee-member` — strengthened perks
- `documentation-artist` — replaced bare "International travel" perk → conditional in-field logistics language

**Total: 48 → 52 records**

### v2 — 2026-05-18 (Season 20 cleanup)

**Modified records (8):**
- `executive-director`, `communications-story-lead`, `managing-producer`, `development-partnerships-lead`, `participant-donor-coordinator`, `local-project-producer`, `traveling-ensemble-artist`, `community-partner-liaison`

**New records (5):**
- `passage-slovakia-2026-artist`, `slovakia-2026-local-producer`, `board-committee-member`, `host-committee-member`, `drama-club-teaching-artist-lead`

**Total: 43 → 48 records**

---

_No production code was changed. No commits were made. No Sheet writes were performed._

---

## 12. Fallback Strategy — `data/opportunities.json` is Evergreen-Only (v4)

### What changed

As of v4 (2026-05-18), **`data/opportunities.json` is no longer a full mirror of `opportunities_seed_records.json`**. It contains only the 25 records whose `status` is `"evergreen"` — roles with no deadline, no season dependency, and no time-sensitive copy that would become misleading if the Google Sheet is unreachable for days or weeks.

### Why

The live Google Sheet ("Opportunities" tab, `ALUMNI_SHEET_ID`) is the source of truth for all 52 records. The fallback file is only shown when the Sheets API call in `lib/loadOpportunities.ts` fails. A full copy of the Sheet in the fallback would quickly fall out of date — stale deadlines, closed roles still showing as open, completed projects still recruiting.

The evergreen-only fallback is always safe to display because evergreen roles are rolling, have no expiry, and carry no specific deadline or season.

### What is in the fallback (25 records)

| Category | IDs |
|---|---|
| Artist roster | `traveling-ensemble-artist`, `actor-devising-performer`, `director-facilitator`, `playwright-adaptor`, `dramaturg-researcher`, `teaching-artist`, `local-artist-cultural-collaborator`, `designer`, `stage-manager`, `musician-composer-sound-artist`, `movement-director-choreographer`, `visual-artist-maker`, `documentation-artist` |
| Volunteer | `fundraising-ambassador`, `alumni-outreach-captain`, `story-collector`, `event-volunteer`, `grant-research-volunteer`, `data-crm-volunteer`, `program-recruitment-ambassador`, `travel-logistics-research-volunteer`, `community-partner-liaison` |
| Governance | `board-committee-member`, `host-committee-member` |
| Ecuador | `ecuador-local-producer` |

### What is intentionally excluded from the fallback

- All `coming_soon` records (13 PLX interns/apprentices, Ecuador admin roles, Managing Producer, Communications Lead, etc.)
- All `open` staff searches (`executive-director`, `development-partnerships-lead`, `bookkeeper-finance-admin`, `local-project-producer`, `participant-donor-coordinator`)
- `passage-slovakia-2026-artist` and `slovakia-2026-local-producer` — time-sensitive / project-specific
- `drama-club-teaching-artist-lead` — project-specific / coming_soon
- All Ecuador admin roles except `ecuador-local-producer` (the others are `coming_soon`)

### How to regenerate the fallback

If evergreen records change in `opportunities_seed_records.json`, re-run:

```bash
python3 -c "
import json
with open('opportunities_seed_records.json') as f:
    seed = json.load(f)
evergreen = [r for r in seed if r.get('status') == 'evergreen']
with open('data/opportunities.json', 'w') as out:
    json.dump(evergreen, out, indent=2, ensure_ascii=False)
    out.write('\n')
print(f'Written {len(evergreen)} evergreen records.')
"
```

Do **not** use `cp opportunities_seed_records.json data/opportunities.json` — that would restore the full 52-record set including time-sensitive listings.

