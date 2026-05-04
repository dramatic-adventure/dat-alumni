# Collection Tagging Feature — Implementation Prompt

## Context

This is a Next.js 16 (App Router) full-stack app for Dramatic Adventure Theatre (DAT) — an alumni storytelling platform. The relevant stack:

- **Data store:** Google Sheets via the Sheets API. Media metadata lives in a sheet tab called `Profile-Media` (spreadsheet ID from env `ALUMNI_SHEET_ID`).
- **Auth:** NextAuth v4 (Google OAuth). Non-admins can only edit their own `alumniId`.
- **Media API routes:** `GET /api/alumni/media/list`, `POST /api/media/feature` (toggles `isFeatured` on a row).
- **Public profile gallery:** `components/profile/PublicMediaSection.tsx` — an accordion of photo collections. Each collection panel shows a cover photo (the `isFeatured` item, or first item as fallback) and expands to a thumbnail grid.
- **Studio (edit UI):** `app/alumni/update/studio/MediaPanel.tsx` — lets alumni manage cover photos per collection.

---

## Current `Profile-Media` Sheet Schema

Columns A–L (in order):

| Col | Field           | Notes                              |
|-----|-----------------|------------------------------------|
| A   | alumniId        | lowercase slug                     |
| B   | kind            | `album` \| `headshot` \| `reel` \| `event` |
| C   | collectionId    | opaque ID string                   |
| D   | collectionTitle | human-readable album name          |
| E   | fileId          | Google Drive file ID               |
| F   | externalUrl     | fallback if no Drive file          |
| G   | uploadedByEmail |                                    |
| H   | uploadedAt      | ISO timestamp                      |
| I   | isCurrent       | boolean                            |
| J   | isFeatured      | boolean — used as cover photo flag |
| K   | sortIndex       | numeric sort override              |
| L   | note            | freeform caption                   |

Tags will be added as **new columns M onward**. They store pipe-separated slugs/values so a single cell can hold multiple tags of the same type.

---

## What to Build

### 1. Sheet Schema Extension

Add these columns to `Profile-Media` (append to the right — existing data is unaffected):

| Col | Field              | Format                                      |
|-----|--------------------|---------------------------------------------|
| M   | tagProductions     | pipe-separated production slugs e.g. `hamlet-2022\|midsummer-2023` |
| N   | tagDramaClubs      | pipe-separated drama club slugs             |
| O   | tagProgram         | pipe-separated program names e.g. `Summer Intensive\|School Year` |
| P   | tagSeason          | pipe-separated season strings e.g. `2023-24` |
| Q   | tagTripTour        | pipe-separated trip/tour names e.g. `Slovakia 2026` |
| R   | tagEventType       | pipe-separated freeform types e.g. `Performance\|Cast Party` |

Tags live on **the collection as a whole**, not individual photos. When writing, all items sharing the same `collectionId` get the same tag values. In practice, update only the first row of each collection (the cover photo row) and read tags from that row when building the collection object.

---

### 2. Data Layer

#### `MediaItem` type (update in both `app/api/alumni/media/list/route.ts` and `components/profile/PublicMediaSection.tsx` and `app/alumni/update/studio/MediaPanel.tsx`)

```ts
interface CollectionTags {
  productions: string[];   // production slugs
  dramaClubs:  string[];   // drama club slugs
  program:     string[];   // program names
  season:      string[];   // e.g. ["2023-24"]
  tripTour:    string[];   // e.g. ["Slovakia 2026"]
  eventType:   string[];   // freeform e.g. ["Performance", "Cast Party"]
}

interface MediaItem {
  // ... existing fields ...
  tags?: CollectionTags;
}
```

#### Read — update `app/api/alumni/media/list/route.ts`

Parse columns M–R when reading rows. Helper:

```ts
function parsePipe(v: unknown): string[] {
  if (!v) return [];
  return String(v).split("|").map(s => s.trim()).filter(Boolean);
}
```

Attach tags to each `MediaItem`. When grouping into collections (`groupByCollection`), merge tags from the first item that has any (or deduplicate across all items — either works since they should be identical).

#### Write — new API route `POST /api/media/collection-tags`

```
Body: { alumniId, collectionId, tags: CollectionTags }
```

- Auth-guard same as `/api/media/feature` (owner or admin only).
- Find all rows in `Profile-Media` where `alumniId` and `collectionId` match.
- Write the new tag values to columns M–R on **every matching row** (so the tags stay consistent if rows are read individually).
- Use `batchUpdate` for efficiency.
- Return `{ ok: true }`.

Also update `groupByCollection` in `PublicMediaSection.tsx` to merge tags from all items in the collection onto the `Collection` object:

```ts
type Collection = {
  title: string;
  id: string;
  items: MediaItem[];
  tags: CollectionTags;  // ← add this
};
```

---

### 3. Studio UI — `app/alumni/update/studio/MediaPanel.tsx`

In the **Cover Photos** section, each collection row already expands to show its photo grid. Add a **Tags** sub-section beneath the photo grid (inside the expanded row).

#### Layout (expanded collection row, below thumbnails)

```
──────────────────────────────────────────
  Tags
  
  Production     [autocomplete dropdown]   ×hamlet-2022  ×midsummer-2023
  Drama club     [autocomplete dropdown]   ×lincoln-park-hs
  Program        [chip selector]           Summer Intensive  School Year
  Season         [text/year input]         ×2023-24
  Trip / tour    [text input]              ×Slovakia 2026
  Event type     [chip selector]           Performance  Rehearsal  Cast Party
                                            Workshop  Retreat  Audition
  
  [Save tags]                              ✓ Saved
──────────────────────────────────────────
```

**Autocomplete for productions and drama clubs:** Fetch available slugs+names from existing endpoints or add lightweight `GET /api/media/tag-options?type=production` and `GET /api/media/tag-options?type=dramaClub` routes that return `{ slug, name }[]`. These can read from the production map and drama club map already used elsewhere in the codebase.

**Programs and event types:** Fixed chip sets — no API needed.

Known programs: `Summer Intensive`, `School Year`, `Summer Day Camp`, `Weekend Workshop`

Known event types: `Performance`, `Dress Rehearsal`, `Rehearsal`, `Workshop`, `Audition`, `Cast Party`, `Retreat`, `Tour`

**Save behavior:** on "Save tags", call `POST /api/media/collection-tags`. Optimistic UI update. Show `✓ Saved` flash for 1.5s.

---

### 4. Public Profile UI — `components/profile/PublicMediaSection.tsx`

On the accordion, when a panel is **expanded (isActive)**, show tag chips in the label bar above the title, between the photo count line and the collection name. Only show chips for non-empty tag types.

```
6 photos                          ← existing photo count line
[Hamlet 2022] [Lincoln Park HS]   ← tag chips (linked)
Midsummer Night                   ← existing title
▼ browse                          ← existing cue
```

**Chip styles:** Small pill, `rgba(255,255,255,0.12)` background, white text, `10px` font, `border-radius: 999px`. Clickable — navigate to the entity's page.

**Chip routing:**
- Production slug → `/theatre/[slug]`
- Drama club slug → `/drama-club/[slug]`
- Program/season/trip/event type → no link, just a label chip

Cap at 3 visible chips with a `+N more` overflow chip to avoid overflowing narrow panels.

---

### 5. Cross-linking — Entity Pages

This is the highest-value part: tagged collections surface on production and drama club pages.

#### Production page — `components/productions/ProductionPageTemplate.tsx`

Add an **Alumni Photos** section near the bottom of the page. It should:

1. Receive `alumniPhotos: { alumniId: string; alumniName: string; alumniSlug: string; items: MediaItem[] }[]` as a prop — passed in from the server-side page component.
2. Render a horizontal scroll strip of collection cover photos, each linking to the alumni's profile.
3. Clicking a cover photo opens a lightbox showing that collection's photos.

To populate this prop, add a server-side helper `lib/media/getTaggedCollections.ts`:

```ts
export async function getCollectionsTaggedTo(
  type: 'production' | 'dramaClub',
  slug: string
): Promise<{ alumniId: string; collections: Collection[] }[]>
```

This queries the `Profile-Media` sheet, filters rows where the relevant tag column contains the slug, and groups by alumniId → collection.

Cache with `React.cache()` and a reasonable TTL (same pattern as `loadAlumni.ts`).

#### Drama club page — `components/drama/DramaClubPageTemplate.tsx`

Same pattern — add an **Alumni Photos** section. The existing `DramaClubMomentsGallery` component handles a similar concept for drama club event photos; the new section is specifically for alumni-uploaded tagged media.

---

### 6. "Move to Collection" (companion feature — implement alongside or after tagging)

Currently there is no way to reassign a photo to a different collection after upload. This matters because photos uploaded without a collection name are stranded in the catch-all pool.

Add a **Move** action to each photo thumbnail in the MediaPanel cover photo picker (expanded view). A small dropdown lets the user pick an existing collection by name or type a new one. On confirm:

- Call a new `POST /api/media/move-to-collection` route.
- Body: `{ alumniId, fileId, newCollectionId, newCollectionTitle }`.
- The route updates columns C and D on the matching `Profile-Media` row.

This pairs naturally with tagging: once photos are in the right collection, they inherit the collection's tags.

---

## Files to Touch

| File | Change |
|------|--------|
| `app/api/alumni/media/list/route.ts` | Parse tag columns M–R, include in `MediaItem` |
| `app/api/media/collection-tags/route.ts` | **New** — write tags to all rows in a collection |
| `app/api/media/tag-options/route.ts` | **New** — return production/drama club slug+name lists |
| `app/api/media/move-to-collection/route.ts` | **New** — update collectionId/Title on a row |
| `lib/media/getTaggedCollections.ts` | **New** — server-side query for cross-linking |
| `components/profile/PublicMediaSection.tsx` | Add `tags` to `Collection` type; render chips on expanded panels |
| `app/alumni/update/studio/MediaPanel.tsx` | Add tag inputs to expanded collection rows |
| `components/productions/ProductionPageTemplate.tsx` | Add `alumniPhotos` prop + Alumni Photos section |
| `app/theatre/[slug]/page.tsx` | Fetch and pass `alumniPhotos` to template |
| `components/drama/DramaClubPageTemplate.tsx` | Add Alumni Photos section |
| `app/drama-club/[slug]/page.tsx` | Fetch and pass `alumniPhotos` to template |

---

## Confidence Check

Before writing any code, verify:

1. The `Profile-Media` sheet actually has columns beyond L available (or confirm it's safe to append M–R).
2. The `collectionId` field is reliably populated — if many rows have empty `collectionId`, the "update all rows in collection" write logic needs to match on `collectionTitle` as fallback.
3. The production slug format used in `productionDetailsMap.ts` / `productionMap.ts` matches what will be stored in `tagProductions` (no capitalization or path differences).
4. The drama club slug format in `dramaClubMap.ts` matches similarly.
5. Confirm `ALUMNI_SHEET_ID` vs `GOOGLE_SHEET_ID` — the media routes use `ALUMNI_SHEET_ID`; make sure the tag write route uses the same one.
