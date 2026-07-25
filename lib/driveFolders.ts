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
 * Per-instance memo of resolved folder ids, keyed `<parentId>/<name>`.
 *
 * A Field Kit capture resolves TWO folders (program, then author) before it can
 * upload, and every resolution is a Drive round trip. Those ids never change
 * once created, so re-looking them up on each request spent two of the ten
 * seconds a synchronous Netlify function used to get — time that a ~1.5 MB
 * voice upload badly needed (see the timeout note in netlify.toml).
 *
 * Cached on globalThis so it survives per warm Lambda instance, matching the
 * pattern in lib/notificationSecrets.ts. Safe because the mapping is stable; if
 * a folder is deleted out from under us the next create simply repopulates it.
 */
const FOLDER_CACHE_KEY = "__datDriveFolderIds";
function folderCache(): Map<string, string> {
  const g = globalThis as typeof globalThis & { [FOLDER_CACHE_KEY]?: Map<string, string> };
  if (!g[FOLDER_CACHE_KEY]) g[FOLDER_CACHE_KEY] = new Map();
  return g[FOLDER_CACHE_KEY];
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
  const cacheKey = `${parentId}/${name}`;
  const cached = folderCache().get(cacheKey);
  if (cached) return cached;

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
  if (existing?.id) {
    folderCache().set(cacheKey, existing.id);
    return existing.id;
  }

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

  const createdId = created.data.id!;
  folderCache().set(cacheKey, createdId);
  return createdId;
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
