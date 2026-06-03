# Build Spec — Archived Project Pages & Campaign Recap

Status: ready to implement · Owner: Jesse · Last updated from mockup iterations

Reference mockups (in `/mockups`):
- `archived-project-page.html` — the project page (rich + sparse, live + concluded campaign toggles)
- `campaign-recap-page.html` — the "close the loop" recap

---

## 1. Goal

Turn each DAT project into a living archive page that reads as a *story with receipts*, not a database row — and make it the permanent home of any campaign that funded it. Everything that **can** be derived from existing data should be automatic and dynamic; only the irreducibly human/editorial pieces are curated.

Guiding principle: **automate everything derivable, curate only the irreducible.** Over-automating the narrative is what makes a page feel hollow — the curated bits are where the soul is.

---

## 2. Routes

| Route | Purpose | Notes |
|---|---|---|
| `/projects/[slug]` | Archived project instance | Replaces `/programs/[slug]` |
| `/projects/[slug]/recap` | Concluded-campaign "close the loop" view | Only exists when the project had a campaign |
| `/projects` | Existing project archive index | Wire its entries to link into `/projects/[slug]` |

Redirects (preserve SEO + existing links):
- `308` redirect `/programs/[slug]` → `/projects/[slug]` (extend the existing slug-forwarding map / middleware).
- Keep the evergreen recruiting funnel where it lives today (Squarespace `dramaticadventure.com/passage`, `/passage/slovakia`). The archive **links to** it (artist CTA) and the recruiting page **links into** the archive. Do not duplicate recruiting content in the archive.

`generateStaticParams` from `Object.keys(programMap)`; `revalidate` 3600 (match existing pages).

---

## 3. Typography — DAT fonts (required)

Use the existing DAT font CSS variables everywhere. Do **not** introduce new fonts. Map:

| Variable | Font | Use for |
|---|---|---|
| `--font-anton` | Anton | All display headlines (hero `h1`, section `h2`), stat numbers, the chapter numerals. Uppercase. |
| `--font-space-grotesk` | Space Grotesk | Body copy, ledes, sub-heads, names, card titles |
| `--font-dm-sans` | DM Sans | Eyebrows, kickers, labels, meta, buttons (uppercase + letter-spaced), stat labels |
| `--font-zilla-slab` | Zilla Slab | Optional serif accent for a single editorial/italic line (as on `/ripple-effect`) |
| `--font-rock-salt` | Rock Salt | Sparingly — handwritten accent only |
| `--font-gloucester` | Gloucester | Decorative quote mark only |

Color tokens (from existing pages): ink `#241123`, gold `#FFCC00`, teal `#2493A9`, pink `#F23359`, grape `#6C00AF`/`#7b4fa6`, green `#3b6d11`, paper `#f4eee1`, on global kraft.

---

## 4. Layout & UI rules (apply to both pages)

- **Hero**: tall (≈80vh project / 70vh recap), full-bleed image, dark bottom-up gradient scrim, **text anchored to the bottom** of the hero. Do not let the inner text wrapper inherit the hero's full height (the bug we fixed — keep the text container a distinct class).
- **Kraft readability**: ink text never sits directly on the global kraft background. All post-hero content lives on a light "paper" sheet (`--paper`, `border-radius: 24px`, soft shadow) with a kraft gap above it (don't overlap the hero). Dark bands (drama clubs, donor wall, CTAs) punch through intentionally.
- **Stats** sit *below* the hero, inside the sheet, as a solid ink band (gold numbers, white labels).
- **Buttons**: never put an arrow (→) inside a button. Arrows are allowed in text links and back-nav where they aid scanning.
- **Mobile button spacing**: multi-button rows use a flex container with `flex-wrap: wrap; gap: .7rem` — never rely on `margin-left` between buttons.
- Match existing hero/section conventions seen in `/season`, `/projects`, `/ripple-effect`.

---

## 5. Project page — sections, data sources, automation

Order top → bottom. "Graceful" = section hides entirely when empty (never an empty/sad state).

| # | Section | Source | Automation | Graceful? |
|---|---|---|---|---|
| 1 | Hero (family · season, title, place) | `programMap` (program, season, title, location/footprints) | Auto | — |
| — | Hero image | one image per project | Curated (filename convention like season heroes) | falls back to family/era default |
| — | Essence / tagline line | per program family | Curated (mostly static per family) | optional |
| 2 | Stats | roster count, footprints (regions), `dramaClubSlugs` count, weeks/dates | Auto (weeks may be manual) | — |
| 3 | Campaign module | `fundraisingCampaigns` + `getCampaignTotals` | Auto, live↔concluded | hides if no campaign |
| 4 | The Journey (lede + chapter itinerary) | lede + itinerary **snapshot** captured per project | Curated (snapshot is human by design) | itinerary hides if absent; page leans on people/partnership |
| 5 | In Partnership (drama clubs, hero images, causes) | `dramaClubSlugs` → `dramaClubMap` (name, location, `heroImage`, causes) | Auto | hides if none |
| 6 | The Causes | inherited from clubs' cause tags → `/cause/[slug]` | Auto | hides if none |
| 7 | Who Made It (roster) | `programMap.artists` → `loadAlumni` (name, headshot, profile) | Auto | — |
| 8 | Journey Cards | generated per artist | Auto | hides if cards not available |
| 9 | The Work (productions) | productions tagged to this project → `/theatre/[slug]` | Auto **once tagged** (one-time wiring) | hides if none |
| 10 | What It Left Behind (stories, showcases) | `storySlugs` / `eventIds` (or stories tagged by project) | Auto | hides if none → label becomes "The Partnership" |
| 11 | The Ripples | ripple records tagged to project (see §7) | Mixed: data-derived ripples auto; human ripples via submit→approve | **win-only**, hides if none; links to `/ripple-effect` |
| 12 | The Thread | group `programMap` by family, list other iterations | Auto | — |
| 13 | Dual CTA (donor + artist/evergreen) | `/donate` + family recruiting URL | Auto | — |

Itinerary chapters: each chapter = action verb + place + short description (e.g., "Acclimate in Bratislava"), **no cost or logistics**. The evergreen page keeps cost/logistics; the archive never shows prices.

---

## 6. Recap page (`/projects/[slug]/recap`) — close the loop

Sequence (the donor-stewardship order top orgs use): **gratitude + impact first, then proof, then recognition, then one soft forward invitation.** No hard re-ask.

| Section | Source | Automation |
|---|---|---|
| Hero ("Because You Made This Possible") + final tally | `archiveHeadline` + `getCampaignTotals` | Auto |
| Lead impact paragraph | `campaign.archiveSummary` | Auto |
| Stat band + goal-met progress | totals + `goalAmount` | Auto |
| "Where It Went" (image + point) | `campaign.giftImpact` copy; images assigned per point | Copy auto; images curated |
| Campaign Journal (timeline) | `campaign.updates` | Auto |
| Testimonials | `campaign.testimonials` | Auto |
| Donor wall + match thank-you | Neon `DonationPayment` (names) + `matchDescription` | **Gated on donor consent** (see §7) |
| Forward invitation | family recruiting URL + back to project | Auto |

The recap reuses the project page's content where possible — it's the donor-framed view of the same project, plus giving history and recognition.

---

## 7. Three one-time wiring tasks (to reach "as dynamic as possible")

1. **Tag productions & stories to projects.** Add a `projectSlugs` (or single `projectSlug`) field to `productionMap` entries and to story records, so "The Work" and "What It Left Behind" populate automatically. Without this, those sections can't self-assemble.

2. **Ripple data model + approval flow.** New structured record, fed via the same Sheets→CSV→Blobs pipeline as alumni/stories (or a Neon table if moderation UI is wanted):

   ```
   Ripple {
     id
     headline
     body
     type            // one of the 6 ripple types on /ripple-effect
     projectSlugs[]  // feeds project pages
     alumniSlugs[]   // feeds alumni profiles
     causeSlugs[]    // optional
     link?           // external or internal
     imageUrl?
     date
     status          // submitted | approved | featured
     source          // alum-submitted | staff
   }
   ```

   Collection: the existing "Share Your Story" CTA on `/ripple-effect` becomes a real form → staff approve → it auto-appears on the matching project page(s), alumni profile(s), and the `/ripple-effect` archive (featured up top, the rest filterable by type/cause/project). Data-derivable ripples (productions made, alumni who returned as leaders, clubs still active) can be generated automatically without submission.

3. **Donor-consent flag.** The donor wall is a *consent* problem, not a data problem — names exist in `DonationPayment`, but only show them with permission. Add an opt-in/display-name field captured at checkout; the wall renders only consenting donors, anonymizes the rest into the "+N more" count.

---

## 8. Campaign lifecycle (single source of truth)

One campaign object drives three states; no duplicate content:

1. **Live** — project page shows the teal "Help send this cohort" module: progress bar from `getCampaignTotals`, "Give now".
2. **Concluded** — same slot flips to the green gratitude panel (`archiveHeadline`, donor count, soft button "See what your support made possible") → links to the recap.
3. **Recap** — `/projects/[slug]/recap`, the full close-the-loop page (§6).

Projects with no campaign simply never render the module or the recap route.

---

## 9. Cross-linking (the page as hub)

Bidirectional links so the project page is connective tissue, not a leaf:
- Season pages ↔ project (`/season/[n]` cards → `/projects/[slug]`; project → its season + sibling projects).
- `/projects` archive index → `/projects/[slug]`.
- Alumni profiles ↔ project (passport stamps / `ProgramStamps` → project; roster → profiles).
- Drama club pages ↔ project (`dramaClubSlugs`).
- `/theatre/[slug]` productions ↔ project.
- `/cause/[slug]` ↔ project (via club cause tags).
- `/ripple-effect` ↔ project (ripples).

---

## 10. Open decisions

- Exact home of the recap: dedicated `/projects/[slug]/recap` route vs. the concluded state of the existing `CampaignTemplate`. (Spec assumes the dedicated route reusing project sections.)
- Whether "Where It Went" images are per-campaign uploads or pull from the project's existing media.
- Donor wall default: opt-in vs. opt-out at checkout (recommend opt-in).
