// lib/communityFeed.ts
// Builds up to N "community updates" from Profile-Changes rows,
// using Profile-Live to fill in title/text when needed.
//
// Also exports a dedicated "Update Stream" builder that returns
// max 1 update per person (latest), formatted for Name: text.

export type ProfileChangeRow = {
  // ✅ optional id if your Profile-Changes sheet includes it (or if you add it later)
  id?: string;

  ts: string; // ISO-ish timestamp
  alumniId: string;
  email?: string;
  field: string;
  before?: string;
  after?: string;

  // ✅ NEW: whether this change row has been undone (string because Sheets)
  isUndone?: string;
};

export type ProfileLiveRow = {
  alumniId: string;
  name?: string;
  slug?: string;

  currentUpdateText?: string;
  upcomingEventTitle?: string;
  storyTitle?: string;

  // Media pointers / urls
  currentHeadshotId?: string;
  currentHeadshotUrl?: string;
  featuredAlbumId?: string;
  featuredReelId?: string;
  featuredEventId?: string;
};

export type CommunityFeedItem = {
  // ✅ optional id for UIs that support “undo” on certain entries
  id?: string;

  ts: string;
  alumniId: string;
  name: string;
  slug: string;
  label: string; // subtle label e.g. "Current Update"
  text: string; // line after colon
  kind: "current" | "event" | "story" | "media" | "fallback";
  field: string;
};

const CURRENT_FIELDS = new Set(["currentUpdateText", "currentUpdateLink", "currentUpdateExpiresAt"]);
const EVENT_FIELDS = new Set([
  "upcomingEventTitle",
  "upcomingEventDate",
  "upcomingEventLink",
  "upcomingEventExpiresAt",
  "upcomingEventDescription",
]);
const STORY_FIELDS = new Set([
  "storyTitle",
  "storyProgram",
  "storyLocationName",
  "storyYears",
  "storyPartners",
  "storyShortStory",
  "storyQuote",
  "storyQuoteAuthor",
  "storyMediaUrl",
  "storyMoreInfoUrl",
  "storyCountry",
  "showOnMap",
]);
const MEDIA_FIELDS = new Set([
  "currentHeadshotId",
  "currentHeadshotUrl",
  "featuredAlbumId",
  "featuredReelId",
  "featuredEventId",
]);

function tsNum(ts: string) {
  const n = Date.parse(ts);
  return Number.isFinite(n) ? n : 0;
}

function norm(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

function isTrue(v: unknown) {
  return norm(v) === "true";
}

function isNoOp(r: ProfileChangeRow) {
  const b = String(r.before ?? "").trim();
  const a = String(r.after ?? "").trim();
  if (!b && !a) return true;
  return b === a;
}

function normalizeForDedup(s: string) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u2026/g, "...");
}

function isNearDuplicate(a: string, b: string) {
  // V1: conservative dedupe — exact after normalization
  return normalizeForDedup(a) === normalizeForDedup(b);
}

type Scored = {
  row: ProfileChangeRow;
  score: number; // bigger = better
  kind: CommunityFeedItem["kind"];
};

function scoreRow(r: ProfileChangeRow): Scored {
  const f = String(r.field || "").trim();

  const isPrimaryCurrent = f === "currentUpdateText";
  const isPrimaryEvent = f === "upcomingEventTitle";
  const isPrimaryStory = f === "storyTitle";

  if (CURRENT_FIELDS.has(f)) {
    return { row: r, kind: "current", score: 500 + (isPrimaryCurrent ? 40 : 0) };
  }
  if (EVENT_FIELDS.has(f)) {
    return { row: r, kind: "event", score: 400 + (isPrimaryEvent ? 20 : 0) };
  }
  if (STORY_FIELDS.has(f)) {
    return { row: r, kind: "story", score: 300 + (isPrimaryStory ? 20 : 0) };
  }
  if (MEDIA_FIELDS.has(f)) {
    const mediaBoost =
      f === "currentHeadshotId" || f === "currentHeadshotUrl"
        ? 14
        : f === "featuredAlbumId"
        ? 12
        : f === "featuredReelId"
        ? 10
        : f === "featuredEventId"
        ? 8
        : 0;
    return { row: r, kind: "media", score: 200 + mediaBoost };
  }
  return { row: r, kind: "fallback", score: 100 };
}

function buildText(scored: Scored, live?: ProfileLiveRow): { label: string; text: string } {
  const f = scored.row.field;

  if (scored.kind === "current") {
    const t = String(
      f === "currentUpdateText" ? scored.row.after ?? "" : live?.currentUpdateText ?? ""
    ).trim();

    return {
      label: "Current Update",
      text: t || "Updated profile",
    };
  }

  if (scored.kind === "event") {
    const title = String(
      f === "upcomingEventTitle" ? scored.row.after ?? "" : live?.upcomingEventTitle ?? ""
    ).trim();

    return {
      label: "Upcoming Event",
      text: title ? `Added an event — ${title}` : "Updated an event",
    };
  }

  if (scored.kind === "story") {
    const title = String(f === "storyTitle" ? scored.row.after ?? "" : live?.storyTitle ?? "").trim();

    return {
      label: "Story Map",
      text: title ? `Added a story to the map — ${title}` : "Added a story to the map",
    };
  }

  if (scored.kind === "media") {
    const ff = scored.row.field;
    if (ff === "currentHeadshotId" || ff === "currentHeadshotUrl") {
      return { label: "Media", text: "Updated headshot" };
    }
    if (ff === "featuredAlbumId") {
      return { label: "Media", text: "Updated photo gallery" };
    }
    if (ff === "featuredReelId") {
      return { label: "Media", text: "Updated reel" };
    }
    if (ff === "featuredEventId") {
      return { label: "Media", text: "Updated event media" };
    }
    return { label: "Media", text: "Updated media" };
  }

  return { label: "Profile", text: "Updated profile" };
}

function normalizeIdentity(alumniId: string, live?: ProfileLiveRow) {
  const name = String(live?.name || "").trim() || "Unknown";
  const slug = String(live?.slug || "").trim() || String(alumniId || "").trim() || "unknown";
  return { name, slug };
}

export function buildCommunityFeedItems(
  changeRows: ProfileChangeRow[],
  liveById: Record<string, ProfileLiveRow | undefined>,
  limit = 5
): CommunityFeedItem[] {
  // ✅ HARD FILTER: never allow undone rows to participate
  const rows = (changeRows || []).filter(
    (r) => r && r.alumniId && r.field && !isNoOp(r) && !isTrue(r.isUndone)
  );

  // Group by alumniId
  const byPerson = new Map<string, ProfileChangeRow[]>();
  for (const r of rows) {
    const id = String(r.alumniId).trim();
    if (!id) continue;
    const arr = byPerson.get(id) ?? [];
    arr.push(r);
    byPerson.set(id, arr);
  }

  // Sort each person's rows newest-first
  for (const [id, arr] of byPerson) {
    arr.sort((a, b) => tsNum(b.ts) - tsNum(a.ts));
    byPerson.set(id, arr);
  }

  const used = new Set<string>();

  const chooseBest = (arr: ProfileChangeRow[], usedKeys?: Set<string>) => {
    let best: { scored: Scored; ts: number; key: string } | null = null;
    for (const r of arr) {
      // ✅ include isUndone in key (even though filtered), just to make collisions less likely
      const key = `${r.alumniId}::${r.ts}::${r.field}::${String(r.after ?? "")}::${norm(
        r.isUndone
      )}`;
      if (usedKeys?.has(key)) continue;

      const scored = scoreRow(r);
      const t = tsNum(r.ts);

      if (
        !best ||
        scored.score > best.scored.score ||
        (scored.score === best.scored.score && t > best.ts)
      ) {
        best = { scored, ts: t, key };
      }
    }
    return best;
  };

  // PASS 1: one per person
  const firstPass: CommunityFeedItem[] = [];
  for (const [alumniId, arr] of byPerson) {
    const pick = chooseBest(arr);
    if (!pick) continue;

    used.add(pick.key);

    const live = liveById[alumniId];
    const ident = normalizeIdentity(alumniId, live);
    const bt = buildText(pick.scored, live);

    firstPass.push({
      id: pick.scored.row.id ? String(pick.scored.row.id) : `${alumniId}::${pick.scored.row.ts}`,
      ts: pick.scored.row.ts,
      alumniId,
      name: ident.name,
      slug: ident.slug,
      label: bt.label,
      text: bt.text,
      kind: pick.scored.kind,
      field: pick.scored.row.field,
    });
  }

  firstPass.sort((a, b) => tsNum(b.ts) - tsNum(a.ts));
  const out: CommunityFeedItem[] = firstPass.slice(0, limit);

  if (out.length >= limit) return out;

  // Only run Pass 2 if there are fewer than `limit` unique people total
  if (byPerson.size >= limit) return out;

  const includedIds = out.map((x) => x.alumniId);

  const maxLoops = 25;
  let loops = 0;

  while (out.length < limit && loops < maxLoops) {
    loops++;

    const pool: { item: CommunityFeedItem; key: string; score: number; t: number }[] = [];

    for (const aid of includedIds) {
      const arr = byPerson.get(aid) ?? [];
      const pick = chooseBest(arr, used);
      if (!pick) continue;

      const live = liveById[aid];
      const ident = normalizeIdentity(aid, live);
      const bt = buildText(pick.scored, live);

      pool.push({
        key: pick.key,
        score: pick.scored.score,
        t: tsNum(pick.scored.row.ts),
        item: {
          id: pick.scored.row.id ? String(pick.scored.row.id) : `${aid}::${pick.scored.row.ts}`,
          ts: pick.scored.row.ts,
          alumniId: aid,
          name: ident.name,
          slug: ident.slug,
          label: bt.label,
          text: bt.text,
          kind: pick.scored.kind,
          field: pick.scored.row.field,
        },
      });
    }

    if (!pool.length) break;

    pool.sort((a, b) => b.score - a.score || b.t - a.t);

    const lastId = out[out.length - 1]?.alumniId;
    let chosen = pool[0];
    if (pool.length > 1 && chosen.item.alumniId === lastId) {
      const alt = pool.find((p) => p.item.alumniId !== lastId);
      if (alt) chosen = alt;
    }

    const counts = out.reduce<Record<string, number>>((acc, x) => {
      acc[x.alumniId] = (acc[x.alumniId] || 0) + 1;
      return acc;
    }, {});
    if ((counts[chosen.item.alumniId] ?? 0) >= 3) {
      const alt = pool.find((p) => (counts[p.item.alumniId] ?? 0) < 3);
      if (!alt) break;
      chosen = alt;
    }

    used.add(chosen.key);
    out.push(chosen.item);
  }

  return out.slice(0, limit);
}

/**
 * ✅ Dedicated Update Stream (tweet-style feed)
 * - Max 1 update per person
 * - Text comes from Profile-Live.currentUpdateText
 * - ts is the latest NON-UNDONE change timestamp for currentUpdateText (if available), else "0"
 * - id is ALWAYS present: `${alumniId}::${ts}` (required for undo)
 */
export type CommunityUpdateStreamItem = {
  id: string; // ✅ required so UIs can render undo affordances reliably
  ts: string;
  alumniId: string;
  name: string;
  slug: string;
  text: string;
};

export function buildCommunityUpdateStream(
  changeRows: ProfileChangeRow[],
  liveById: Record<string, ProfileLiveRow | undefined>,
  limit = 20
): CommunityUpdateStreamItem[] {
  const rows = (changeRows || [])
    .filter(
      (r) =>
        r &&
        r.alumniId &&
        r.field === "currentUpdateText" &&
        !isNoOp(r) &&
        !isTrue(r.isUndone)
    )
    .sort((a, b) => tsNum(b.ts) - tsNum(a.ts));

  // Latest update-ts per person
  const latestTsById = new Map<string, string>();
  const lastTextById = new Map<string, string>();

  for (const r of rows) {
    const aid = String(r.alumniId).trim();
    if (!aid) continue;

    if (!latestTsById.has(aid)) latestTsById.set(aid, r.ts);

    const after = String(r.after ?? "").trim();
    if (!after) continue;
    if (!lastTextById.has(aid)) lastTextById.set(aid, after);
  }

  const items: CommunityUpdateStreamItem[] = [];

  for (const [aid, live] of Object.entries(liveById || {})) {
    const alumniId = String(aid).trim();
    if (!alumniId) continue;

    const text = String(live?.currentUpdateText ?? "").trim();
    if (!text) continue;

    const ident = normalizeIdentity(alumniId, live);

    const ts = latestTsById.get(alumniId) ?? "0";
    const id = `${alumniId}::${ts}`;

    const last = lastTextById.get(alumniId);
    if (last && isNearDuplicate(text, last)) {
      // ok (kept for parity with your prior logic)
    }

    items.push({
      id,
      ts,
      alumniId,
      name: ident.name,
      slug: ident.slug,
      text,
    });
  }

  items.sort((a, b) => tsNum(b.ts) - tsNum(a.ts));
  return items.slice(0, limit);
}

/**
 * Optional alternate architecture (NOT USED in this repo):
 * A dedicated "updates" store (DB/sheet) for posts.
 *
 * This repo uses Profile-Changes + Profile-Live instead.
 * Undo ids are derived: `${alumniId}::${ts}`.
 */

export type CommunityUpdateRow = {
  id: string; // REQUIRED for undo
  ts: string; // ISO-ish timestamp
  alumniId: string;
  name: string;
  slug: string;
  text: string;
};

export function buildCommunityUpdateStreamFromUpdates(rows: CommunityUpdateRow[], limit = 20) {
  const byId = new Map<string, CommunityUpdateRow>();

  // newest-first
  const sorted = (rows || []).slice().sort((a, b) => tsNum(b.ts) - tsNum(a.ts));

  // ✅ max 1 per person (latest)
  for (const r of sorted) {
    const aid = String(r.alumniId || "").trim();
    if (!aid) continue;
    if (byId.has(aid)) continue;
    byId.set(aid, r);
  }

  const out = Array.from(byId.values())
    .sort((a, b) => tsNum(b.ts) - tsNum(a.ts))
    .slice(0, limit);

  return out.map((r) => ({
    id: String(r.id),
    ts: r.ts,
    alumniId: r.alumniId,
    name: r.name,
    slug: r.slug,
    text: r.text,
  })) as CommunityUpdateStreamItem[];
}
