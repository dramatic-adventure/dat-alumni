// app/api/field-kit/capture/route.ts
//
// Field Kit "Capture" — note/quote (Slice A) + photo (Slice B1) + voice (Slice
// B2), online only. Appends one row to the Field-Captures tab in the
// ALUMNI_SHEET_ID workbook.
//
// Trust model (defense in depth — never trust the layout/middleware for a direct
// API hit): this route re-runs the SAME access resolver the pages use, derives
// BOTH programId and authorSlug server-side, and ignores any programId/authorSlug
// sent in the body. The kit is multi-program, so programId comes from the
// verified access record — never a constant.
//
// Idempotency: the client mints a ULID captureId; we scan column A for it and
// no-op if it already landed, so a retried POST never double-writes. For photos
// the dedup scan runs BEFORE any Drive upload, so a retry never re-uploads bytes.
//
// Privacy: captures are PRIVATE to their author. Photo/voice bytes live in Drive
// under DRIVE_CAPTURES_FOLDER_ID/<programId>/<authorSlug>/ and are served only
// through the authorized route app/api/field-kit/capture/media/[fileId] — never
// the public /api/media/thumb.
//
// Slice C (deferred): the offline queue.

import { NextResponse } from "next/server";
import { driveClient, sheetsClient } from "@/lib/googleClients";
import { findOrCreateFolder, bufferToStream } from "@/lib/driveFolders";
import { envOrThrow } from "@/lib/profileFolders";
import { normalizeUploadImage } from "@/lib/normalizeUploadImage";
import { rateLimit, rateKey } from "@/lib/rateLimit";
import { getFieldKitAccess, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { withRetry, idxOf, normId } from "@/lib/sheetsResilience";

export const runtime = "nodejs";

type DriveCreateResp = { data: { id?: string } };

// A:N since Slice 6 (chapterId + visibility appended); columns resolve by header
// NAME, so a sheet still on the old 12-column header keeps working — the new
// fields just don't land until the header gains the columns.
const FIELD_CAPTURES_RANGE = "Field-Captures!A:N";
const VALID_KINDS = new Set(["note", "quote", "photo", "voice"]);

// File uploads (photo + voice) are bounded server-side regardless of what the
// client sends.
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

// iOS Safari MediaRecorder emits audio/mp4; Chrome/Android audio/webm — allow both.
const ALLOWED_AUDIO_MIME = new Set([
  "audio/mp4",
  "audio/aac",
  "audio/mpeg",
  "audio/ogg",
  "audio/webm",
  "audio/wav",
]);

function extFromMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes("jpeg") || m.includes("jpg")) return "jpg";
  if (m.includes("png")) return "png";
  if (m.includes("webp")) return "webp";
  if (m.includes("gif")) return "gif";
  if (m.includes("heic")) return "heic";
  if (m.includes("heif")) return "heif";
  if (m.includes("mp4")) return "m4a";
  if (m.includes("aac")) return "aac";
  if (m.includes("mpeg")) return "mp3";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("webm")) return "webm";
  if (m.includes("wav")) return "wav";
  return "bin";
}

type CapturePayload = {
  captureId: string;
  kind: string;
  bodyText: string;
  createdAt: string;
  dayIndex: string;
  chapterId: string;
  visibility: string;
  quoteSpeaker: string;
  asId?: string;
  // Photo (multipart) only:
  file?: { buffer: Buffer; mimeType: string; name: string };
};

// Mirror /api/upload's dual-mode parsing: multipart/form-data (photo + fields)
// OR the existing JSON path for note/quote.
async function readPayload(req: Request): Promise<CapturePayload> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const f = form.get("file");
    const file =
      f instanceof File
        ? {
            buffer: Buffer.from(await f.arrayBuffer()),
            mimeType: f.type || "application/octet-stream",
            name: f.name || "photo",
          }
        : undefined;
    return {
      captureId: String(form.get("captureId") ?? "").trim(),
      kind: String(form.get("kind") ?? "").trim().toLowerCase(),
      bodyText: String(form.get("bodyText") ?? "").trim(),
      createdAt: String(form.get("createdAt") ?? "").trim(),
      dayIndex: String(form.get("dayIndex") ?? "").trim(),
      chapterId: String(form.get("chapterId") ?? "").trim(),
      visibility: String(form.get("visibility") ?? "").trim().toLowerCase(),
      quoteSpeaker: String(form.get("quoteSpeaker") ?? "").trim(),
      asId: String(form.get("asId") ?? "").trim() || undefined,
      file,
    };
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) throw new Error("Invalid JSON body");
  return {
    captureId: String(body.captureId ?? "").trim(),
    kind: String(body.kind ?? "").trim().toLowerCase(),
    bodyText: String(body.bodyText ?? "").trim(),
    createdAt: String(body.createdAt ?? "").trim(),
    dayIndex: String(body.dayIndex ?? "").trim(),
    chapterId: String(body.chapterId ?? "").trim(),
    visibility: String(body.visibility ?? "").trim().toLowerCase(),
    quoteSpeaker: String(body.quoteSpeaker ?? "").trim(),
    asId: String(body.asId ?? "").trim() || undefined,
  };
}

export async function POST(req: Request) {
  try {
    if (!rateLimit(rateKey(req), 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const payload = await readPayload(req);
    const asId = payload.asId;

    // Same gate the pages use. Signed-out → 401, not on this roster → 403. When an
    // admin passes asId, the write attributes to the impersonated roster member.
    const access = await getFieldKitAccess(FIELD_KIT_PROGRAM_ID, asId);
    if (!access.allowed) {
      const status = access.reason === "signed-out" ? 401 : 403;
      return NextResponse.json({ error: "Forbidden" }, { status });
    }

    const spreadsheetId = process.env.ALUMNI_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Missing ALUMNI_SHEET_ID" }, { status: 500 });
    }

    // Author + program are ALWAYS server-derived (impersonated member when an admin
    // sent asId); never trusted from the body.
    const authorSlug = normId(access.slug);
    if (!authorSlug) {
      return NextResponse.json({ error: "No profile linked to this account" }, { status: 403 });
    }
    const programId = access.programId;

    const { captureId, kind, bodyText, createdAt: createdAtRaw, dayIndex, chapterId, quoteSpeaker } = payload;
    const createdAt = createdAtRaw || new Date().toISOString();

    // Slice 6 visibility: "card" (default; composable into the Journey Card) or
    // "sealed" (never leaves the private journal). Anything else → 400 so a
    // client bug can't silently mislabel a private reflection.
    const visibility = payload.visibility || "card";
    if (visibility !== "card" && visibility !== "sealed") {
      return NextResponse.json({ error: "visibility must be card or sealed" }, { status: 400 });
    }

    if (!captureId) return NextResponse.json({ error: "captureId is required" }, { status: 400 });
    if (!VALID_KINDS.has(kind)) {
      return NextResponse.json({ error: "kind must be note, quote, photo, or voice" }, { status: 400 });
    }
    const isPhoto = kind === "photo";
    const isVoice = kind === "voice";
    const hasFile = isPhoto || isVoice;
    // Text kinds require bodyText; for file kinds it's an optional caption.
    if (!hasFile && !bodyText) {
      return NextResponse.json({ error: "bodyText is required" }, { status: 400 });
    }

    // Validate the uploaded file up front (before any Drive work). MIME allow-set
    // is per-kind: images for photo, audio for voice.
    let upload: { buffer: Buffer; mimeType: string; name: string } | null = null;
    if (hasFile) {
      if (!payload.file) {
        return NextResponse.json(
          { error: isVoice ? "An audio file is required" : "A photo file is required" },
          { status: 400 }
        );
      }
      if (payload.file.buffer.byteLength > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: isVoice ? "Recording too large" : "Photo too large" },
          { status: 413 }
        );
      }
      // Strip any parameters (e.g. MediaRecorder's "audio/webm;codecs=opus") before
      // matching, and store the bare type — so the route stays self-sufficient
      // regardless of whether the client normalized it (e.g. Slice C offline replay
      // re-sends a Blob whose .type still carries the codecs param).
      const baseMime = payload.file.mimeType.toLowerCase().split(";")[0].trim();
      const allowed = isVoice ? ALLOWED_AUDIO_MIME : ALLOWED_IMAGE_MIME;
      if (!allowed.has(baseMime)) {
        return NextResponse.json(
          { error: isVoice ? "Unsupported audio type" : "Unsupported image type" },
          { status: 415 }
        );
      }
      upload = { ...payload.file, mimeType: baseMime };
    }

    const sheets = sheetsClient();

    // Read header + existing rows once: resolve columns by NAME and scan column A
    // for the captureId so a retry is idempotent.
    const existing = await withRetry(
      () => sheets.spreadsheets.values.get({ spreadsheetId, range: FIELD_CAPTURES_RANGE }),
      "Sheets get Field-Captures"
    );
    const rows = (existing.data.values ?? []) as string[][];
    const header = rows[0] ?? [];
    if (!header.length) throw new Error("Field-Captures has no header row");

    const col = {
      captureId: idxOf(header, ["captureid"]),
      programId: idxOf(header, ["programid"]),
      authorSlug: idxOf(header, ["authorslug"]),
      kind: idxOf(header, ["kind"]),
      bodyText: idxOf(header, ["bodytext"]),
      createdAt: idxOf(header, ["createdat"]),
      syncState: idxOf(header, ["syncstate"]),
      serverReceivedAt: idxOf(header, ["serverreceivedat"]),
      dayIndex: idxOf(header, ["dayindex"]),
      chapterId: idxOf(header, ["chapterid"]),
      visibility: idxOf(header, ["visibility"]),
      quoteSpeaker: idxOf(header, ["quotespeaker"]),
      driveFileId: idxOf(header, ["drivefileid"]),
      mimeType: idxOf(header, ["mimetype"]),
    };
    if (col.captureId === -1) throw new Error('Field-Captures missing "captureId" header');

    // Dedup FIRST — before any Drive upload — so a retried photo never re-uploads.
    const want = normId(captureId);
    const deduped = rows.slice(1).some((r) => normId(r[col.captureId]) === want);
    if (deduped) return NextResponse.json({ ok: true, captureId, deduped: true });

    // Upload the file to Drive: <root>/<programId>/<authorSlug>/<captureId>.<ext>.
    let driveFileId = "";
    let storedMime = "";
    if (hasFile && upload) {
      let buffer = upload.buffer;
      let mimeType = upload.mimeType;
      // Normalize images ONLY: HEIC/HEIF → JPEG (browsers can't render HEIC),
      // bake+strip EXIF orientation, cap dimensions. Failure falls back to the
      // original bytes. Audio uploads raw, bypassing normalization.
      if (isPhoto) {
        const normalized = await normalizeUploadImage(buffer, mimeType, upload.name);
        if (normalized.changed) {
          buffer = normalized.buffer;
          mimeType = normalized.mimeType;
        }
      }

      const drive = driveClient();
      const root = envOrThrow("DRIVE_CAPTURES_FOLDER_ID");
      const programFolderId = await findOrCreateFolder(drive, root, programId);
      const authorFolderId = await findOrCreateFolder(drive, programFolderId, authorSlug);

      const fileName = `${captureId}.${extFromMime(mimeType)}`;
      const createRes = (await withRetry(
        () =>
          (drive.files.create as any)({
            requestBody: { name: fileName, parents: [authorFolderId] },
            media: { mimeType, body: bufferToStream(buffer) },
            fields: "id",
            supportsAllDrives: true,
          }),
        "Drive upload capture photo"
      )) as DriveCreateResp;

      driveFileId = createRes.data.id || "";
      if (!driveFileId) throw new Error("Drive upload returned no file id");
      storedMime = mimeType;
    }

    const nowIso = new Date().toISOString();
    const newRow: string[] = Array(header.length).fill("");
    const put = (i: number, v: string) => {
      if (i !== -1) newRow[i] = v;
    };
    put(col.captureId, captureId);
    put(col.programId, programId);
    put(col.authorSlug, authorSlug);
    put(col.kind, kind);
    put(col.bodyText, bodyText); // caption for photo/voice; body for note/quote
    put(col.createdAt, createdAt);
    put(col.serverReceivedAt, nowIso); // server-stamped
    put(col.syncState, "synced"); // server-only field
    put(col.dayIndex, dayIndex);
    put(col.chapterId, chapterId); // Slice 6 — itinerary chapter anchor (may be "")
    put(col.visibility, visibility); // Slice 6 — "card" | "sealed"
    put(col.quoteSpeaker, quoteSpeaker); // only sent for quotes; empty otherwise
    put(col.driveFileId, driveFileId); // photo/voice only; empty for note/quote
    put(col.mimeType, storedMime); // photo/voice only; empty for note/quote

    await withRetry(
      () =>
        sheets.spreadsheets.values.append({
          spreadsheetId,
          range: FIELD_CAPTURES_RANGE,
          valueInputOption: "RAW",
          requestBody: { values: [newRow] },
        }),
      "Sheets append Field-Captures"
    );

    return NextResponse.json({ ok: true, captureId, ...(driveFileId ? { driveFileId } : {}) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT CAPTURE ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
