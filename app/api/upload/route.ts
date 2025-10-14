import { NextResponse } from "next/server";
import { driveClient, sheetsClient } from "@/lib/googleClients";
import { getFolderIdForKind, MediaKind } from "@/lib/profileFolders";
import { PassThrough } from "stream";
import { requireAuth } from "@/lib/requireAuth";
import { rateLimit, rateKey } from "@/lib/rateLimit";

export const runtime = "nodejs";

/* ────────────────────────────────────────────────────────────────────────── */
/* Small types so TS is happy (we don't import full Google types)            */
/* ────────────────────────────────────────────────────────────────────────── */
type DriveCreateResp = { data: { id?: string } };
type DriveListResp = { data: { files?: Array<{ id: string; name: string }>; nextPageToken?: string } };

/* ────────────────────────────────────────────────────────────────────────── */
/* Utils                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */
function bufferToStream(buf: Buffer) {
  const s = new PassThrough();
  s.end(buf);
  return s;
}

function slugify(input: string) {
  return String(input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 120);
}

/* NEW: helpers for descriptive auto-rename */
function stripExt(filename: string) {
  const i = filename.lastIndexOf(".");
  return i === -1 ? filename : filename.slice(0, i);
}
function uniqueJoin(parts: string[]) {
  const out: string[] = [];
  for (const p of parts) {
    if (!p) continue;
    if (out.length && out[out.length - 1] === p) continue;
    out.push(p);
  }
  return out.join("-");
}
function isRedundantToken(tok: string) {
  return ["headshot", "reel", "event", "album", "image", "photo", "img"].includes(tok);
}

function safeExtFromMime(mime: string, fallback = ""): string {
  const m = mime.toLowerCase();
  if (m.includes("jpeg") || m.includes("jpg")) return ".jpg";
  if (m.includes("png")) return ".png";
  if (m.includes("webp")) return ".webp";
  if (m.includes("gif")) return ".gif";
  if (m.includes("heic")) return ".heic";
  if (m.includes("heif")) return ".heif";
  if (m.includes("mp4")) return ".mp4";
  if (m.includes("quicktime") || m.includes("mov")) return ".mov";
  if (m.includes("pdf")) return ".pdf";
  return fallback;
}

async function withRetry<T>(fn: () => Promise<T>, label: string, tries = 3, baseDelayMs = 250): Promise<T> {
  let lastErr: any;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      lastErr = e;
      const msg = String(e?.message || e);
      if (
        /ECONNRESET|ENOTFOUND|ETIMEDOUT|EPIPE|socket hang up|rateLimitExceeded|backendError|internalError/i.test(msg) &&
        attempt < tries
      ) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      break;
    }
  }
  throw new Error(`${label} failed: ${lastErr?.message || String(lastErr)}`);
}

function idxOf(header: string[], candidates: string[]) {
  const lower = header.map((h) => String(h || "").trim().toLowerCase());
  for (const c of candidates) {
    const i = lower.indexOf(c.toLowerCase());
    if (i !== -1) return i;
  }
  return -1;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Request parsing                                                           */
/* ────────────────────────────────────────────────────────────────────────── */
type UploadPayload = {
  alumniId: string;
  kind: MediaKind; // "headshot" | "album" | "reel" | "event"
  name: string;
  mimeType: string;
  buffer: Buffer;
  collectionId?: string;
  collectionTitle?: string; // aka albumName
  isFeatured?: string;      // "TRUE"/"FALSE"
  sortIndex?: string;
  note?: string;
  uploadedByEmail?: string;
  // aliases
  albumName?: string;
};

async function readUploadPayload(req: Request): Promise<UploadPayload> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Missing file (form field 'file')");
    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    return {
      alumniId: String(form.get("alumniId") || "").trim(),
      kind: String(form.get("kind") || "").trim() as MediaKind,
      name: String(form.get("name") || file.name || "upload"),
      mimeType: file.type || "application/octet-stream",
      buffer,
      collectionId: String(form.get("collectionId") || ""),
      collectionTitle: String(form.get("collectionTitle") || form.get("albumName") || ""),
      isFeatured: String(form.get("isFeatured") || ""),
      sortIndex: String(form.get("sortIndex") || ""),
      note: String(form.get("note") || ""),
      uploadedByEmail: String(form.get("uploadedByEmail") || ""),
    };
  } else {
    const body = (await req.json()) as any;
    if (!body?.data) throw new Error("Missing 'data' (base64) in JSON body");
    const base64: string = String(body.data).split(",").pop()!;
    const buffer = Buffer.from(base64, "base64");
    return {
      alumniId: String(body.alumniId || "").trim(),
      kind: String(body.kind || "").trim() as MediaKind,
      name: String(body.name || "upload"),
      mimeType: String(body.mimeType || "application/octet-stream"),
      buffer,
      collectionId: String(body.collectionId || ""),
      collectionTitle: String(body.collectionTitle || body.albumName || ""),
      isFeatured: String(body.isFeatured || ""),
      sortIndex: String(body.sortIndex || ""),
      note: String(body.note || ""),
      uploadedByEmail: String(body.uploadedByEmail || ""),
    };
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Sheets helpers                                                            */
/* ────────────────────────────────────────────────────────────────────────── */
const LIVE_ASSET_COL: Record<MediaKind, string> = {
  headshot: "currentHeadshotId",
  album: "featuredAlbumId",
  reel: "featuredReelId",
  event: "featuredEventId",
};

async function markLivePending(
  sheets: ReturnType<typeof sheetsClient>,
  spreadsheetId: string,
  alumniId: string,
  nowIso: string
) {
  const live = await withRetry(
    () => sheets.spreadsheets.values.get({ spreadsheetId, range: "Profile-Live!A:ZZ" }),
    "Sheets get Profile-Live"
  );
  const rows = live.data.values ?? [];
  const header = rows[0] ?? [];
  const idIdx = idxOf(header, ["alumniid", "slug", "alumni id"]);
  if (idIdx === -1) throw new Error(`Profile-Live missing "alumniId" header`);
  const statusIdx = idxOf(header, ["status"]);
  const updatedIdx = idxOf(header, ["updatedat", "updated at"]);
  const lastChangeIdx = idxOf(header, ["lastchangetype"]);

  let rowIndex = rows.findIndex((r, i) => i > 0 && String(r[idIdx] || "") === alumniId);

  if (rowIndex === -1) {
    rowIndex = rows.length;
    const newRow: string[] = Array(header.length).fill("");
    newRow[idIdx] = alumniId;
    if (statusIdx !== -1) newRow[statusIdx] = "pending";
    if (updatedIdx !== -1) newRow[updatedIdx] = nowIso;
    if (lastChangeIdx !== -1) newRow[lastChangeIdx] = "media";

    await withRetry(
      () =>
        sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Profile-Live!A${rowIndex + 1}:ZZ${rowIndex + 1}`,
          valueInputOption: "RAW",
          requestBody: { values: [newRow] },
        }),
      "Sheets update Profile-Live (create row)"
    );
  } else {
    const row = rows[rowIndex] as string[];
    if (statusIdx !== -1) row[statusIdx] = "pending";
    if (updatedIdx !== -1) row[updatedIdx] = nowIso;
    if (lastChangeIdx !== -1) row[lastChangeIdx] = "media";

    await withRetry(
      () =>
        sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Profile-Live!A${rowIndex + 1}:ZZ${rowIndex + 1}`,
          valueInputOption: "RAW",
          requestBody: { values: [row] },
        }),
      "Sheets update Profile-Live (mark pending)"
    );
  }
}

async function setLivePointerIfFeatured(
  sheets: ReturnType<typeof sheetsClient>,
  spreadsheetId: string,
  alumniId: string,
  kind: MediaKind,
  fileId: string,
  nowIso: string
) {
  const live = await withRetry(
    () => sheets.spreadsheets.values.get({ spreadsheetId, range: "Profile-Live!A:ZZ" }),
    "Sheets get Profile-Live"
  );
  const rows = live.data.values ?? [];
  const header = rows[0] ?? [];
  const idIdx = idxOf(header, ["alumniid", "slug", "alumni id"]);
  if (idIdx === -1) throw new Error(`Profile-Live missing "alumniId" header`);
  const statusIdx = idxOf(header, ["status"]);
  const updatedIdx = idxOf(header, ["updatedat", "updated at"]);
  const lastChangeIdx = idxOf(header, ["lastchangetype"]);
  const assetCol = LIVE_ASSET_COL[kind];
  const assetIdx = idxOf(header, [assetCol]);

  let rowIndex = rows.findIndex((r, i) => i > 0 && String(r[idIdx] || "") === alumniId);

  if (rowIndex === -1) {
    rowIndex = rows.length;
    const newRow: string[] = Array(header.length).fill("");
    newRow[idIdx] = alumniId;
    if (assetIdx !== -1) newRow[assetIdx] = fileId;
    if (statusIdx !== -1) newRow[statusIdx] = "pending";
    if (updatedIdx !== -1) newRow[updatedIdx] = nowIso;
    if (lastChangeIdx !== -1) newRow[lastChangeIdx] = "media";

    await withRetry(
      () =>
        sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Profile-Live!A${rowIndex + 1}:ZZ${rowIndex + 1}`,
          valueInputOption: "RAW",
          requestBody: { values: [newRow] },
        }),
      "Sheets update Profile-Live (create & set pointer)"
    );
  } else {
    const row = rows[rowIndex] as string[];
    if (assetIdx !== -1) row[assetIdx] = fileId;
    if (statusIdx !== -1) row[statusIdx] = "pending";
    if (updatedIdx !== -1) row[updatedIdx] = nowIso;
    if (lastChangeIdx !== -1) row[lastChangeIdx] = "media";

    await withRetry(
      () =>
        sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Profile-Live!A${rowIndex + 1}:ZZ${rowIndex + 1}`,
          valueInputOption: "RAW",
          requestBody: { values: [row] },
        }),
      "Sheets update Profile-Live (set pointer)"
    );
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* NEW: Display name helper for auto-rename                                  */
/* ────────────────────────────────────────────────────────────────────────── */
async function getDisplayNameSlug(
  sheets: ReturnType<typeof sheetsClient>,
  spreadsheetId: string,
  alumniId: string
): Promise<string> {
  // Try Profile-Live for a usable name column
  const res = await withRetry(
    () => sheets.spreadsheets.values.get({ spreadsheetId, range: "Profile-Live!A:ZZ" }),
    "Sheets get Profile-Live (for name)"
  );
  const rows = res.data.values ?? [];
  const header = rows[0] ?? [];
  const idIdx = idxOf(header, ["alumniid", "slug", "alumni id"]);
  const nameIdx =
    idxOf(header, ["name"]) !== -1
      ? idxOf(header, ["name"])
      : idxOf(header, ["displayname", "display name", "preferredname", "preferred name"]);

  if (idIdx !== -1 && nameIdx !== -1) {
    const row = rows.find((r, i) => i > 0 && String(r[idIdx] || "") === alumniId) as string[] | undefined;
    const val = row?.[nameIdx];
    if (val && val.trim()) return slugify(val);
  }
  // fallback to alumniId slug
  return slugify(alumniId);
}

/* ────────────────────────────────────────────────────────────────────────── */
/* NEW: Collections + folders                                                 */
/* ────────────────────────────────────────────────────────────────────────── */
function genCollectionId() {
  return `C-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

async function findOrCreateFolder(
  drive: ReturnType<typeof driveClient>,
  parentId: string,
  name: string
): Promise<string> {
  const q =
    `'${parentId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder' and name = '${name.replace(/'/g, "\\'")}'`;
  const list = (await withRetry(
    () => (drive.files.list as any)({ q, fields: "files(id,name)" }),
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

/**
 * Ensure row in Profile-Collections (your headers) and ensure Drive folder:
 * /albums/<alumniId>/<title>
 *
 * Headers: alumniId | driveFolderId | collectionId | kind | title | createdAt
 */
async function ensureCollection(
  sheets: ReturnType<typeof sheetsClient>,
  drive: ReturnType<typeof driveClient>,
  spreadsheetId: string,
  albumsRootId: string,
  alumniId: string,
  kind: MediaKind,
  title: string
): Promise<{ collectionId: string; driveFolderId: string }> {
  const res = await withRetry(
    () => sheets.spreadsheets.values.get({ spreadsheetId, range: "Profile-Collections!A:F" }),
    "Sheets get Profile-Collections"
  );
  const values = res.data.values ?? [];
  let header = values[0];

  // If the sheet is empty, initialize headers
  if (!header) {
    header = ["alumniId", "driveFolderId", "collectionId", "kind", "title", "createdAt"];
    await withRetry(
      () =>
        sheets.spreadsheets.values.update({
          spreadsheetId,
          range: "Profile-Collections!A1:F1",
          valueInputOption: "RAW",
          requestBody: { values: [header] },
        }),
      "Sheets init Profile-Collections header"
    );
  }

  const iAid = idxOf(header, ["alumniid", "slug", "alumni id"]);
  const iDrive = idxOf(header, ["drivefolderid", "drive folder id"]);
  const iCid = idxOf(header, ["collectionid", "collection id"]);
  const iKind = idxOf(header, ["kind"]);
  const iTitle = idxOf(header, ["title", "name"]);
  const iCreated = idxOf(header, ["createdat", "created at"]);

  if ([iAid, iDrive, iCid, iKind, iTitle, iCreated].some((i) => i === -1)) {
    throw new Error("Profile-Collections sheet missing required headers");
  }

  // Look for an existing row (alumniId + kind + title)
  const matchIndex = values.findIndex(
    (r, i) =>
      i > 0 &&
      String(r[iAid] || "") === alumniId &&
      String(r[iKind] || "") === kind &&
      String(r[iTitle] || "") === title
  );

  // Ensure Drive folders exist
  const artistFolderId = await findOrCreateFolder(drive, albumsRootId, alumniId);
  const albumFolderId = await findOrCreateFolder(drive, artistFolderId, title);

  if (matchIndex !== -1) {
    const row = values[matchIndex] as string[];
    // update driveFolderId if blank
    if (!row[iDrive]) {
      row[iDrive] = albumFolderId;
      await withRetry(
        () =>
          sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Profile-Collections!A${matchIndex + 1}:F${matchIndex + 1}`,
            valueInputOption: "RAW",
            requestBody: { values: [row] },
          }),
        "Sheets update Profile-Collections (fill driveFolderId)"
      );
    }
    return { collectionId: String(row[iCid] || ""), driveFolderId: albumFolderId };
  }

  const collectionId = genCollectionId();
  const nowIso = new Date().toISOString();
  const newRow: string[] = [];
  newRow[iAid] = alumniId;
  newRow[iDrive] = albumFolderId;
  newRow[iCid] = collectionId;
  newRow[iKind] = kind;
  newRow[iTitle] = title;
  newRow[iCreated] = nowIso;

  // Normalize row to header length
  for (let j = 0; j < header.length; j++) if (typeof newRow[j] === "undefined") newRow[j] = "";

  await withRetry(
    () =>
      sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Profile-Collections!A:F",
        valueInputOption: "RAW",
        requestBody: { values: [newRow] },
      }),
    "Sheets append Profile-Collections"
  );

  return { collectionId, driveFolderId: albumFolderId };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* NEW: Auto-rename helper                                                   */
/* ────────────────────────────────────────────────────────────────────────── */
async function nextSequenceName(
  drive: ReturnType<typeof driveClient>,
  parentFolderId: string,
  base: string,
  ext: string
): Promise<string> {
  // Find existing files in this folder whose name starts with `${base}-`
  const q =
    `'${parentFolderId}' in parents and trashed = false and name contains '${base.replace(/'/g, "\\'")}-'`;
  let pageToken: string | undefined;
  let maxN = 0;

  do {
    const resp = (await withRetry(
      () => (drive.files.list as any)({ q, fields: "files(id,name),nextPageToken", pageToken }),
      "Drive list for sequence"
    )) as DriveListResp;

    for (const f of resp.data.files || []) {
      const m = f.name.match(new RegExp(`^${base.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}-([0-9]{3})`, "i"));
      if (m) {
        const n = parseInt(m[1], 10);
        if (!Number.isNaN(n) && n > maxN) maxN = n;
      }
    }
    pageToken = resp.data.nextPageToken;
  } while (pageToken);

  const next = (maxN + 1).toString().padStart(3, "0");
  return `${base}-${next}${ext}`;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Profile-Media flag flipping                                               */
/* ────────────────────────────────────────────────────────────────────────── */
type ValueRange = { range: string; values: string[][] };

async function setFeaturedInMediaBatch(
  sheets: ReturnType<typeof sheetsClient>,
  spreadsheetId: string,
  kind: MediaKind,
  alumniId: string,
  fileIdJustAppended: string
) {
  const media = await withRetry(
    () => sheets.spreadsheets.values.get({ spreadsheetId, range: "Profile-Media!A:L" }),
    "Sheets get Profile-Media"
  );
  const mRows = media.data.values ?? [];
  const [mh, ...rows] = mRows;
  if (!mh) return;

  const idxAid = mh.indexOf("alumniId");
  const idxKind = mh.indexOf("kind");
  const idxFile = mh.indexOf("fileId");
  const idxIsCur = mh.indexOf("isCurrent");
  const idxIsFeat = mh.indexOf("isFeatured");
  if (idxAid === -1 || idxKind === -1 || idxFile === -1) return;

  const flagColIdx = kind === "headshot" ? idxIsCur : idxIsFeat;
  if (flagColIdx === -1) return;

  const targetRowIndices: number[] = [];
  let newRowIndex: number | null = null;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] as string[];
    if (r[idxAid] === alumniId && r[idxKind] === kind) {
      targetRowIndices.push(i);
      if (r[idxFile] === fileIdJustAppended) newRowIndex = i;
    }
  }
  if (newRowIndex == null) return;

  const updates: ValueRange[] = [];
  const newRow = rows[newRowIndex] as string[];
  while (newRow.length < mh.length) newRow.push("");
  newRow[flagColIdx] = "TRUE";
  updates.push({ range: `Profile-Media!A${newRowIndex + 2}:L${newRowIndex + 2}`, values: [newRow] });

  for (const i of targetRowIndices) {
    if (i === newRowIndex) continue;
    const row = rows[i] as string[];
    while (row.length < mh.length) row.push("");
    if (row[flagColIdx] === "TRUE") {
      row[flagColIdx] = "FALSE";
      updates.push({ range: `Profile-Media!A${i + 2}:L${i + 2}`, values: [row] });
    }
  }

  if (updates.length) {
    await withRetry(
      () =>
        sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          requestBody: { data: updates, valueInputOption: "RAW" },
        }),
      "Sheets batchUpdate Profile-Media (feature flip)"
    );
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Route                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */
export async function POST(req: Request) {
  try {
    // rate limit
    const key = rateKey(req);
    if (!rateLimit(key, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // auth
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const spreadsheetId = process.env.ALUMNI_SHEET_ID!;
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Missing ALUMNI_SHEET_ID" }, { status: 500 });
    }

    const payload = await readUploadPayload(req);
    let {
      alumniId: slugRaw,
      kind,
      name,
      mimeType,
      buffer,
      collectionId,
      collectionTitle,
      isFeatured,
      sortIndex,
      note,
      uploadedByEmail,
    } = payload;

    const alumniId = String(slugRaw || "").trim().toLowerCase();
    if (!alumniId) return NextResponse.json({ error: "alumniId is required" }, { status: 400 });
    if (!["headshot", "album", "reel", "event"].includes(kind))
      return NextResponse.json({ error: "kind must be one of headshot|album|reel|event" }, { status: 400 });

    const uploaderEmail = String(uploadedByEmail || auth.email || "");

    // size + mime
    const MAX_BYTES = 1024 * 1024 * 1024; // 1GB
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }
    const allowed = new Set([
      "image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif",
      "video/mp4", "video/quicktime",
      "application/pdf",
      "application/octet-stream",
    ]);
    if (!allowed.has(mimeType)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    }

    const drive = driveClient();
    const sheets = sheetsClient();
    const nowIso = new Date().toISOString();

    // figure parent root by kind
    const kindRootFolderId = getFolderIdForKind(kind);

    // ensure per-artist subfolder under kind root
    const artistFolderId = await findOrCreateFolder(drive, kindRootFolderId, alumniId);

    // For albums, also ensure a collection row + album folder under /albums/<alumniId>/<title>
    let parentForUpload = artistFolderId;
    if (kind === "album") {
      const title = String(collectionTitle || "").trim();
      if (title) {
        try {
          const ensured = await ensureCollection(
            sheets, drive, spreadsheetId, kindRootFolderId, alumniId, kind, title
          );
          collectionId = collectionId || ensured.collectionId;
          collectionTitle = title;
          parentForUpload = ensured.driveFolderId; // upload directly into album folder
        } catch (err: any) {
          console.warn("Collection ensure failed:", err?.message || err);
          // fall back to artist folder under /albums
          parentForUpload = artistFolderId;
        }
      }
    }

    /* ── Auto-rename: artist + (kind/album) + original base (optional) ───── */
    const nameSlug = await getDisplayNameSlug(sheets, spreadsheetId, alumniId);
    const albumSlug = kind === "album" ? slugify(String(collectionTitle || "")) : "";

    // original base (no ext), slugified & trimmed; keep if actually descriptive
    const origBaseSlugFull = slugify(stripExt(name));
    const origBaseSlug = origBaseSlugFull.slice(0, 40);

    const kindToken = kind === "album" ? "" : kind;

    const parts: string[] = [nameSlug];
    if (kind === "album") {
      if (albumSlug) parts.push(albumSlug);
    } else {
      parts.push(kindToken);
    }
    if (origBaseSlug && !isRedundantToken(origBaseSlug)) {
      if (kind === "album") {
        if (origBaseSlug !== albumSlug) parts.push(origBaseSlug);
      } else {
        if (origBaseSlug !== kindToken) parts.push(origBaseSlug);
      }
    }

    const base = uniqueJoin(parts);
    const ext = safeExtFromMime(mimeType, "");
    const autoName = await nextSequenceName(drive, parentForUpload, base, ext || "");

    // 1) Upload to Drive WITH auto-renamed file name
    const createRes = (await withRetry(
      () =>
        (drive.files.create as any)({
          requestBody: { name: autoName, parents: [parentForUpload] },
          media: { mimeType, body: bufferToStream(buffer) },
          fields: "id",
          supportsAllDrives: true,
        }),
      "Drive upload"
    )) as DriveCreateResp;
    const fileId = createRes.data.id!;

    // 2) Append to Profile-Media
    await withRetry(
      () =>
        sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "Profile-Media!A:L",
          valueInputOption: "RAW",
          requestBody: {
            values: [
              [
                alumniId,                 // A: alumniId
                kind,                     // B: kind
                collectionId ?? "",       // C: collectionId
                collectionTitle ?? "",    // D: collectionTitle
                fileId,                   // E: fileId
                "",                       // F: externalUrl
                uploaderEmail,            // G: uploadedByEmail
                nowIso,                   // H: uploadedAt
                "",                       // I: isCurrent (set in batch for headshot)
                "",                       // J: isFeatured (set in batch)
                sortIndex ?? "",          // K: sortIndex
                note ?? "",               // L: note
              ],
            ],
          },
        }),
      "Sheets append Profile-Media"
    );

    // 3) mark Profile-Live pending
    await markLivePending(sheets, spreadsheetId, alumniId, nowIso);

    // 4) feature logic (default TRUE unless explicitly "FALSE")
    const shouldFeature = (isFeatured ? String(isFeatured).toUpperCase() : "TRUE") === "TRUE";
    let liveUpdatedCol: string | undefined;
    if (shouldFeature) {
      await setFeaturedInMediaBatch(sheets, spreadsheetId, kind, alumniId, fileId);
      await setLivePointerIfFeatured(sheets, spreadsheetId, alumniId, kind, fileId, nowIso);
      liveUpdatedCol = LIVE_ASSET_COL[kind];
    }

    return NextResponse.json({
      ok: true,
      fileId,
      fileName: autoName,
      status: "pending",
      collectionId: collectionId || "",
      collectionTitle: collectionTitle || "",
      ...(liveUpdatedCol ? { updated: { [liveUpdatedCol]: fileId } } : {}),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("UPLOAD ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
