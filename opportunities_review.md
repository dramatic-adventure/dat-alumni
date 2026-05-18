# Opportunities Seed — Repo Findings & Review

_Updated 2026-05-18 (v2). Reflects Season 20 cleanup: 48 records, 5 new listings,
8 substantially revised records. Read before touching the Sheet or publishing anything._

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
| `hub` | Slovakia/Central Europe roles use `brno` | Only Central Europe hub in enum. Consider adding `bratislava` or `slovakia` if PASSAGE becomes a recurring hub. |
| `hub` | All remote/distributed roles use `remote` | Local Project Producer is `remote` since it's project-dependent. |
| `role_types` | `storyteller` used for playwrights, dramaturgs | `playwright` and `dramaturg` not in enum. Consider adding. |
| `role_types` | `designer` used for production roles alongside `arts_admin` | No `stage_manager` in enum. Consider adding. |
| `status` | ED and Development Lead → `open` | Actively accepting applications. |
| `status` | Managing Producer, Communications Lead, Participant/Donor Coordinator → `coming_soon` | Not yet actively hiring; change to `open` when ready. |
| `status` | All intern/apprentice rows → `coming_soon` | Change to `open` when applications are ready. |
| `status` | Artist general-roster rows → `evergreen` | Rolling; UI renders "Rolling Basis". |
| `status` | Slovakia 2026 roles (PASSAGE artist, local producer) → `open` | Urgent; project is July 12–August 2. |
| `featured` | 9 roles featured (see below) | Adjust based on layout capacity and current priorities. |
| `season` | Job roles → `2026–2027` or `Season 21`; Artist roster/volunteer → blank | Blank season = evergreen/not season-specific. |
| `deadline` | PASSAGE Slovakia artist: `2026-06-15` | Tentative — confirm with Jesse. Project runs July 12–Aug 2. |
| `deadline` | Slovakia 2026 Local Producer: `2026-05-31` | Urgent hire; adjust if needed. |
| `compensation` | All stipend amounts left as TBD | See decisions section below. |

---

## 4. Featured Roles (9)

These 9 roles have `featured: TRUE`:

1. `executive-director` — job / remote
2. `development-partnerships-lead` — job / remote
3. `managing-producer` — job / remote
4. `communications-story-lead` — job / remote
5. `local-project-producer` — job / remote
6. `slovakia-2026-local-producer` — job / brno *(NEW — urgent)*
7. `passage-slovakia-2026-artist` — participant / brno *(NEW)*
8. `teaching-artist` — artist / remote
9. *(traveling-ensemble-artist demoted to non-featured; it is now evergreen roster)*

Consider whether 9 featured is the right count for your layout. The Slovakia 2026 roles are both urgent and time-sensitive — they earn their feature. Once the Slovakia project wraps (August 2026), demote both to `closed`.

---

## 5. PASSAGE: Slovakia 2026 — Two Listings Explained

The previous seed had a single `traveling-ensemble-artist` record that conflated two distinct things. They are now separated:

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

---

## 6. Decisions Jesse Should Make Before Publishing

**Compensation (most urgent)**
- [ ] Set salary range for Executive Director (currently "range shared with qualified applicants")
- [ ] Set salary/contract range for Development & Partnerships Lead, Managing Producer, Communications & Story Lead
- [ ] Set hourly/retainer rate for Bookkeeper and Participant & Donor Coordinator
- [ ] Set internship stipend amounts (currently "TBD")
- [ ] Set apprenticeship stipend amounts (currently "TBD")
- [ ] Set artist fee ranges for project-based artist roles (or leave as "confirmed upon engagement")
- [ ] Set PASSAGE Slovakia participation fee amount (currently "amount shared with accepted applicants")
- [ ] Set contract fee for Slovakia 2026 Local Producer and Drama Club Teaching Artist Lead

**Status / Timing (urgent for Slovakia)**
- [ ] Confirm application deadline for PASSAGE Slovakia 2026 artist (currently June 15, 2026)
- [ ] Confirm deadline for Slovakia 2026 Local Producer (currently May 31, 2026 — very soon)
- [ ] Confirm which job roles are actively accepting applications now vs. coming soon
- [ ] When do internship/apprenticeship applications open? Update `status` from `coming_soon` to `open` and set `deadline` when ready.

**apply_url**
- All apply URLs are set as `/apply?opp=[id]`. Confirm this matches the universal /apply form routing, or update to external links (Airtable, JotForm, etc.).

**hero_image**
- All new rows have blank `hero_image`. Existing images in `/public/images/opportunities/`: `PLX-hero.jpg`, `admin-collab.jpg`, `team-adventure.jpg`, `teaching-one-story-at-a-time.jpg`, `volunteer-popup.jpg`, `artist-development.jpg`, `collaboration-joy.jpg`. Assign to appropriate rows.

**Drama Club Teaching Artist Lead type**
- Currently listed as `type: job`. If you prefer it shown as an artist roster role rather than a staff hire, change to `type: artist`. The current framing (project-based paid contract, skill-based) makes `job` the better fit, but it's a judgment call.

**Hub enum expansion**
- Consider adding `bratislava` or `slovakia` to `OPPORTUNITY_HUBS` in `lib/opportunities.ts` if PASSAGE becomes a recurring hub.

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

## 7. File Locations & What Each File Is For

| File | Purpose |
|---|---|
| `opportunities_seed_records.json` | **Clean source of truth.** Edit this; regenerate others from it. Drop into `data/opportunities.json` for immediate preview. |
| `opportunities_sheet_import.csv` | **Sheet-ready import.** Properly quoted CSV with real in-cell newlines. Use File → Import in Google Sheets. Regenerate with `python3 generate_sheet_import.py`. |
| `opportunities_seed_rows.tsv` | Human-readable TSV reference. Requires semicolon/pipe → newline conversion before use in Sheets (see Option B above). Also regenerated by `generate_sheet_import.py`. |
| `generate_sheet_import.py` | Script to regenerate both CSV and TSV from the JSON. Run after any JSON edits. |
| `opportunities_transform.py` | One-time transformation script (Season 20 cleanup). Keep for reference; idempotent to re-run. |
| `opportunities_review.md` | This document. |

---

## 8. Change Log (v2 — 2026-05-18)

**Modified records (8):**
- `executive-director` — fixed "fifteen years" → 20th season language; removed "Full benefits package", "Annual international travel", "Quarterly team gatherings" overpromises
- `communications-story-lead` — fixed "fifteen years" → twenty seasons; status `open` → `coming_soon`; removed "Annual international expedition travel" overpromise
- `managing-producer` — status `open` → `coming_soon`; removed "Annual international expedition travel" overpromise
- `development-partnerships-lead` — removed "Annual international travel to a DAT expedition" overpromise
- `participant-donor-coordinator` — status `open` → `coming_soon`
- `local-project-producer` — fixed "Season 19" → Season 21 language; fixed Slovakia timeline (was Aug–Nov, now July–August 2026)
- `traveling-ensemble-artist` — converted to evergreen roster, stripped inaccurate PASSAGE Slovakia 2026 details (wrong dates, cities, fee model); `is_paid` corrected, `status` → `evergreen`, featured → FALSE
- `community-partner-liaison` — tightened copy so volunteer does not appear to own partnerships, official introductions, or institutional decisions

**New records (5):**
- `passage-slovakia-2026-artist` — PASSAGE: Slovakia 2026 participant listing (July 12–Aug 2; participation fee model; open)
- `slovakia-2026-local-producer` — urgent ground coordinator for PASSAGE Slovakia (open; deadline May 31)
- `board-committee-member` — volunteer governance committee role (evergreen)
- `host-committee-member` — volunteer event/campaign host role (evergreen)
- `drama-club-teaching-artist-lead` — paid TA lead for Drama Club hubs (coming_soon)

**Total: 43 → 48 records**

---

_No production code was changed. No commits were made. No Sheet writes were performed._
