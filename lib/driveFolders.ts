// lib/driveFolders.ts
import { MediaKind, envOrThrow } from "./profileFolders";

export const DRIVE_FOLDERS = {
  headshot: () => envOrThrow("DRIVE_PUBLIC_HEADSHOTS_FOLDER_ID"),
  album: () => envOrThrow("DRIVE_PUBLIC_ALBUMS_FOLDER_ID"),
  reel: () => envOrThrow("DRIVE_PUBLIC_REELS_FOLDER_ID"),
  event: () => envOrThrow("DRIVE_PUBLIC_EVENTS_FOLDER_ID"),
};

export function parentFolderForKind(kind: MediaKind): string {
  switch (kind) {
    case "album":
      return DRIVE_FOLDERS.album();
    case "reel":
      return DRIVE_FOLDERS.reel();
    case "event":
      return DRIVE_FOLDERS.event();
    case "headshot":
    default:
      return DRIVE_FOLDERS.headshot();
  }
}
