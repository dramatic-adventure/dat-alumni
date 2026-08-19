// app/api/media/audio/[fileId]/route.ts
//
// PUBLIC audio proxy for promoted Journey Card voice notes. The publish stamp
// copies a chosen voice capture into the author's "published" Drive subfolder
// (see /api/field-kit/publish-media) and the card references the COPY's fileId
// through this route — the private original never gets a public URL.
//
// Only audio/* files are served, and ONLY files sitting in a "published"
// folder — the folder publish-media copies promoted captures into. Unlike the
// image thumb proxy (which must serve headshots and other long-standing media
// hosts), this route is new and can afford the stricter check: a private
// original's fileId — sealed voice notes included — gets a 404 here even if it
// leaks, because originals never live in a published folder.
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
          fields: "size,mimeType,parents",
          supportsAllDrives: true,
        } as any),
      "Drive audio meta"
    )) as { data: { size?: string; mimeType?: string; parents?: string[] } };

    const notFound = () =>
      NextResponse.json(
        { error: "Not found" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );

    const mimeType = String(meta.data.mimeType || "").trim();
    if (!/^audio\//i.test(mimeType)) return notFound();

    // Promotion boundary: the file must live in a "published" folder (the copy
    // target in /api/field-kit/publish-media). Private originals never do.
    const parentId = String(meta.data.parents?.[0] || "").trim();
    if (!parentId) return notFound();
    const parent = (await withRetry(
      () =>
        drive.files.get({ fileId: parentId, fields: "name", supportsAllDrives: true } as any),
      "Drive audio parent meta"
    )) as { data: { name?: string } };
    if (String(parent.data.name || "").trim().toLowerCase() !== "published") return notFound();

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
