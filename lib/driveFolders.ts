// lib/driveFolders.ts
import { PassThrough } from "stream";
import { MediaKind, envOrThrow } from "./profileFolders";
import { driveClient } from "./googleClients";
import { withRetry } from "./sheetsResilience";

/* Small types so TS is happy (we don't import full Google types). */
type DriveCreateResp = { data: { id?: string } };
type DriveListResp = {
  data: { files?: Array<{ id: string; name: string }>; nextPageToken?: string };
};

/** Wrap a Buffer as a readable stream for Drive's `media.body`. */
export function bufferToStream(buf: Buffer) {
  const s = new PassThrough();
  s.end(buf);
  return s;
}

/**
 * Find a Drive folder named `name` under `parentId`, creating it if absent.
 * Shared by the public media upload route and the Field Kit capture route.
 */
export async function findOrCreateFolder(
  drive: ReturnType<typeof driveClient>,
  parentId: string,
  name: string
): Promise<string> {
  const q = `'${parentId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder' and name = '${name.replace(
    /'/g,
    "\\'"
  )}'`;

  const list = (await withRetry(
    () =>
      (drive.files.list as any)({
        q,
        fields: "files(id,name)",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      }),
    "Drive list folder"
  )) as DriveListResp;

  const existing = list.data.files?.[0];
  if (existing?.id) return existing.id;

  const created = (await withRetry(
    () =>
      (drive.files.create as any)({
        requestBody: {
          name,
          parents: [parentId],
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
        supportsAllDrives: true,
      }),
    "Drive create folder"
  )) as DriveCreateResp;

  return created.data.id!;
}

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
