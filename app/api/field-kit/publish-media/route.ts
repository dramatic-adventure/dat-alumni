// app/api/field-kit/publish-media/route.ts
//
// Slice 6 — media promotion for Review & Publish (§4-R Q5). Captured photos
// live in the PRIVATE capture store (DRIVE_CAPTURES_FOLDER_ID/<programId>/
// <authorSlug>/, served only through the authorized capture media route).
// Publishing a Journey Card makes chosen photos public — so the stamp first
// calls this route, which COPIES each chosen capture's Drive file into a
// "published" subfolder and returns public URLs (/api/media/thumb/<newFileId>).
//
//   • Copy, not move: the private original stays private; only the copy —
//     with a fresh, unrelated fileId — is referenced publicly.
//   • Idempotent: the copy is named <captureId>.<ext>; a retry finds the
//     existing copy and reuses it instead of duplicating. A promoted-but-
//     unpublished file (stamp failed after promotion) is unreferenced and
//     harmless; the retry picks it right back up.
//   • Ownership enforced: only the verified author's own, non-sealed photo
//     captures can be promoted — captureIds are checked against the
//     Field-Captures tab, never trusted from the body.
//
// POST { captureIds: string[], asId? } → { ok, urls: { [captureId]: url } }

import { NextResponse } from "next/server";
import { driveClient } from "@/lib/googleClients";
import { findOrCreateFolder } from "@/lib/driveFolders";
import { envOrThrow } from "@/lib/profileFolders";
import { rateLimit, rateKey } from "@/lib/rateLimit";
import { getFieldKitAccess, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { loadCapturesForAuthor } from "@/lib/loadFieldKitCaptures";
import { withRetry, normId } from "@/lib/sheetsResilience";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PROMOTE_PER_CALL = 60; // generous: 5 photos × dozens of chapters

const PUBLISHED_FOLDER = "published";

function publicUrlFor(fileId: string): string {
  return `/api/media/thumb/${encodeURIComponent(fileId)}`;
}

type DriveFilesList = {
  data: {
    files?: { id?: string | null; name?: string | null }[];
    nextPageToken?: string | null;
  };
};
type DriveCopyResp = { data: { id?: string | null } };

export async function POST(req: Request) {
  try {
    if (!rateLimit(rateKey(req), 20, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = (await req.json().catch(() => null)) as
      | { captureIds?: unknown; asId?: string }
      | null;
    if (!body || !Array.isArray(body.captureIds)) {
      return NextResponse.json({ error: "captureIds is required" }, { status: 400 });
    }
    const asId = String(body.asId ?? "").trim() || undefined;
    const wanted = body.captureIds
      .map((v) => String(v ?? "").trim())
      .filter(Boolean)
      .slice(0, MAX_PROMOTE_PER_CALL);
    if (!wanted.length) return NextResponse.json({ ok: true, urls: {} });

    // Same gate as the capture route; author + program are server-derived.
    const access = await getFieldKitAccess(FIELD_KIT_PROGRAM_ID, asId);
    if (!access.allowed) {
      const status = access.reason === "signed-out" ? 401 : 403;
      return NextResponse.json({ error: "Forbidden" }, { status });
    }
    const authorSlug = normId(access.slug);
    if (!authorSlug) {
      return NextResponse.json({ error: "No profile linked to this account" }, { status: 403 });
    }

    // Ownership check: every requested captureId must be one of the author's
    // own, non-sealed photo captures with a stored Drive file.
    const own = await loadCapturesForAuthor(access.programId, authorSlug);
    const eligible = new Map(
      own
        .filter((c) => c.kind === "photo" && c.driveFileId && c.visibility !== "sealed")
        .map((c) => [normId(c.captureId), c])
    );
    const captures = wanted.map((id) => eligible.get(normId(id)));
    if (captures.some((c) => !c)) {
      return NextResponse.json(
        { error: "One or more captures are not yours to publish" },
        { status: 403 }
      );
    }

    const drive = driveClient();
    const root = envOrThrow("DRIVE_CAPTURES_FOLDER_ID");
    const programFolderId = await findOrCreateFolder(drive, root, access.programId);
    const authorFolderId = await findOrCreateFolder(drive, programFolderId, authorSlug);
    const publishedFolderId = await findOrCreateFolder(drive, authorFolderId, PUBLISHED_FOLDER);

    // Existing copies (idempotency): name → fileId in the published folder.
    // Paginated — if a copy beyond the first page went unseen, a retry would
    // re-copy it under a NEW fileId and the card would reference different URLs.
    const existingByName = new Map<string, string>();
    let pageToken: string | undefined;
    do {
      const listed = (await withRetry(
        () =>
          (drive.files.list as any)({
            q: `'${publishedFolderId}' in parents and trashed = false`,
            fields: "nextPageToken, files(id, name)",
            pageSize: 200,
            pageToken,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
          }),
        "Drive list published captures"
      )) as DriveFilesList;
      for (const f of listed.data.files ?? []) {
        if (f.id && f.name) existingByName.set(String(f.name), String(f.id));
      }
      pageToken = listed.data.nextPageToken || undefined;
    } while (pageToken);

    const urls: Record<string, string> = {};
    for (const capture of captures) {
      if (!capture) continue; // narrowed above; keeps TS happy
      const ext = capture.mimeType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
      const copyName = `${capture.captureId}.${ext}`;

      const already = existingByName.get(copyName);
      if (already) {
        urls[capture.captureId] = publicUrlFor(already);
        continue;
      }

      const copied = (await withRetry(
        () =>
          (drive.files.copy as any)({
            fileId: capture.driveFileId,
            requestBody: { name: copyName, parents: [publishedFolderId] },
            fields: "id",
            supportsAllDrives: true,
          }),
        "Drive copy capture for publish"
      )) as DriveCopyResp;
      const newId = copied.data.id || "";
      if (!newId) throw new Error(`Drive copy returned no id for ${capture.captureId}`);
      urls[capture.captureId] = publicUrlFor(newId);
    }

    return NextResponse.json({ ok: true, urls });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT PUBLISH-MEDIA ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
