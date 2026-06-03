# Events Prototype — `/events-prototype` (revision 2)

A self-contained, clickable redesign of the DAT events experience. **Fully isolated
from production** — every file lives under `app/events-prototype/` and nothing here
is imported by the live `/events`, `/theatre`, or `/projects` pages. Verified: a
project-wide `tsc --noEmit` and `eslint .` both pass with the prototype in place,
and `git status` shows only `app/events-prototype/` changed.

```
app/events-prototype/
  page.tsx          Hub: hero + filters + location strip + Next Up + rail + list + archive + footer modules
  EventPoster.tsx   The reusable duotone treatment (posters, Featured module, date chip, cal/share row)
  DetailViews.tsx   PerformanceDetail (rich) + ArchiveDetail (festival/community)
  README.md         This file
```

## Page structure (models `/events` after the three category pages)

- **Category-switchable hero.** The four live heroes are reproduced **exactly**
  (image, copy, overlay, glow, and each one's distinctive extra — the `/events`
  category chips, the performances "↓" note, the festivals city strip, the
  fundraisers pills). `All / In person / Online` show the main `/events` hero;
  clicking **Performances / Festivals / Community** swaps the hero to that
  category's banner. Heroes are unchanged from the live pages.
- **Next Up / Featured module** (`FeaturedModule`) sits *below* the hero, not in
  it. `featured: true` wins; otherwise it's the soonest upcoming event in the
  current filter. This is the only place with a description, a **Details** button,
  and the **calendar + share** icon buttons (the action-row reference).
- **Swipeable rail** of tall duotone posters for the near-term events (arrows on
  desktop, touch/scroll-snap on mobile).
- **Compact text list** for the long tail — date · category dot · title · place ·
  arrow. No poster cards, so there's no endless scroll.
- **Live, in-place filtering** (All / In person / Online / + the three categories)
  — pure client state, no navigation. The three category pages stay reachable as
  real deep links (`/events/performances`, etc.) — untouched.
- **Quiet location strip** — see the tradeoff note below.
- **Muted Past / Archive** section with a **See more / See less** toggle; each row
  links to its archived page via `canonicalEventPath()`.
- **Restored above-footer modules**: the Oscar Wilde quote band, the mailing-list
  signup (posts to the real `/api/mailing-list`), and the footer links. The
  rev-1 "Ready to act?" CTA band is gone.

## Featured vs. non-featured

- **Featured / Next Up** shows: poster image, category label, title, prominent
  date, short description, **Details** button, and **calendar + share** icon
  buttons (rounded-square, hairline border — matching the icon reference).
- **Non-featured** (rail posters + list rows): category, title, and a **prominent
  date** only. No description, no buttons. The photo and the date do the selling.

## Detail views differ by category

- **Performance** → `PerformanceDetail`. Pulls in everything from `/theatre/[slug]`:
  the info card (price/runtime/language/suitability), an **accessibility** line,
  **About** body, the **artist-note** pull quote, **video embed**, **photo
  gallery**, **credits** split into Creative Team + Cast (with headshots), **press
  quotes**, and a **Community Impact / donate** block — plus the **ES / EN
  translation toggle** that swaps every bilingual field (title, copy, credits,
  accessibility, quotes, runtime, price…). The action row carries the primary
  button **and** the calendar + share icons. Uses the simplified duotone hero.
- **Festival & community** → `ArchiveDetail`, a deliberately **different, lighter
  "dispatch / residency" format**. No ticket dashboard; instead a dates/place/
  access strip, editorial body, artist note, an **"In the Archive"** card that
  routes onward to `/projects`, and a "Why It Matters" support block. This is the
  proposed structure for routing festival/community events into the archive: they
  read as *part of the ongoing record*, not as a ticketed show.

## The `EventPoster` overlay treatment (how it's built — for porting later)

`EventPoster.tsx` is the one reusable component. `PosterLayers` is a small stack
inside a container that sets `isolation: isolate`. The treatment is **"colour only
at the bottom"** — no full-image tint; the photo stays natural and the category
colour rises from the bottom edge only. Layers, bottom to top:

1. **`.ep-photo`** — the real event photo (`getEventImage()` + `imageFocus`),
   natural colour, `filter: contrast(1.04) saturate(1.05)`.
2. **`.ep-scrim`** — the only "overlay": **one** bottom-up gradient. A dark in-tone
   shade (`CAT[cat].scrim`) at the very bottom keeps the white Anton headline
   legible → the vivid brand colour (`CAT[cat].vivid`) through the mid → fully
   transparent by ~80%, so the **top of the photo is untouched**.
3. **`.ep-grain`** — inline SVG fractal noise, `mix-blend-mode: overlay`, low
   opacity.
4. **Content** — oversized Anton title + the category-colour **date chip**.

To raise or soften how far the colour climbs, move the `rgba(vivid,…)` stops in
`PosterLayers` (raise the `%` to lift colour higher; lower the alpha to soften).
Category colours are fixed, never random: performance `#F23359`, festival
`#2493A9`, community/fundraiser `#D9A919`; the hover edge glow is `--ep-glow`. The
same `PosterLayers` powers the detail hero (`intensity="hero"`), so the grade is
identical everywhere. `DuotoneLayers` remains exported as a deprecated alias for
`PosterLayers`. The page hero banner is separate and untouched (exact live heroes).

## Background / kraft

`globals.css` paints the kraft texture globally via `body::before`
(`url("/texture/kraft-paper.png")` over `#f6e4c1`). So everywhere the design would
be white, the prototype uses **transparent** backgrounds and the texture shows
through (hub root, detail bodies, info cards use translucent white).

**Hero → section seam.** Earlier revs faded the hero's bottom to the kraft colour
`#f6e4c1` to soften the seam, but that washed the bottom of the hero photo cream —
removed. The hero is now left **exactly** like the live category heroes (dark
overlay bottom) and meets the kraft section directly. If a crisper-than-ideal edge
ever bothers, the non-cream fix is a thin dark→transparent shadow at the hero base
or a slim dark band at the top of the nav — not a cream fade over the photo.

## Location element — placement (resolved)

DAT performs in many places, so the brief asked for **one** lightweight way to
surface the represented cities/countries — not a dashboard.

**Current placement:** a single quiet **location dropdown** (`.eh-locselect` — a
pin icon + "All locations ▾") sitting to the right of the filter chips in the nav
row. It combines with the category/mode filter, surfaces every represented place in
one compact control, and adds almost no visual weight. The nav is **not sticky** —
it scrolls away with the hero, so nothing overlaps the hero→kraft fade.

(Rev-2 superseded the earlier text "location strip", which read as clutter and sat
in a sticky bar overlapping the hero fade.)

No production files were modified to build this prototype.
