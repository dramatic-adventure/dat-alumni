// lib/csvUrls.ts

// Shared base for your published Google Sheet (never changes)
const PUBLISHED_BASE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzkIPStlL2TU7AHySD3Kw9CqBFTi1q6QW7N99ivE3FpofNhHlwWejU0LXeMOmnTawtmLCT71KWMU-F/pub";

function csvFromGid(gid: string | number) {
  return `${PUBLISHED_BASE}?gid=${gid}&single=true&output=csv`;
}

/**
 * Canonical CSV sources (move these OUT of Netlify env vars to avoid the AWS Lambda 4KB env limit).
 * AWS Lambda total env var size is capped at 4KB in aggregate. :contentReference[oaicite:0]{index=0}
 */
export const csvUrls = {
  // Profile sheets
  profileLive: csvFromGid(410281413),
  profileMedia: csvFromGid(149791049),
  profileChanges: csvFromGid(860918826),
  profileFolders: csvFromGid(1082982855),

  // Collections
  collections: csvFromGid(245900238),

  // Updates / promos / spotlights / albums
  updates: csvFromGid(1903489342),
  spotlights: csvFromGid(896645744),
  promos: csvFromGid(1367652845),
  journeyAlbums: csvFromGid(773913072),
  alumniUpdates: csvFromGid(473385592),

  // Stories + Map (you confirmed these are intentionally the same)
  stories: csvFromGid(582055134),
  cleanMapData: csvFromGid(582055134),

  // Drama club lead team
  dramaClubLeadTeam: csvFromGid(2095520301),
} as const;