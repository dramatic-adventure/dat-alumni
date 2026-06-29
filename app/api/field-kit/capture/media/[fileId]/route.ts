// app/api/field-kit/capture/media/[fileId]/route.ts
//
// Authorized media proxy for PRIVATE Field Kit captures. Unlike public headshots
// (served via /api/media/thumb), capture photos are private to their author, so
// they MUST flow through this gated route — never the public proxy.
//
// Gate (defense in depth): re-run getFieldKitAccess, then look the capture up by
// driveFileId in Field-Captures and require its authorSlug === access.slug OR the
// caller is an admin. Without this, anyone could fetch another member's private
// capture media by guessing a Drive fileId.
//
// Streams the Drive bytes with the stored mimeType. (Range support isn't needed
// for images; Slice B2 adds it for audio.)

import { NextResponse } from "next/server";
import { Readable } from "stream";
import { driveClient, sheetsClient } from "@/lib/googleClients";
import { getFieldKitAccess, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { withRetry, idxOf, normId } from "@/lib/sheetsResilience";

export const runtime = "nodejs";

const FIELD_CAPTURES_RANGE = "Field-Captures!A:L";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId: rawFileId } = await params;
    const fileId = decodeURIComponent(String(rawFileId || "")).trim();
    if (!fileId) {
      return NextResponse.json(
        { error: "fileId required" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Admin impersonation flows through the same gate the pages/route use.
    const asId = new URL(req.url).searchParams.get("asId")?.trim() || undefined;
    const access = await getFieldKitAccess(FIELD_KIT_PROGRAM_ID, asId);
    if (!access.allowed) {
      const status = access.reason === "signed-out" ? 401 : 403;
      return NextResponse.json({ error: "Forbidden" }, { status });
    }

    const spreadsheetId = process.env.ALUMNI_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Missing ALUMNI_SHEET_ID" }, { status: 500 });
    }

    // Look the capture up by driveFileId; require ownership (or admin). A miss or a
    // foreign-owned file both return 404 — never reveal another member's media.
    const sheets = sheetsClient();
    const res = await withRetry(
      () => sheets.spreadsheets.values.get({ spreadsheetId, range: FIELD_CAPTURES_RANGE }),
      "Sheets get Field-Captures (media auth)"
    );
    const rows = (res.data.values ?? []) as string[][];
    const header = rows[0] ?? [];
    const iFile = idxOf(header, ["drivefileid"]);
    const iAuthor = idxOf(header, ["authorslug"]);
    const iMime = idxOf(header, ["mimetype"]);
    if (iFile === -1 || iAuthor === -1) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const wantFile = normId(fileId);
    const row = rows.slice(1).find((r) => normId(r[iFile]) === wantFile);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const owns = normId(row[iAuthor]) === normId(access.slug);
    if (!owns && !access.isAdmin) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const storedMime = (iMime !== -1 ? String(row[iMime] || "") : "").trim();

    const drive = driveClient();
    const file = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true } as any,
      { responseType: "stream" } as any
    );

    const nodeStream = file.data as unknown as Readable;
    const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": storedMime || "application/octet-stream",
        // Private media — never cache on a shared CDN.
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT CAPTURE MEDIA ERROR:", msg);
    return NextResponse.json(
      { error: msg },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
