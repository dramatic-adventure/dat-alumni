// app/api/media/audio/[fileId]/route.ts
//
// PUBLIC audio proxy for promoted Journey Card voice notes. The publish stamp
// copies a chosen voice capture into the author's "published" Drive subfolder
// (see /api/field-kit/publish-media) and the card references the COPY's fileId
// through this route — the private original never gets a public URL.
//
// Only audio/* files are served: the fileId is an unguessable capability (same
// model as /api/media/thumb), and the mime restriction keeps this route from
// doubling as a generic Drive proxy.
//
// Honors HTTP Range the same way the gated capture-media route does: iOS Safari
// only plays <audio> from a proper 206 with correct Content-Length and
// Content-Range, and relaying Drive's headers through the stream client is
// unreliable — so the total size is resolved first and the partial response is
// built explicitly. Path-based routing (not a query param) so Netlify's CDN
// keys each file independently; published copies are immutable content.

import { NextResponse } from "next/server";
import { Readable } from "stream";
import { driveClient } from "@/lib/googleClients";
import { withRetry } from "@/lib/sheetsResilience";

export const runtime = "nodejs";

const BROWSER_CACHE = "private, max-age=31536000, stale-while-revalidate=86400";
const CDN_CACHE = "public, s-maxage=86400, stale-while-revalidate=86400";

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

    const drive = driveClient();
    const meta = (await withRetry(
      () =>
        drive.files.get({
          fileId,
          fields: "size,mimeType",
          supportsAllDrives: true,
        } as any),
      "Drive audio meta"
    )) as { data: { size?: string; mimeType?: string } };

    const mimeType = String(meta.data.mimeType || "").trim();
    if (!/^audio\//i.test(mimeType)) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }
    const total = Number(meta.data.size || 0);

    const rangeMatch = /^bytes=(\d*)-(\d*)$/.exec((req.headers.get("range") || "").trim());
    const hasRange = !!rangeMatch && total > 0;

    let start = 0;
    let end = total > 0 ? total - 1 : 0;
    if (hasRange) {
      if (rangeMatch![1]) start = Math.min(Number(rangeMatch![1]), Math.max(total - 1, 0));
      if (rangeMatch![2]) end = Math.min(Number(rangeMatch![2]), total - 1);
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
      "Content-Type": mimeType,
      "Accept-Ranges": "bytes",
      "Cache-Control": BROWSER_CACHE,
    };

    // Only claim 206 if Drive actually returned partial content, so
    // Content-Length never lies about the body being streamed. Partial
    // responses are browser-cache only — a CDN-cached 206 could be replayed
    // as the whole file.
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
        "Netlify-CDN-Cache-Control": CDN_CACHE,
        "Netlify-Cache-Tag": `journey-audio-${fileId}`,
        ...(total > 0 ? { "Content-Length": String(total) } : {}),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("PUBLIC AUDIO MEDIA ERROR:", msg);
    return NextResponse.json(
      { error: msg },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
