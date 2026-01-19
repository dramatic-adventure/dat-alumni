// /app/alumni/page.tsx
import "server-only";

import { Suspense } from "react";
import AlumniPage from "@/components/alumni/AlumniPage";
import { getFeaturedAlumni } from "@/lib/featuredAlumni";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import { getRecentUpdates } from "@/lib/getRecentUpdates";
import { sheetsClient } from "@/lib/googleClients";
import { enrichAlumniData } from "@/components/alumni/AlumniSearch/enrichAlumniData.server";
import type {
  ProfileLiveRow,
  EnrichedProfileLiveRow,
} from "@/components/alumni/AlumniSearch/enrichAlumniData.server";

/**
 * ✅ Let this page use ISR so Next can prefetch and cache
 *    the RSC payloads for detail routes. This makes client
 *    navigation feel instant.
 */
export const revalidate = 300; // 5 minutes

// Shape AlumniPage expects
type HighlightItem = {
  name: string;
  slug: string;
  roles?: string[];
  headshotUrl?: string;
};

type AlumniCardItem = {
  name: string;
  slug: string;
  roles: string[];
  headshotUrl: string;
};

type UpdateItem = {
  text: string;
  link: string;
  author: string;
};

// ------------------------------
// Simple in-memory cache (per server process)
// Prevents Sheets read quota explosions in dev + prefetch.
// ------------------------------
type ProfileLiveCache = {
  at: number;
  rows: ProfileLiveRow[];
};

const CACHE_KEY = "__DAT_PROFILELIVE_PUBLIC_CACHE__";
const CACHE_TTL_MS = 6 * 60 * 1000; // 6 minutes (slightly > revalidate to reduce bursty reads)

function getProfileLiveCache(): ProfileLiveCache | null {
  const g = globalThis as any;
  return (g[CACHE_KEY] as ProfileLiveCache) || null;
}

function setProfileLiveCache(v: ProfileLiveCache) {
  const g = globalThis as any;
  g[CACHE_KEY] = v;
}

function isQuotaError(err: unknown) {
  const msg = String((err as any)?.message || err || "").toLowerCase();
  const code = (err as any)?.code;
  return (
    msg.includes("quota exceeded") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    code === 429
  );
}

// ✅ small helpers
function idxOf(header: string[], candidates: string[]) {
  const lower = header.map((h) => String(h || "").trim().toLowerCase());
  for (const c of candidates) {
    const i = lower.indexOf(c.toLowerCase());
    if (i !== -1) return i;
  }
  return -1;
}

function truthy(v: unknown) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "yes" || s === "y" || s === "1" || s === "✓" || s === "checked";
}

function cell(r: any[], idx: number) {
  return idx !== -1 ? String(r?.[idx] ?? "").trim() : "";
}

/**
 * ✅ Read Profile-Live rows (public only) into the shape that enrichAlumniData expects.
 */
async function loadProfileLiveRowsPublic(): Promise<ProfileLiveRow[]> {
  // ✅ serve from cache if fresh
  const cached = getProfileLiveCache();
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.rows;

  const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";
  if (!spreadsheetId) throw new Error("Missing ALUMNI_SHEET_ID");

  const LIVE_TAB = process.env.ALUMNI_LIVE_TAB || "Profile-Live";

  try {
    const sheets = sheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${LIVE_TAB}!A:ZZ`,
      valueRenderOption: "UNFORMATTED_VALUE",
    });

    const all = (res.data.values ?? []) as any[][];
    if (!all.length) {
      setProfileLiveCache({ at: Date.now(), rows: [] });
      return [];
    }

    const header = (all[0] ?? []).map((h) => String(h ?? "").trim());
    const rows = all.slice(1);

    // Indices we care about (tolerant)
    const slugIdx = idxOf(header, ["slug", "profile slug", "profile-slug"]);
    const nameIdx = idxOf(header, ["name", "full name"]);
    const alumniIdIdx = idxOf(header, ["alumniid", "alumni id"]);
    const emailIdx = idxOf(header, ["email", "email address"]);

    const pronounsIdx = idxOf(header, ["pronouns"]);
    const rolesIdx = idxOf(header, ["roles", "role", "primary role"]);
    const locationIdx = idxOf(header, ["location", "based in", "currently based in"]);
    const currentWorkIdx = idxOf(header, ["currentwork", "current work"]);

    const bioShortIdx = idxOf(header, ["bioshort", "bio short", "short bio"]);
    const bioLongIdx = idxOf(header, ["biolong", "bio long", "bio", "artist statement", "artiststatement"]);

    const websiteIdx = idxOf(header, ["website", "site", "portfolio", "portfolio url"]);
    const instagramIdx = idxOf(header, ["instagram"]);
    const youtubeIdx = idxOf(header, ["youtube"]);
    const vimeoIdx = idxOf(header, ["vimeo"]);
    const imdbIdx = idxOf(header, ["imdb"]);

    const spotlightIdx = idxOf(header, ["spotlight"]);

    const programsIdx = idxOf(header, ["programs", "program badges", "project badges", "badges"]);
    const tagsIdx = idxOf(header, ["tags", "identity tags", "identity"]);
    const statusFlagsIdx = idxOf(header, ["statusflags", "status flags", "flags"]);
    const statusIdx = idxOf(header, ["status"]);
    const isPublicIdx = idxOf(header, ["ispublic", "is public", "show on profile?", "show on profile"]);
    const updatedAtIdx = idxOf(header, ["updatedat", "updated at", "lastmodified", "last modified"]);

    const currentHeadshotIdIdx = idxOf(header, ["currentheadshotid", "current headshot id"]);
    const currentHeadshotUrlIdx = idxOf(header, ["currentheadshoturl", "current headshot url", "headshot url"]);

    const featuredAlbumIdIdx = idxOf(header, ["featuredalbumid", "featured album id"]);
    const featuredReelIdIdx = idxOf(header, ["featuredreelid", "featured reel id"]);
    const featuredEventIdIdx = idxOf(header, ["featuredeventid", "featured event id"]);

    const languagesIdx = idxOf(header, ["languages", "language", "spoken languages"]);

    const out: ProfileLiveRow[] = [];

    for (const r of rows) {
      const isPublic = isPublicIdx !== -1 ? truthy(r?.[isPublicIdx]) : false;
      if (!isPublic) continue;

      const slug = cell(r, slugIdx).toLowerCase();
      const name = cell(r, nameIdx);
      if (!slug || !name) continue;

      out.push({
        name,
        slug,

        alumniId: cell(r, alumniIdIdx) || undefined,
        email: cell(r, emailIdx) || undefined,

        pronouns: cell(r, pronounsIdx) || undefined,
        roles: cell(r, rolesIdx) || undefined,
        location: cell(r, locationIdx) || undefined,
        currentWork: cell(r, currentWorkIdx) || undefined,

        bioShort: cell(r, bioShortIdx) || undefined,
        bioLong: cell(r, bioLongIdx) || undefined,

        website: cell(r, websiteIdx) || undefined,
        instagram: cell(r, instagramIdx) || undefined,
        youtube: cell(r, youtubeIdx) || undefined,
        vimeo: cell(r, vimeoIdx) || undefined,
        imdb: cell(r, imdbIdx) || undefined,

        spotlight: cell(r, spotlightIdx) || undefined,

        programs: cell(r, programsIdx) || undefined,
        tags: cell(r, tagsIdx) || undefined,
        statusFlags: cell(r, statusFlagsIdx) || undefined,

        isPublic: isPublic ? "true" : "false",
        status: cell(r, statusIdx) || undefined,
        updatedAt: cell(r, updatedAtIdx) || undefined,

        currentHeadshotId: cell(r, currentHeadshotIdIdx) || undefined,
        currentHeadshotUrl: cell(r, currentHeadshotUrlIdx) || undefined,

        featuredAlbumId: cell(r, featuredAlbumIdIdx) || undefined,
        featuredReelId: cell(r, featuredReelIdIdx) || undefined,
        featuredEventId: cell(r, featuredEventIdIdx) || undefined,

        languages: cell(r, languagesIdx) || undefined,
      });
    }

    setProfileLiveCache({ at: Date.now(), rows: out });
    return out;
  } catch (err) {
    // ✅ If we hit quota, return last known cache if available
    if (isQuotaError(err)) {
      const stale = getProfileLiveCache();
      if (stale) return stale.rows;
      console.warn("Sheets quota exceeded for Profile-Live; returning empty dataset.");
      return [];
    }
    throw err;
  }
}

export default async function Alumni() {
  const { highlights } = await getFeaturedAlumni();
  const alumni = await loadVisibleAlumni();

  const safeHighlights: HighlightItem[] = (Array.isArray(highlights) ? highlights : [])
    .map((h: any) => ({
      name: String(h?.name ?? h?.title ?? "").trim(),
      slug: String(h?.slug ?? "").trim(),
      roles: Array.isArray(h?.roles) ? (h.roles as string[]) : [],
      headshotUrl:
        typeof h?.headshotUrl === "string"
          ? h.headshotUrl
          : typeof h?.image === "string"
          ? h.image
          : undefined,
    }))
    .filter((h) => h.name && h.slug);

  const alumniData: AlumniCardItem[] = alumni.map((a) => ({
    name: a.name,
    slug: a.slug,
    roles: a.roles || [],
    headshotUrl: a.headshotUrl || "",
  }));

  const initialUpdates: UpdateItem[] = getRecentUpdates(alumni).map((u: any) => ({
    text: u.message || "Update coming soon...",
    link: `/alumni/${u.slug}`,
    author: u.name || "ALUM",
  }));

  // ✅ NEW: Profile-Live → enrich → pass to client for search
  const profileLiveRows = await loadProfileLiveRowsPublic();
  const enrichedData: EnrichedProfileLiveRow[] = await enrichAlumniData(profileLiveRows);

  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <AlumniPage
        highlights={safeHighlights}
        alumniData={alumniData}
        initialUpdates={initialUpdates.slice(0, 5)}
        enrichedData={enrichedData}
      />
    </Suspense>
  );
}
