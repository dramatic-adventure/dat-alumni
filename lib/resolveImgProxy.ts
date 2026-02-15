// lib/resolveImgProxy.ts
export async function resolveImgProxy(url: string): Promise<string> {
  const u = String(url || "").trim();
  if (!u.startsWith("/api/img")) return u;

  try {
    // HEAD is cheap and lets us see redirect Location
    const res = await fetch(u, { method: "HEAD", cache: "no-store", redirect: "manual" });

    // If proxy returns a redirect fallback, use the upstream URL directly.
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (loc) return loc;
    }

    // Otherwise keep using the proxy URL
    return u;
  } catch {
    // If HEAD fails, just return original URL (don’t brick UI)
    return u;
  }
}
