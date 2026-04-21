// app/api/media/thumb/route.ts
import { NextResponse } from "next/server";
import { driveClient } from "@/lib/googleClients";

export const runtime = "nodejs";

// Browser cache: private (per-user), 1 year — keyed by full URL including fileId.
// Netlify-CDN-Cache-Control: no-store — the Netlify-specific header that takes highest
// precedence over CDN-Cache-Control and cannot be overridden by @netlify/plugin-nextjs.
// CDN-Cache-Control: no-store — kept for defense-in-depth against other CDN layers.
const CACHE_OK =
  "private, max-age=31536000, stale-while-revalidate=86400";
const CDN_NO_STORE = "no-store";

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function bumpThumbSize(url: string, w: number) {
  // Drive thumbnailLink often contains `=s220` or `=s220-c`. Replace if present.
  // If not present, leave it alone.
  if (!w) return url;
  return url.replace(/=s\d+(-c)?/i, `=s${w}$1`);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fileId = String(searchParams.get("fileId") || "").trim();

  // Optional width hint for Drive thumbnail sizing
  const wRaw = String(searchParams.get("w") || "").trim();
  const w = wRaw ? clampInt(parseInt(wRaw, 10) || 0, 64, 2400) : 0;

  if (!fileId) {
    return NextResponse.json(
      { error: "fileId required" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const drive = driveClient();

  // ✅ Preferred: use Drive thumbnailLink, but proxy bytes (NO redirect)
  try {
    const meta = await drive.files.get({
      fileId,
      fields: "id,thumbnailLink,mimeType",
      supportsAllDrives: true,
    } as any);

    const rawThumb = String((meta.data as any)?.thumbnailLink || "").trim();

    if (rawThumb) {
      const thumbUrl = bumpThumbSize(rawThumb, w);

      // Fetch the thumbnail bytes server-side
      const resp = await fetch(thumbUrl, {
        // Avoid caching *this* fetch in Next’s internal cache; we control caching via headers.
        cache: "no-store",
      });

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
      // if thumbnail fetch fails, fall through to byte download
    }
  } catch {
    // fall through to byte download
  }

  // Fallback: download original bytes from Drive (more expensive but reliable)
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
