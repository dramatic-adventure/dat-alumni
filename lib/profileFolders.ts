// lib/profileFolders.ts
export type MediaKind = "headshot" | "album" | "reel" | "event";

export function getFolderIdForKind(kind: MediaKind): string {
  switch (kind) {
    case "album":
      return envOrThrow("DRIVE_PUBLIC_ALBUMS_FOLDER_ID");
    case "reel":
      return envOrThrow("DRIVE_PUBLIC_REELS_FOLDER_ID");
    case "event":
      return envOrThrow("DRIVE_PUBLIC_EVENTS_FOLDER_ID");
    case "headshot":
    default:
      return envOrThrow("DRIVE_PUBLIC_HEADSHOTS_FOLDER_ID");
  }
}

export function envOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}
