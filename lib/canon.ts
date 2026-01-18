// lib/canon.ts

import { canonicalizeSlug } from "@/lib/slugAliases";

/** "maybe slug" → canonical slug (trim + safe) */
export async function canonAlumniSlug(
  input?: string | null,
): Promise<string | undefined> {
  const s = (input ?? "").trim();
  if (!s) return undefined;
  return canonicalizeSlug(s);
}

/**
 * Rewrite /alumni/<slug> hrefs to canonical slugs.
 * Leaves non-matching hrefs alone.
 *
 * Notes:
 * - Preserves query + hash
 * - Works for absolute URLs and relative paths
 * - Ensures the inserted slug is encodeURIComponent-safe
 */
export async function canonAlumniHref(
  href?: string | null,
): Promise<string | undefined> {
  const h = (href ?? "").trim();
  if (!h) return undefined;

  // allow absolute URLs too (only rewrite pathname if it matches)
  try {
    const u = new URL(h, "http://local"); // base for relative
    const m = u.pathname.match(/^\/alumni\/([^\/?#]+)/);
    if (!m) return h;

    const oldSlug = m[1];
    const newSlug = await canonicalizeSlug(oldSlug);

    // preserve original if unchanged
    if (newSlug === oldSlug) return h;

    u.pathname = `/alumni/${encodeURIComponent(newSlug)}`;

    // If href was relative, return relative
    return h.startsWith("http") ? u.toString() : u.pathname + u.search + u.hash;
  } catch {
    // Not a parseable URL — attempt simple path rewrite
    const m = h.match(/^\/alumni\/([^\/?#]+)/);
    if (!m) return h;

    const newSlug = await canonicalizeSlug(m[1]);
    return `/alumni/${encodeURIComponent(newSlug)}${h.slice(m[0].length)}`;
  }
}
