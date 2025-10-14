// middleware.ts (full replacement)
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const config = {
  matcher: ["/alumni/:slug*"],
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
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      // Be explicit on caching for middleware -> API calls
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, max-age=0",
        Pragma: "no-cache",
        ...(init.headers || {}),
      },
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, origin, search } = req.nextUrl;

  const m = pathname.match(/^\/alumni\/([^\/?#]+)/i);
  if (!m) return NextResponse.next();

  const incoming = decodeURIComponent(m[1] || "").trim().toLowerCase();
  if (!incoming) return NextResponse.next();

  // Ask server which slug is canonical (old -> new)
  const fwdUrl = new URL("/api/admin/forward-slug", origin);
  fwdUrl.searchParams.set("slug", incoming);
  // tiny cache-buster to dodge any intermediaries
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

    // If forwarding, redirect and fire-and-forget a write-through to Sheets
    if (canon && canon !== incoming) {
      try {
        const autoUrl = new URL("/api/admin/auto-canon", origin);
        autoUrl.searchParams.set("old", incoming);
        autoUrl.searchParams.set("next", canon);
        autoUrl.searchParams.set("_cb", String(Date.now()));

        const adminHeaderName = process.env.ADMIN_HEADER_NAME || "X-Admin-Key";
        const adminKey = process.env.ADMIN_API_KEY || "";

        // Don't await; just attempt to trigger server-side
        fetchWithTimeout(
          autoUrl.toString(),
          {
            method: "GET",
            headers: adminKey
              ? ({ [adminHeaderName]: adminKey } as Record<string, string>)
              : undefined,
          },
          1500
        ).catch(() => {});
      } catch {
        // swallow — redirect should still proceed
      }

      // Preserve the original query string on redirect
      const loc = new URL(`/alumni/${encodeURIComponent(canon)}`, origin);
      if (search) loc.search = search;

      const out = NextResponse.redirect(loc, 308);
      out.headers.set("x-slug-in", incoming);
      out.headers.set("x-slug-target", canon);
      out.headers.set("x-slug-action", "redirect");
      return out;
    }

    // No forwarding — let the request through
    const next = NextResponse.next();
    next.headers.set("x-slug-in", incoming);
    next.headers.set("x-slug-target", canon || "");
    next.headers.set("x-slug-action", "pass");
    return next;
  } catch {
    // Absolute soft-fail: pass instead of error
    const next = NextResponse.next();
    next.headers.set("x-slug-in", incoming);
    next.headers.set("x-slug-target", "");
    next.headers.set("x-slug-action", "pass");
    return next;
  }
}
