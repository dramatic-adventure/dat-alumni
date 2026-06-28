# PLX Restructure — Decisions & Context (for Claude Code)

Read this before running any phase of the PLX restructure. It's the source of truth;
if a phase prompt is ambiguous or conflicts, defer to this file.
Working rules for every phase: make **surgical, local edits**, don't refactor unrelated
code, run `npm run check` (typecheck + lint) before finishing, and report files changed
+ a suggested commit. (Note: the `dat-app-guardrails` skill is Cowork-side and may not be
installed in Claude Code — these rules are restated here so they apply regardless.)

---

## Goal & guardrails
- **Why:** enable for-credit, fee-based student participation in DAT programs, and make
  involvement legible to universities and serious student artists.
- **Audience priorities (internal only):** Stevenson (#1), John Jay, NYU; artists from
  Carnegie Mellon + NYU. **NEVER name any institution anywhere on the site** — no formal
  partnerships exist yet.
- **Keep opportunity row `id`s and apply keys stable** (e.g. `development-intern`). Slug
  changes only with middleware redirects.
- **Data flow:** the Google Sheet ("Opportunities" tab) is the source of truth for
  opportunity rows; page copy lives in code. `data/opportunities.json` is an
  **evergreen-only** fallback (no PLX rows — leave it). The clean seed is
  `opportunities_seed_records.json`; regenerate Sheet import files via
  `python3 generate_sheet_import.py`.

## Core model
- **Programs** (PASSAGE, ACTion, RAW…) **× Pathways** (paid / fee-based / credit-earning /
  volunteer). Every pathway appears on the program page **and** in the opportunities portal.
- Fee-based pathways must speak to **both** students (academic credit) **and** emerging
  artists (portfolio, production credit, training, network).
- **"Take, not make":** present defined positions people apply into — never DIY projects.

## PLX family — the ladder (commitment ascending)
| Program | Length / commitment | Funding | Route | plxProgram | Role |
|---|---|---|---|---|---|
| **Project-Based Internship** | a few weeks, one production/expedition | **fee-based + credit** | `/project-based-internships` | `internship` | Intern |
| **Global Apprenticeship** | 12 wk, ~$1,800, 10 hr/wk (intro) | paid | `/apprenticeships` | `apprenticeship` | Apprentice |
| **Global Fellowship** | 10 mo, ~$8,400, 20 hr/wk (leadership) | paid | `/fellowships` | `fellowship` | Fellow |

- Ladder reads **Intern → Apprentice → Fellow** (ascending prestige/commitment).
- Framing for the funding flip: the short rung is an **immersive experience you invest in**;
  the longer rungs are **real work for DAT, so DAT invests in you.**

## Terminology
- **"Fellow" = a Global Fellowship participant/graduate.** The old "loose Associate Artist"
  meaning is retired.
- Participants: Project-Based Internship → **Interns**; Apprenticeship → **Apprentices**;
  Fellowship → **Fellows**.

## /roles taxonomy
- Roles, in display order: Founding Members, Board of Directors, Staff, Resident Artists,
  Associate Artists, Artists-in-Residence, **Collective Artists**, Fellows, **Apprentices**,
  Interns, Volunteers.
- **Collective Artists** = repeat collaborators; group name **"the DAT Collective"**;
  blurb: *"Frequent collaborators who have returned to DAT across multiple projects,
  expeditions, or productions."*
- Canonical registry: `lib/flags.ts` — `ROLE_DISPLAY_ORDER` (single source of order),
  `flagStyles` (colors), `iconMap` (emojis: Apprentice 🔨 #B5651D, Collective Artist 🌀
  #C13584, Fellow 💫, Intern 🌱), `flagDescriptions`, `flagGroupNames`, `getCanonicalFlag`.

## Donations (Phase 4 — DONE)
- "Fellow" now means the PLX program, so relabel the **artist-track** donation tiers that
  use Fellow/Fellowship: "Advance a Fellow" (`artist-m500-fellow`), "Fellowship Builder"
  (`artist-o2500-fellowship-builder`), "Fellowship Underwriter"
  (`artist-o5000-fellowship-underwriter`), category `long_term_fellowship`, and stray
  "sponsor-a-fellow" copy → artist/residency language. Reserve Fellow/Fellowship for PLX.
- **LIVE fundraising copy:** keep `id`s stable (Stripe/DB); change labels only; flag any id
  that must change. Files: `lib/donations.ts`, `components/donate/DonationPageTemplate.tsx`.

## Opportunities portal — fee/credit money-direction (Phase 5 — DONE)
- Today the card shows `o.isPaid ? compensation : "Volunteer"` — so fee-based listings
  wrongly render as "Volunteer."
- Add a money-direction (`paid | fee | volunteer`, derive from `is_paid` when absent), an
  `earnsCredit` boolean, and an optional `cost`. Fee cards show the participation cost +
  an **"Earns academic credit"** badge. Fully backward-compatible. **Serves all fee-payers,
  not just students.**
- Files: `lib/opportunities.ts` (Opportunity, SeedRow, normalize, csvRowsToSeed + new Sheet
  columns + doc comment), `app/opportunities/OpportunitiesClient.tsx`,
  `app/opportunities/[id]`.

## Audience pages (Phases 6–7)
- **Institution page** (expand `app/partners/universities/page.tsx` or a sibling): pitch a
  formal, repeatable for-credit internship / course / study-abroad pipeline to faculty,
  chairs, internship coordinators, study-abroad offices. CTA →
  `/partners/propose-project?type=university`. **No institution names.**
- **Student on-ramp page** (Phase 7): student-facing, linked from every program page and
  listed in the portal, for students whose school isn't a formal partner. Positions they
  **take**; pay the participation fee; DAT supplies the learning agreement / site supervisor
  / outcomes the student takes to their own registrar. Simple CTA (email/apply) for now.
  **No institution names.**

## Phase status
1. **Rename & switch PLX programs — DONE.**
2. **Project-Based Internship page — DONE.**
3. **/roles update — DONE.**
4. **Donation language — DONE.**
5. **Portal fee/credit model — DONE.**
6. **Institution for-credit page — DONE.**
7. **Student on-ramp page — DONE.**

**All seven phases complete.** Remaining work is non-code: the Google Sheet edits below, plus
optional real-world assets (Learning Agreement .docx, Stevenson outreach).

## Current code state
- `plxProgram` type: `internship | apprenticeship | fellowship | ""` (`lib/opportunities.ts`).
- Program pages: `/project-based-internships` (entry, `internship`, fee/credit),
  `/apprenticeships` (12-wk, `apprenticeship`), `/fellowships` (10-mo, `fellowship`) — all
  use the shared `components/plx/PlxProgramPage.tsx`. That template now has OPTIONAL,
  backward-compatible `compensationEyebrow` / `compensationHeading` /
  `whoYouAreEyebrow` / `whoYouAreTitle` fields (defaults preserve the original pages).
- Hub `app/professional-leadership-experience/page.tsx`: 3-rung ladder, Intern first
  ("Three Programs · One Ladder"); hero reads "Internships, Apprenticeships & Fellowships";
  benefits reframed to paid + fee-based + credit.
- Portal PLX band `app/opportunities/OpportunitiesClient.tsx`: renders all active rungs
  (Intern → Apprentice → Fellow), omitting any with no active listing.
- `middleware.ts`: `/internships → /project-based-internships`.
- Header nav `components/ui/Header.tsx`: "PLX Programs".
- `/roles`: `lib/flags.ts` holds `ROLE_DISPLAY_ORDER` + new Apprentice / Collective Artist
  flags (colors, emojis, blurb, group name); `RolesGrid` derives order from it; titles
  excluded from creative-title buckets; `app/role/[slug]` surfaces blurb + group name.
- The 14 departmental PLX Sheet rows are fully renamed (7 → Apprentice, 7 → Fellow); `id`s
  and `apply_url`s kept stable; mentor references "Interns" → "Apprentices".
- Donations: artist-track Fellow/Fellowship tiers relabeled to artist/residency wording
  (Sponsor an Artist / Residency Builder / Residency Underwriter / Long-term residency);
  tier `id`s and the persisted `long_term_fellowship` Stripe-metadata key kept stable.
- Apprentice role color is now `#E2711D`; the PLX hub metadata/OG describe all three rungs.
- Portal fee/credit: `lib/opportunities.ts` has `funding` (`paid|fee|volunteer`, derived
  from `is_paid` when blank) + `earnsCredit`, plus Sheet columns `funding` / `earns_credit`.
  Cards + detail render a fee icon + the `compensation` text (never "Volunteer") and an
  "Earns academic credit" badge; a "For credit" filter was added. Fully backward-compatible.
- Institution for-credit pitch: a `#for-credit` section on `/partners/universities`
  (real-role framing, registrar checklist, three setup paths, faculty reasons; CTA →
  `/partners/propose-project?type=university`).
- Student on-ramp: new page `/project-based-internships/credit` (how-to-get-credit, 3 steps,
  FAQ, mailto CTA). Linked from all three PLX program pages via an optional, accent-tinted
  `creditCallout` banner on `PlxProgramPage`, and from the portal PLX band footer.
- **Pending Sheet edits (yours):** add columns `funding` and `earns_credit` to the
  Opportunities tab; add the Project-Based Internship row (`plx_program = internship`,
  `learn_more_url = /project-based-internships`, `funding = fee`, `earns_credit = TRUE`,
  `compensation` = the participation-fee text); tag any other fee-based rows (e.g. PASSAGE)
  `funding = fee`.
