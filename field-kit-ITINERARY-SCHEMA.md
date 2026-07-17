# Field Kit — Itinerary Sheet Schema (D1)

**For:** Jesse · **Date:** 2026-06-28
**What this is:** the exact tabs + columns to create in the alumni spreadsheet (`ALUMNI_SHEET_ID`) so the Field Kit can read the **PASSAGE: Slovakia 2026** program/itinerary. The loader (`lib/loadProgram.ts`) is already built against this schema and verified to typecheck + lint.

**Decision locked:** separate tabs (cleanest for the nested structure, easiest to edit by hand) — `Field Kit Program` + `Field Kit Itinerary Chapters` + `Field Kit Itinerary Days` + `Field Kit Time Anchors`. The `Field Kit` prefix groups them together and distinguishes them from the `Journey Cards` tab.

---

## How it works (read this once)

- **Row 1 of every tab is the header** — use the exact column names below, in any order (the loader keys by header name, not position). Keeping the given order is recommended.
- The loader tries the **Sheets API first**, then falls back to a **published-CSV/Netlify-Blobs** copy. After you create + populate the tabs, do two things and send them to me:
  1. **Publish each tab to the web** (File → Share → Publish to web → pick the tab → CSV). Send me the **gid** for each tab (the number in the publish URL, `…?gid=NNNN&single=true&output=csv`).
  2. Tell me the **`programId`** you used (e.g. `passage-slovakia-2026`).
- Until the gids arrive, the Field Kit reads via the Sheets API only (the CSV fallback stays off, which is fine for development).
- **Slugs, not duplicates:** `dramaClub` and `partnerOrg` columns hold the *slug* of an existing record — they reference `lib/dramaClubMap.ts` (and the partner store later). Don't paste club/partner details into these tabs.

### Multi-value cells
- `prep` (a day's packing/prep list) and `dayIds` (a chapter's day order) hold **multiple values in one cell** — separate them with a **newline** (Alt/Option+Enter inside the cell) **or a `|` pipe**. Both work.
- `fullDate` must be **ISO `YYYY-MM-DD`** (e.g. `2026-07-16`). This is what drives "today" highlighting on the trip. `dateLabel` is the pretty version ("Day 5 · Mon").

---

## Tab 1 — `Field Kit Program`  (one row)

| Column | Meaning | Example |
|---|---|---|
| `programId` | stable id; everything joins on this | `passage-slovakia-2026` |
| `program` | brand name, literal casing | `PASSAGE` |
| `location` | place | `Slovakia` |
| `country` | country (use `A & B` if it crossed borders) | `Slovakia` |
| `year` | year | `2026` |
| `label` | full label (leave blank to auto-derive "PASSAGE: Slovakia 2026") | *(blank)* |
| `dates` | human date range | `July 12 – August 2, 2026` |
| `essence` | one-line program spirit | `Six chapters across eastern Slovakia.` |
| `todayDayId` | manual "today" override (leave blank — date-derived is preferred) | *(blank)* |
| `link` | optional public link | *(blank)* |

---

## Tab 2 — `Field Kit Itinerary Chapters`  (one row per chapter)

| Column | Meaning | Example |
|---|---|---|
| `id` | stable chapter id | `ch1` |
| `programId` | must match the Program row | `passage-slovakia-2026` |
| `num` | chapter number (drives order) | `1` |
| `verb` | the chapter's verb | `Arrive` |
| `place` | where | `Košice` |
| `title` | chapter title | `Landing in the East` |
| `description` | short description | `Settle in, meet the cohort…` |
| `goal` | the GOAL block text | `Find your footing.` |
| `tips` | the TIPS block text | `Sleep early; jet lag is real.` |
| `accent` | color token: `pink` / `teal` / `yellow` / `grape` / `purple` | `teal` |
| `prompt` | reflection prompt | `What surprised you on arrival?` |
| `dramaClub` | slug of a drama club (or blank) | `kosice-drama-club` |
| `partnerOrg` | slug of a partner org (or blank) | *(blank)* |
| `dayIds` | optional explicit day order (else derived from Day.chapterId + dayNum) | `d01 \| d02` |
| `status` | `complete` / `draft` / `empty` (leave blank → `empty` for Slice 1) | *(blank)* |

> Tip: you can leave `dayIds` blank entirely. As long as each Day row has the right `chapterId`, the chapter's days order themselves by `dayNum`.

---

## Tab 3 — `Field Kit Itinerary Days`  (one row per day)

| Column | Meaning | Example |
|---|---|---|
| `id` | stable day id | `d05` |
| `programId` | must match the Program row | `passage-slovakia-2026` |
| `chapterId` | the chapter this day belongs to | `ch2` |
| `dayNum` | day number (drives order within chapter) | `5` |
| `dateLabel` | pretty label | `Day 5 · Mon` |
| `fullDate` | **ISO date** (drives "today") | `2026-07-16` |
| `location` | where | `Košice` |
| `title` | day title | `Market & First Workshop` |
| `what` | what happens | `Morning market visit, afternoon workshop.` |
| `spirit` | the day's spirit line | `Listen more than you speak.` |
| `cohortNote` | note about the cohort that day | `Theo & Sam on partner visit.` |
| `dramaClub` | slug (or blank) | `kosice-drama-club` |
| `partnerOrg` | slug (or blank) | *(blank)* |
| `prep` | packing/prep list — **multi-value** (newline or `\|`) | `Water \| Notebook \| Comfortable shoes` |

---

## Tab 4 — `Field Kit Time Anchors`  (one row per schedule line, keyed by day)

| Column | Meaning | Example |
|---|---|---|
| `dayId` | which day this time row belongs to | `d05` |
| `programId` | must match the Program row (keeps anchors scoped to this program) | `passage-slovakia-2026` |
| `order` | sort within the day | `1` |
| `time` | the time | `09:00` |
| `label` | what it is | `Leave for the market` |
| `bold` | emphasize this row? `true`/`false` | `true` |
| `note` | small note under the row | `Meet in the lobby` |
| `marker` | render with the `»` prefix? `true`/`false` (for cast/track-specific or "this is for you now" rows) | `false` |

---

## Addendum (2026-07-14) — Lodging columns + Contacts tab (Slice 7)

### Tab 2 gains six lodging columns (append after `status`)

| Column | Meaning | Example |
|---|---|---|
| `lodgingName` | where the company sleeps this chapter — **rendering keys on this**; blank = no lodging block | `Medická Dormitory` |
| `lodgingAddress` | street address | `Medická 4/6, 040 11 Košice, Slovakia` |
| `lodgingPhone` | phone — **multi-value** (newline, `\|`, or `/`); each renders tap-to-call | `+421 55 234 1684 / +421 55 643 1689` |
| `lodgingEmail` | email (mailto:) | `ubyt@upjs.sk` |
| `lodgingWebsite` | website — **multi-value** (newline or `\|`); each renders as a link, https:// added if missing | `www.upjs.sk \| maps.app.goo.gl/…` |
| `lodgingExpect` | the "Expect:" blurb | `Simple university dormitory lodging…` |

### Tab 5 — `Field Kit Contacts`  (one row per contact entry)

Read by `lib/contacts.ts`; rides the itinerary payload (offline-precached, roster-gated). Renders at `/field-kit/contacts`.

| Column | Meaning | Example |
|---|---|---|
| `id` | stable row id | `c05` |
| `programId` | must match the Program row | `passage-slovakia-2026` |
| `section` | `emergency` / `ground-control` / `staff` / `artists` / `whatsapp` (unknown → "other") | `staff` |
| `order` | sort within the section | `1` |
| `label` | person or entry name | `Jesse Baxter` |
| `role` | small-caps role line | `Artistic Director` |
| `phone` | tap-to-call | `+1 917 952 4714` |
| `email` | mailto: | `jesse@dramaticadventure.com` |
| `link` | external URL — WhatsApp rows carry the `chat.whatsapp.com` invite here | *(blank until the group exists)* |
| `note` | small print under the row | `Text preferred.` |

## Checklist for you

1. Create the four tabs with the exact header names above.
2. Fill in PASSAGE: Slovakia 2026 (the mockup's `sampleProgram.ts` is the content reference — the audit notes the real trip is **6 chapters / 11 days**, so use the real numbers, not the mockup's "five chapters, ten days" placeholder text).
3. Publish each tab to the web as CSV; send me the four **gids** + the **`programId`**.
4. I wire the gids into `lib/csvUrls.ts`, verify it loads, then port the Itinerary + Today screens against the live data.
