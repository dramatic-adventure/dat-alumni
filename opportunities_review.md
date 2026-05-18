# Opportunities Seed — Repo Findings & Review

_Generated 2026-05-18. Read before touching the Sheet or publishing anything._

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

**Important:** The TSV file (`opportunities_seed_rows.tsv`) uses **semicolons** to separate list items and **` | `** (pipe) to separate timeline/faq entries, for readability when pasting into Sheets. Before these cells are live and functional, you must convert the separators:
- `; ` → newline in `what_youll_do`, `who_you_are`, `requirements`, `perks`
- ` | ` → newline in `timeline` and `faq`

The **JSON file** (`opportunities_seed_records.json`) uses proper arrays throughout — if you import from JSON directly (into `data/opportunities.json` or a future import script), no conversion is needed.

### Routing

No `/app/opportunities` route directory exists yet in the repo — the route is built elsewhere (likely a page file, not a directory). The schema and loader are fully in place; the page exists in the running app. This was not inspected further per guardrails (no redesign, stay surgical).

### Sort order

`sortOpportunities()` sorts: **featured first**, then by type bucket (`plx → artist → audition → arts_admin → job → participant → volunteer`), then by the `order` field, then by `deadline`. The `order` values in the seed rows are set within each type group (1–n per group) to give you fine-grained control.

---

## 2. Can Claude Write Directly to the Google Sheet?

**No. Not now. Do not proceed without explicit confirmation.**

The repo has **read-only** Sheets access for opportunities — `lib/loadOpportunities.ts` uses `spreadsheets.values.get` only. There is no write-enabled path for the Opportunities tab. Write-enabled routes exist in the codebase (alumni update, story map, admin seed-slugs, etc.) but none for opportunities.

**The safe import path is manual:**

1. Open the Google Sheet (`ALUMNI_SHEET_ID`).
2. Create a new tab named exactly **`Opportunities`** (case-sensitive — the loader expects this exact name).
3. Paste the header row first, then paste the data rows from `opportunities_seed_rows.tsv`.
4. In the list-field columns (`what_youll_do`, `who_you_are`, `requirements`, `perks`, `timeline`, `faq`), replace semicolons (`;`) / pipes (`|`) with actual newlines inside each cell using Find & Replace → Regex → `; ` → `\n` (Google Sheets supports this with "Regular expression" checked in Find & Replace).
5. Verify the `status` column — most new rows are `coming_soon` or `evergreen`. Change any to `open` when ready to publish.

**Alternatively**, replace `data/opportunities.json` with `opportunities_seed_records.json` to serve the new rows from the static fallback immediately, with no Sheet edit required. This is the fastest path to preview.

---

## 3. Enum / Value Assumptions

These controlled-vocabulary assumptions were made. Confirm any that feel wrong before publishing.

| Field | Assumption | Note |
|---|---|---|
| `type` | Internship/Apprenticeship rows use `plx` | Matches existing PLX season rows. Differentiator is `plx_program`. |
| `type` | Core paid/contract roles use `job` | Displays as "Arts Admin / On the Team" in the UI. |
| `type` | Artist general-roster roles use `artist` | Evergreen open calls. |
| `type` | Local Artist / Cultural Collaborator uses `participant` | Reflects community co-creator framing, not staff. |
| `hub` | Slovakia/Central Europe roles use `brno` | The only Central Europe hub in the enum. Worth adding `bratislava` or `slovakia` if PASSAGE becomes a major recurring hub. |
| `hub` | All remote/distributed roles use `remote` | Local Project Producer is listed as `remote` since it's project-dependent; Jesse should update to the specific hub once a project is confirmed. |
| `role_types` | `storyteller` used for playwrights, dramaturgs, research interns | Closest available value; `playwright` and `dramaturg` don't exist in the enum. Consider adding them. |
| `role_types` | `designer` used for stage managers and production apprentices alongside `arts_admin` | No `stage_manager` value in enum. Consider adding. |
| `status` | All new job roles → `open` | Change to `coming_soon` if not actively accepting applications. |
| `status` | All new intern/apprentice rows → `coming_soon` | Change to `open` when applications are ready. |
| `status` | All artist general-roster rows → `evergreen` | These are rolling; the UI renders "Rolling Basis". |
| `featured` | 7 roles featured (see below) | Adjust based on layout capacity and current priorities. |
| `season` | Job roles → `2026–2027`; Artist roster/volunteer → blank | Blank season = evergreen/not season-specific. |
| `deadline` | Only Traveling Ensemble Artist has a specific date (`2026-08-15`) | All others blank or rolling. |
| `compensation` | All stipend amounts left as TBD | See decisions section below. |

---

## 4. Featured Roles (7)

These 7 roles have `featured: TRUE`:

1. `executive-director` — job / remote
2. `development-partnerships-lead` — job / remote
3. `managing-producer` — job / remote
4. `communications-story-lead` — job / remote
5. `local-project-producer` — job / remote
6. `traveling-ensemble-artist` — artist / brno
7. `teaching-artist` — artist / remote

The `bookkeeper-finance-admin` and `participant-donor-coordinator` roles are **not featured** — they're support roles rather than strategic hires. Promote either if hiring urgency changes.

---

## 5. Decisions Jesse Should Make Before Publishing

**Compensation (most urgent)**
- [ ] Set salary range for Executive Director (currently "commensurate with experience" — are you ready to share a range with applicants?)
- [ ] Set salary/contract range for Development & Partnerships Lead, Managing Producer, Communications & Story Lead
- [ ] Set hourly/retainer rate for Bookkeeper and Participant & Donor Coordinator
- [ ] Set internship stipend amounts (e.g., $1,000–$1,500 for 12 weeks? Currently "TBD")
- [ ] Set apprenticeship stipend amounts (e.g., $5,000–$8,400 for 10 months? Currently "TBD")
- [ ] Set artist fee ranges for project-based artist roles (or leave as "confirmed upon engagement")

**Status / Timing**
- [ ] Which job roles are actively accepting applications now vs. coming soon?
- [ ] When do internship/apprenticeship applications open? Update `status` from `coming_soon` to `open` and set `deadline` when ready.
- [ ] Slovakia 2026 ensemble deadline: `2026-08-15` was assumed — confirm this date.

**apply_url**
- All apply URLs are set as `/apply?opp=[id]`. Confirm this matches the universal /apply form routing, or update to external links (Airtable, JotForm, etc.).

**hero_image**
- All new rows have blank `hero_image`. DAT has existing images in `/public/images/opportunities/` (PLX-hero.jpg, admin-collab.jpg, team-adventure.jpg, teaching-one-story-at-a-time.jpg, volunteer-popup.jpg, artist-development.jpg, collaboration-joy.jpg). Assign these to appropriate rows.

**Hub enum expansion**
- Consider adding `bratislava` or `slovakia` to `OPPORTUNITY_HUBS` in `lib/opportunities.ts` if PASSAGE becomes a recurring hub. Currently all Slovakia-based roles map to `brno`.
- Similarly consider `quito` for Ecuador roles (already in enum) and confirm it covers Guayaquil/other Ecuador hubs.

**role_types enum gaps**
- `playwright`, `dramaturg`, `stage_manager`, `musician`, `movement_director`, `visual_artist` don't exist in `OPPORTUNITY_ROLE_TYPES`. Affected rows fall back to closest available values. If the filter bar will ever offer these as filter options, add them to the enum in `lib/opportunities.ts` (and add labels in `OPPORTUNITY_ROLE_LABELS`).

**Executive Director posting**
- Review the long_description and what_youll_do carefully — this is a sensitive leadership transition. The copy is warm and strategic but says nothing about Mary's transition. Confirm you're comfortable with the framing.

**learn_more_url**
- Intern rows link to `/internships` and apprentice rows link to `/apprenticeships`. Confirm these pages exist or will exist before going live.

**contact_email**
- Job roles → `jobs@dramaticadventure.com`
- Artist/casting roles → `casting@dramaticadventure.com`
- Volunteer/general roles → `info@dramaticadventure.com`
- Event volunteer → `events@dramaticadventure.com`
- Confirm these inboxes are active and monitored.

---

## 6. File Locations

| File | Location | Purpose |
|---|---|---|
| `opportunities_seed_rows.tsv` | `/Users/jessebaxter/Documents/dat-alumni/opportunities_seed_rows.tsv` | Copy-paste into Google Sheet "Opportunities" tab |
| `opportunities_seed_records.json` | `/Users/jessebaxter/Documents/dat-alumni/opportunities_seed_records.json` | Drop-in replacement for `data/opportunities.json` for immediate local preview |
| `opportunities_review.md` | `/Users/jessebaxter/Documents/dat-alumni/opportunities_review.md` | This document |

**To preview immediately without touching the Sheet:**
```bash
cp data/opportunities.json data/opportunities.json.bak
cp opportunities_seed_records.json data/opportunities.json
npm run dev
```
The site will serve all 43 new rows from the static fallback. Restore with `cp data/opportunities.json.bak data/opportunities.json` when done reviewing.

---

_No code was changed. No commits were made. No Sheet writes were performed._
