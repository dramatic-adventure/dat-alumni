# Build prompt — Journey Board (profile teaser, final design)

Copy-paste everything below into a fresh session.

---

Build the "Journey Board" — the redesigned Journey Cards teaser on the public
alumni profile page (`/alumni/[slug]`). The approved design is in
`journey-teaser-mockup-v10.html` at the repo root (open it in a browser; it
shows the four-journey state and the one-journey state). Match it exactly,
with the deltas listed under DESIGN SPEC below.

## WHAT IT IS

A slim, DAT-yellow "enamel sign" band that advertises an alum's Journey Cards
and links into their journey index at `/journeys/[slug]`. It replaces the
current `components/journeys/ProfileJourneyTeaser.tsx` treatment AND moves to
a new mount point: INSIDE the profile card, between the passport program
stamps and Featured Stories, instead of the old band at the bottom of the page.

## PLACEMENT / ARCHITECTURE

- New mount: in `components/profile/ProfileCard.tsx`, directly between the
  `<ProgramStamps …/>` block and the Featured Stories section, so the card
  reads: passport stamps page → journey board → stories. Full-bleed within the
  card (no side margins), like the neighboring sections.
- `ProfileCard` is a client component, so the board CANNOT load its own data.
  Load journey cards server-side in `app/alumni/[slug]/page.tsx` (where the
  old `<ProfileJourneyTeaser/>` is mounted around line 638) using the existing
  `loadJourneyCardsForSlug(slug, aliases)` from `lib/loadJourneyCards`,
  wrapped in try/catch → `[]` on any error (a Sheets hiccup must never break
  the profile). Pass the result down: page → `AlumniProfilePage` → `ProfileCard`
  as a `journeyCards` prop.
- Render NOTHING (no empty band, no gap) when there are zero cards.
- Remove the old `<ProfileJourneyTeaser/>` mount from
  `app/alumni/[slug]/page.tsx`. Rewrite `ProfileJourneyTeaser.tsx` or replace
  it with the new component files — either way no dead code left behind.
- The animated display needs a small `"use client"` component (e.g.
  `components/journeys/JourneyBoard.tsx`). Keep it dependency-free: CSS
  animations + a `setInterval`, no animation libraries.

## DATA — one schema addition: `city`

- Add an optional `city` field to the `JourneyCard` type (`lib/journeyCard.ts`)
  and parse it from a new "City" column in the journey-card sheet loader
  (`lib/loadJourneyCards.ts` / wherever card rows are parsed). Trim it;
  empty → undefined.
- The design shows CITY as the big word. When a card has no city yet,
  fall back to COUNTRY as the big word and show only the year in the side
  stack (no duplicated country). Everything must look intentional either way.

## DESIGN SPEC (v10 mockup + these deltas)

Tokens come from `components/journeys/journeyTheme.ts` (`A.yellow` #f5c842,
`A.ink` #241123, `A.teal`, `A.pink`). Fonts via the existing CSS vars
(`--font-anton`, `--font-space-grotesk`, `--font-dm-sans`).

Band: solid `A.yellow`, slim padding (~18px top / 16px bottom), three rows:

1. **Row 1** — program eyebrow left (Space Grotesk 700, uppercase,
   ~0.7rem, letter-spacing ~0.34em, ink), showing the PROGRAM of the journey
   currently on display (PASSAGE, ACTion, …); it cross-fades when the board
   cycles. Right side: the link label **"Journey Cards →"** (DM Sans 700,
   ~0.9rem, ink) — this names the section and is the CTA (the whole band is
   one `<Link>` to `/journeys/[slug]`). With a single card the label reads
   **"Journey Card →"**.
2. **Row 2** — the big line: the CITY in individual letter tiles — ink
   rounded-3px boxes (gradient `#2e1830 → #170a17`), yellow Anton letters,
   font-size clamp(1.5rem, 4.4vw, 2.5rem). **NO seam/split line through the
   tiles** (the split-flap conceit is dropped; they are just tiles). Beside
   it, stacked small: COUNTRY (Space Grotesk 700 uppercase ink) over YEAR
   (Space Grotesk 700, teal, wide tracking).
3. **Row 3** — one small plate per journey card: same ink-gradient boxes
   (rounded 3px, **no seam line**), yellow Space Grotesk uppercase text
   "CITY ’YY" (year bold white), the currently displayed journey's plate in
   pink gradient (`#ff4a6e → #d92448`) with white text. Hover: lift 1px.
   **Hidden entirely when there is only one card.**

Cycling behavior (the part the mockup undersold — make the change UNMISSABLE):

- Multiple cards: auto-advance every ~4s through the cards. On each advance
  the letter tiles visibly change — stagger a quick per-tile fade/flip-in
  (~40ms per letter) so the new city sweeps in left to right; eyebrow,
  country, year cross-fade; the active plate switches to pink. No cycling on
  `prefers-reduced-motion` (just show the most recent journey, tiles static).
- One card: no cycle, no interval; tiles render static.
- Order cards oldest → newest; start the display on the NEWEST.

Responsive: must look great from 360px up. Long cities ("STONE TOWN") must
never overflow — cap tile font-size down on small screens; the side
country/year stack can drop under the big line on very narrow screens;
plates wrap. Test with 1 card and with 4+.

## CONSTRAINTS

- Do NOT touch `lib/googleClients.ts`, any `GCP_SA_*` env handling, or the
  notification/Blobs code.
- Do NOT change `/journeys/[slug]` (`AdaptiveProfileJourneys`), the global
  nav, or the footer.
- No new dependencies.
- `npm run check` must pass clean before you finish.
- Commit when done (there may be a stale `.git/HEAD.lock` from a crashed
  process — if git refuses, delete that lock file first).
- Also commit the exploration mockups already staged at the repo root
  (`journey-teaser-mockup*.html`) in a separate commit, or delete them if
  they're no longer wanted — ask first.

## ACCEPTANCE CHECKLIST

- [ ] Profile with 4 cards: stamps → yellow board (cycling, plates) → stories.
- [ ] Profile with 1 card: slim board, no plates, no cycle, "Journey Card →".
- [ ] Profile with 0 cards / Sheets error: nothing renders, layout unchanged.
- [ ] Card missing `city`: country becomes the big word, no duplication.
- [ ] Whole band navigates to `/journeys/[slug]`.
- [ ] Reduced motion: static board, newest journey shown.
- [ ] `npm run check` clean; committed.
