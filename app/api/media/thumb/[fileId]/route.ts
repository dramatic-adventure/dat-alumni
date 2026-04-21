// app/api/media/thumb/[fileId]/route.ts
//
// Drive thumbnail proxy — fileId is in the URL path so Netlify's CDN always keys
// each file independently. Query-param–keyed routes can be collapsed to a single
// cache entry by Netlify's CDN even with no-store headers (the plugin has been
// observed overriding Netlify-CDN-Cache-Control on query-param routes).
import { NextResponse } from "next/server";
import { driveClient } from "@/lib/googleClients";

export const runtime = "nodejs";

// Browser: private per-user cache, 1 year. CDN: must not cache (belt+suspenders).
const CACHE_OK = "private, max-age=31536000, stale-while-revalidate=86400";
const CDN_NO_STORE = "no-store";

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function bumpThumbSize(url: string, w: number) {
  if (!w) return url;
  return url.replace(/=s\d+(-c)?/i, `=s${w}$1`);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId: rawFileId } = await params;
  const fileId = decodeURIComponent(String(rawFileId || "")).trim();

  const { searchParams } = new URL(req.url);
  const wRaw = String(searchParams.get("w") || "").trim();
  const w = wRaw ? clampInt(parseInt(wRaw, 10) || 0, 64, 2400) : 0;

  if (!fileId) {
    return NextResponse.json(
      { error: "fileId required" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const drive = driveClient();

  // ✅ Preferred: use Drive thumbnailLink, proxy bytes (no redirect)
  try {
    const meta = await drive.files.get({
      fileId,
      fields: "id,thumbnailLink,mimeType",
      supportsAllDrives: true,
    } as any);

    const rawThumb = String((meta.data as any)?.thumbnailLink || "").trim();

    if (rawThumb) {
      const thumbUrl = bumpThumbSize(rawThumb, w);

      const resp = await fetch(thumbUrl, { cache: "no-store" });

      if (resp.ok) {
        const buf = await resp.arrayBuffer();
        const contentType = resp.headers.get("content-type") || "image/jpeg";

        return new NextResponse(buf as any, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": CACHE_OK,
            "CDN-Cache-Control": CDN_NO_STORE,
            "Netlify-CDN-Cache-Control": CDN_NO_STORE,
          },
        });
      }
    }
  } catch {
    // fall through to byte download
  }

  // Fallback: download original bytes from Drive
  try {
    const r = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true } as any,
      { responseType: "arraybuffer" } as any
    );

    const contentType =
      (r.headers?.["content-type"] as string) ||
      (r.headers?.["Content-Type"] as string) ||
      "image/jpeg";

    return new NextResponse(r.data as any, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": CACHE_OK,
        "CDN-Cache-Control": CDN_NO_STORE,
        "Netlify-CDN-Cache-Control": CDN_NO_STORE,
      },
    });
  } catch (e: any) {
    const msg = e?.message || "thumb fetch failed";
    return NextResponse.json(
      { error: msg },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
