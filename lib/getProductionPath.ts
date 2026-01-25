// lib/getProductionPath.ts
import type { Production } from "@/lib/productionMap";

/**
 * Compute the canonical path for a production.
 *
 * Priority:
 * 1. If `prod.url` is an absolute URL (starts with http), return it as-is.
 * 2. If `prod.url` is a site-relative override (e.g. "/a-girl"), use that.
 * 3. Otherwise fall back to the theatre route: `/theatre/${slug}`.
 */
export function getProductionPath(prod: Production): string {
  const { url, slug } = prod;

  // 1) Absolute URL override (rare, but nice to support)
  if (url && /^https?:\/\//i.test(url)) {
    return url;
  }

  // 2) Site-relative override (marketing shortcut like "/a-girl")
  if (url && url.trim().length > 0) {
    return url.startsWith("/") ? url : `/${url}`;
  }

  // 3) Default canonical theatre route
  return `/theatre/${slug}`;
}
