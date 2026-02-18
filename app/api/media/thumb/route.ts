// app/api/media/thumb/route.ts
import { NextResponse } from "next/server";
import { driveClient } from "@/lib/googleClients";

export const runtime = "nodejs";

// 1 year cache is safe because URL is keyed by fileId (new upload => new fileId)
const CACHE_OK =
  "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400";

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
