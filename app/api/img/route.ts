// app/api/img/route.ts
import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ✅ IMPORTANT: keep this allowlist tight (add only hosts you actually use)
const ALLOWED_HOSTS = new Set<string>([
  "i.imgur.com",
  "images.unsplash.com",
  "live.staticflickr.com",
  "farm1.staticflickr.com",
  "farm2.staticflickr.com",
  "farm3.staticflickr.com",
  "farm4.staticflickr.com",
  "farm5.staticflickr.com",
  "farm6.staticflickr.com",
  "dl.dropboxusercontent.com",
  // add your own CDN/WordPress host(s) here if applicable
]);

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const url = searchParams.get("url") || "";
    const w = clamp(Number(searchParams.get("w") || "1400"), 200, 2400);
    const q = clamp(Number(searchParams.get("q") || "72"), 40, 90);

    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid url" }, { status: 400 });
    }

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
    }

    // 🔒 SSRF protection: allowlist hostnames
    const host = parsed.hostname.toLowerCase();
    if (!ALLOWED_HOSTS.has(host)) {
      return NextResponse.json(
        {
          error: "Host not allowed",
          host,
          hint: "Add this host to ALLOWED_HOSTS in app/api/img/route.ts",
        },
        { status: 403 }
      );
    }

    // Fetch remote image
    const upstream = await fetch(parsed.toString(), {
      // Cache upstream fetch in Next’s data cache a bit (helps repeat loads)
      next: { revalidate: 60 * 60 * 24 }, // 24h
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Upstream fetch failed", status: upstream.status },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "URL is not an image", contentType },
        { status: 415 }
      );
    }

    const input = Buffer.from(await upstream.arrayBuffer());

    // Resize + convert
    const out = await sharp(input, { failOn: "none" })
      .rotate() // respect EXIF orientation
      .resize({
        width: w,
        withoutEnlargement: true,
        fit: "inside",
      })
      .webp({ quality: q })
      .toBuffer();

    // ✅ BodyInit-safe for Response/NextResponse
    const body = new Uint8Array(out);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        // cache aggressively; URL is parameterized by (url,w,q)
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);

    return NextResponse.json(
      { error: "Image proxy error", detail: message },
      { status: 500 }
    );
  }
}
