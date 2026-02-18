import type { UploadKind } from "@/lib/uploader";

/* ---------- helpers ---------- */
export type PointerAssets = {
  currentHeadshotId?: string;
  featuredAlbumId?: string;
  featuredReelId?: string;
  featuredEventId?: string;
};

export const POINTER_MAP: Record<
  "headshot" | "album" | "reel" | "event",
  keyof PointerAssets
> = {
  headshot: "currentHeadshotId",
  album: "featuredAlbumId",
  reel: "featuredReelId",
  event: "featuredEventId",
};

// “Isabel Martínez” -> “isabel-martinez”
export function slugify(s: string) {
  return (s || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "")
    .trim();
}

export function alumniIdFromLookupPayload(j: any) {
  return String(j?.alumniId || "").trim();
}

export function slugFromLookupPayload(j: any) {
  return String(j?.canonicalSlug || "").trim();
}

/**
 * Identity rules:
 * - viewerAlumniId: signed-in user (permissions/authorship)
 * - targetAlumniId: profile being edited (admin impersonation via ?alumniId=)
 */
export function normalizeId(v: any) {
  const s = String(v ?? "").trim();
  return s || null;
}

export function resolveTargetAlumniId(args: {
  admin: boolean;
  viewerAlumniId: string | null;
  targetAlumniIdFromQuery: string | null;
}) {
  const { admin, viewerAlumniId, targetAlumniIdFromQuery } = args;

  // Only admins can impersonate via query param.
  if (admin && targetAlumniIdFromQuery) return targetAlumniIdFromQuery;

  // Everyone else edits themselves.
  return viewerAlumniId;
}

export function isImpersonating(args: {
  admin: boolean;
  viewerAlumniId: string | null;
  targetAlumniIdFromQuery: string | null;
  targetAlumniId: string | null;
}) {
  const { admin, viewerAlumniId, targetAlumniIdFromQuery, targetAlumniId } = args;
  return !!(
    admin &&
    viewerAlumniId &&
    targetAlumniIdFromQuery &&
    targetAlumniId &&
    targetAlumniId !== viewerAlumniId
  );
}

export function fileExtension(name: string) {
  const m = /\.[A-Za-z0-9]+$/.exec(name);
  return m ? m[0] : "";
}

export function renameForKind(
  file: File,
  kind: UploadKind,
  baseName: string,
  index = 1,
  albumName?: string
) {
  const ext = fileExtension(file.name) || "";
  const idx = String(index).padStart(3, "0");
  let newBase = baseName;

  if (kind === "headshot") {
    const stamp = Date.now(); // or crypto.randomUUID()
    newBase = `${baseName}-headshot-${stamp}`;
  }

  if (kind === "album") {
    const albumSlug = slugify(albumName || "gallery");
    newBase = `${baseName}-${albumSlug}-${idx}`;
  }
  if (kind === "reel") newBase = `${baseName}-reel-${idx}`;
  if (kind === "event") newBase = `${baseName}-event-${idx}`;

  const newName = `${newBase}${ext || ".bin"}`;
  try {
    return new File([file], newName, {
      type: file.type,
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}
