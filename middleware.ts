// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Broad matcher + explicit guards is the most reliable across runtimes.
export const config = {
  matcher: ["/:path*"],
};

/** Edge-safe timeout wrapper for fetch. */
async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  ms = 3000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, max-age=0",
        Pragma: "no-cache",
        ...(init.headers || {}),
      },
    });
  } finally {
    clearTimeout(id);
  }
}

function isStaticFilePath(pathname: string) {
  // Any path ending in ".ext" (e.g. .png, .js, .css, .map, .ico)
  return /\.[a-z0-9]+$/i.test(pathname);
}

export default async function middleware(req: NextRequest) {
  const { pathname, origin, search } = req.nextUrl;

  // 🚫 Never interfere with Next internals, APIs, or obvious static assets
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname.startsWith("/sitemap") ||
    isStaticFilePath(pathname)
  ) {
    return NextResponse.next();
  }

  // ✅ Only canonicalize exact alumni profile paths:
  // /alumni/{slug} or /alumni/{slug}/
  const m = pathname.match(/^\/alumni\/([^\/?#]+)\/?$/i);
  if (!m) return NextResponse.next();

  const incoming = decodeURIComponent(m[1] || "").trim().toLowerCase();
  if (!incoming) return NextResponse.next();

  // Ask server which slug is canonical (old -> new)
  const fwdUrl = new URL("/api/admin/forward-slug", origin);
  fwdUrl.searchParams.set("slug", incoming);
  fwdUrl.searchParams.set("_cb", String(Date.now()));

  try {
    const res = await fetchWithTimeout(fwdUrl.toString());

    // Soft-fail to pass on non-OK (timeouts, 5xx, etc.)
    if (!res.ok) {
      const next = NextResponse.next();
      next.headers.set("x-slug-in", incoming);
      next.headers.set("x-slug-target", "");
      next.headers.set("x-slug-action", "pass");
      return next;
    }

    let canon = "";
    try {
      const data = (await res.json()) as { target?: string | null };
      canon = (data?.target || "").trim().toLowerCase();
    } catch {
      // ignore JSON parse errors -> treat as no forward
    }

    if (canon && canon !== incoming) {
      const loc = new URL(`/alumni/${encodeURIComponent(canon)}`, origin);
      if (search) loc.search = search;

      const out = NextResponse.redirect(loc, 308);
      out.headers.set("x-slug-in", incoming);
      out.headers.set("x-slug-target", canon);
      out.headers.set("x-slug-action", "redirect");
      return out;
    }

    const next = NextResponse.next();
    next.headers.set("x-slug-in", incoming);
    next.headers.set("x-slug-target", canon || "");
    next.headers.set("x-slug-action", "pass");
    return next;
  } catch {
    const next = NextResponse.next();
    next.headers.set("x-slug-in", incoming);
    next.headers.set("x-slug-target", "");
    next.headers.set("x-slug-action", "pass");
    return next;
  }
}
