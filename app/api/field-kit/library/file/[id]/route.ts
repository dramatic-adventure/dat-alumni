// app/api/field-kit/library/file/[id]/route.ts
//
// Gated file proxy for Field Library resources (Slice 5). `id` is the RESOURCE
// id from the "Field Kit Resources" tab — never a raw Drive fileId, so this
// route can only ever serve files staff explicitly shelved. Any roster member
// (or admin) may fetch; resources are program-level, not per-user — which is
// also what makes the response safe to cache on the device (service-worker
// cache-on-open, public/sw.js).
//
// Streaming + Range handling mirror the capture media route verbatim (iOS
// audio needs a real 206 with correct Content-Length). Same-origin by design:
// Drive files proxied here are cacheable by our service worker; a cross-origin
// Drive URL would be opaque to it.

import { NextResponse } from "next/server";
import { Readable } from "stream";
import { driveClient } from "@/lib/googleClients";
import { getFieldKitAccess, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { getResourceById, driveFileIdFromUrl } from "@/lib/resources";
import { withRetry } from "@/lib/sheetsResilience";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = decodeURIComponent(String(rawId || "")).trim();
    if (!id) {
      return NextResponse.json(
        { error: "id required" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const asId = new URL(req.url).searchParams.get("asId")?.trim() || undefined;
    const access = await getFieldKitAccess(FIELD_KIT_PROGRAM_ID, asId);
    if (!access.allowed) {
      const status = access.reason === "signed-out" ? 401 : 403;
      return NextResponse.json({ error: "Forbidden" }, { status });
    }

    const resource = await getResourceById(access.programId, id);
    if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const fileId = driveFileIdFromUrl(resource.url);
    if (!fileId) {
      // A plain external link — nothing to stream; the client opens it directly.
      return NextResponse.json({ error: "Not a Drive-backed resource" }, { status: 404 });
    }

    const drive = driveClient();
    const meta = (await withRetry(
      () =>
        drive.files.get({ fileId, fields: "size, mimeType", supportsAllDrives: true } as any),
      "Drive library file meta"
    )) as { data: { size?: string; mimeType?: string } };
    const total = Number(meta.data.size || 0);
    const contentType = (meta.data.mimeType || "").trim() || "application/octet-stream";

    const rangeMatch = /^bytes=(\d*)-(\d*)$/.exec((req.headers.get("range") || "").trim());
    const hasRange = !!rangeMatch && total > 0 && (!!rangeMatch[1] || !!rangeMatch[2]);

    let start = 0;
    let end = total > 0 ? total - 1 : 0;
    if (hasRange) {
      if (!rangeMatch![1] && rangeMatch![2]) {
        // Suffix range "bytes=-N" — the LAST N bytes (players read trailing
        // metadata this way; serving the first N here breaks audio seeking).
        start = Math.max(total - Number(rangeMatch![2]), 0);
      } else {
        start = Math.min(Number(rangeMatch![1]), Math.max(total - 1, 0));
        if (rangeMatch![2]) end = Math.min(Number(rangeMatch![2]), total - 1);
      }
      if (start > end) {
        start = 0;
        end = total - 1;
      }
    }

    const dl = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true } as any,
      {
        responseType: "stream",
        ...(hasRange ? { headers: { Range: `bytes=${start}-${end}` } } : {}),
      } as any
    );
    const webStream = Readable.toWeb(dl.data as unknown as Readable) as unknown as ReadableStream;

    const baseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      // no-store: the browser HTTP cache is keyed by URL only and survives
      // sign-out, so a max-age here would serve gated bytes to the next user
      // of a shared device without ever re-hitting this gate. Offline
      // availability comes EXCLUSIVELY from the explicit fk-lib cache-on-open
      // path (lib/fieldKitCache.ts), which sign-out sweeps.
      "Cache-Control": "private, no-store",
    };

    if (hasRange && dl.status === 206) {
      return new NextResponse(webStream, {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Content-Length": String(end - start + 1),
        },
      });
    }

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        ...baseHeaders,
        ...(total > 0 ? { "Content-Length": String(total) } : {}),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT LIBRARY FILE ERROR:", msg);
    return NextResponse.json(
      { error: msg },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
