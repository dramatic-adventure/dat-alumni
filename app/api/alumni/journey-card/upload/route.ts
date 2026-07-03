// app/api/alumni/journey-card/upload/route.ts
//
// Slice 6 — photo upload for the RETROACTIVE Journey Card builder. Past trips
// have no capture store to promote from, so the alum uploads photos directly;
// each lands in Drive under DRIVE_CAPTURES_FOLDER_ID/<programId>/<slug>/published/
// (the same "published" scheme the live publish-media promotion uses) and comes
// back as a public /api/media/thumb/<fileId> URL for the draft/card.
//
// Gate (§4-R Q4): getRetroJourneyAccess — authenticated alumni-profile owner —
// AND membership on the target program's programMap roster. Admin impersonation
// via asId mirrors the capture route.
//
// POST multipart/form-data: file, programId, asId? → { ok, url }

import { NextResponse } from "next/server";
import { driveClient } from "@/lib/googleClients";
import { findOrCreateFolder, bufferToStream } from "@/lib/driveFolders";
import { envOrThrow } from "@/lib/profileFolders";
import { normalizeUploadImage } from "@/lib/normalizeUploadImage";
import { rateLimit, rateKey } from "@/lib/rateLimit";
import { getRetroJourneyAccess, isOnRetroProgram } from "@/lib/retroJourneyAccess";
import { withRetry } from "@/lib/sheetsResilience";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB — mirrors the capture route

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

function extFromMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes("jpeg") || m.includes("jpg")) return "jpg";
  if (m.includes("png")) return "png";
  if (m.includes("webp")) return "webp";
  if (m.includes("gif")) return "gif";
  if (m.includes("heic")) return "heic";
  if (m.includes("heif")) return "heif";
  return "img";
}

type DriveCreateResp = { data: { id?: string } };

export async function POST(req: Request) {
  try {
    if (!rateLimit(rateKey(req), 20, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });

    const programId = String(form.get("programId") ?? "").trim().toLowerCase();
    const asId = String(form.get("asId") ?? "").trim() || undefined;
    const f = form.get("file");
    if (!programId) return NextResponse.json({ error: "programId is required" }, { status: 400 });
    if (!(f instanceof File)) return NextResponse.json({ error: "A photo file is required" }, { status: 400 });

    const access = await getRetroJourneyAccess(asId);
    if (!access.allowed) {
      const status = access.reason === "signed-out" ? 401 : 403;
      return NextResponse.json({ error: "Forbidden" }, { status });
    }
    if (!isOnRetroProgram(access.slug, programId)) {
      return NextResponse.json({ error: "Not on this program's roster" }, { status: 403 });
    }

    if (f.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Photo too large" }, { status: 413 });
    }
    const baseMime = (f.type || "application/octet-stream").toLowerCase().split(";")[0].trim();
    if (!ALLOWED_IMAGE_MIME.has(baseMime)) {
      return NextResponse.json({ error: "Unsupported image type" }, { status: 415 });
    }

    // Normalize like the capture route: HEIC → JPEG, EXIF orientation baked,
    // dimensions capped. Failure falls back to the original bytes.
    let buffer: Buffer = Buffer.from(await f.arrayBuffer());
    let mimeType = baseMime;
    const normalized = await normalizeUploadImage(buffer, mimeType, f.name || "photo");
    if (normalized.changed) {
      buffer = normalized.buffer;
      mimeType = normalized.mimeType;
    }

    const drive = driveClient();
    const root = envOrThrow("DRIVE_CAPTURES_FOLDER_ID");
    const programFolderId = await findOrCreateFolder(drive, root, programId);
    const slugFolderId = await findOrCreateFolder(drive, programFolderId, access.slug);
    const publishedFolderId = await findOrCreateFolder(drive, slugFolderId, "published");

    const fileName = `retro-${Date.now().toString(36)}.${extFromMime(mimeType)}`;
    const created = (await withRetry(
      () =>
        (drive.files.create as any)({
          requestBody: { name: fileName, parents: [publishedFolderId] },
          media: { mimeType, body: bufferToStream(buffer) },
          fields: "id",
          supportsAllDrives: true,
        }),
      "Drive upload retro journey photo"
    )) as DriveCreateResp;

    const fileId = created.data.id || "";
    if (!fileId) throw new Error("Drive upload returned no file id");

    return NextResponse.json({ ok: true, url: `/api/media/thumb/${encodeURIComponent(fileId)}` });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("RETRO JOURNEY UPLOAD ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
