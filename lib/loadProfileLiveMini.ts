import "server-only";
import { cache } from "react";
import { sheetsClient } from "@/lib/googleClients";

type LiveMini = {
  alumniId: string;
  name: string;
  slug: string;
  currentUpdateText?: string;

  upcomingEventTitle?: string;
  storyTitle?: string;

  // Media pointers (optional for labeling)
  currentHeadshotId?: string;
  currentHeadshotUrl?: string;
  featuredAlbumId?: string;
  featuredReelId?: string;
  featuredEventId?: string;
};

const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";
const LIVE_TAB = process.env.ALUMNI_LIVE_TAB || "Profile-Live";

function idxOf(header: string[], key: string) {
  const i = header.findIndex((h) => String(h || "").trim().toLowerCase() === key.toLowerCase());
  return i;
}

function cell(row: any[], idx: number) {
  return idx >= 0 ? String(row?.[idx] ?? "").trim() : "";
}

export const loadProfileLiveMini = cache(async (): Promise<Record<string, LiveMini>> => {
  if (!spreadsheetId) throw new Error("Missing ALUMNI_SHEET_ID");

  const sheets = sheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${LIVE_TAB}!A:ZZ`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const all = (res.data.values ?? []) as any[][];
  if (!all.length) return {};

  const header = (all[0] ?? []).map((h) => String(h ?? "").trim());
  const rows = all.slice(1);

  const alumniIdIdx = idxOf(header, "alumniId");
  const nameIdx = idxOf(header, "name");
  const slugIdx = idxOf(header, "slug");

  const currentUpdateTextIdx = idxOf(header, "currentUpdateText");
  const upcomingEventTitleIdx = idxOf(header, "upcomingEventTitle");
  const storyTitleIdx = idxOf(header, "storyTitle");

  const currentHeadshotIdIdx = idxOf(header, "currentHeadshotId");
  const currentHeadshotUrlIdx = idxOf(header, "currentHeadshotUrl");
  const featuredAlbumIdIdx = idxOf(header, "featuredAlbumId");
  const featuredReelIdIdx = idxOf(header, "featuredReelId");
  const featuredEventIdIdx = idxOf(header, "featuredEventId");

  const out: Record<string, LiveMini> = {};

  for (const r of rows) {
    const alumniId = cell(r, alumniIdIdx);
    if (!alumniId) continue;

    const name = cell(r, nameIdx) || "Unknown";
    const slug = cell(r, slugIdx) || alumniId;

    out[alumniId] = {
      alumniId,
      name,
      slug,
      currentUpdateText: cell(r, currentUpdateTextIdx) || undefined,
      upcomingEventTitle: cell(r, upcomingEventTitleIdx) || undefined,
      storyTitle: cell(r, storyTitleIdx) || undefined,

      currentHeadshotId: cell(r, currentHeadshotIdIdx) || undefined,
      currentHeadshotUrl: cell(r, currentHeadshotUrlIdx) || undefined,
      featuredAlbumId: cell(r, featuredAlbumIdIdx) || undefined,
      featuredReelId: cell(r, featuredReelIdIdx) || undefined,
      featuredEventId: cell(r, featuredEventIdIdx) || undefined,
    };
  }

  return out;
});
