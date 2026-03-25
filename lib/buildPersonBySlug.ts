// /lib/buildPersonBySlug.ts
import type { AlumniRow } from "@/lib/types";
import type { PersonRef } from "@/lib/dramaClubMap";

function normSlug(s: string) {
  return String(s || "").trim().toLowerCase();
}

function clean(s?: string | null) {
  const t = String(s || "").trim();
  return t ? t : "";
}

/**
 * Build a lookup map: slug -> PersonRef
 * Used to resolve programMap/productionMap artist slugs into MiniProfileCard-ready refs.
 *
 * Note: `PersonRef` does NOT include `subtitle`, so we only return fields that exist on PersonRef.
 * If you want roles/subtitles on cards, pass them at render time (from the roles map) OR extend PersonRef’s type.
 */
export function buildPersonBySlug(alumni: AlumniRow[]): Record<string, PersonRef> {
  const out: Record<string, PersonRef> = {};

  for (const a of alumni) {
    const slug = normSlug(a.slug || "");
    const name = clean(a.name);
    if (!slug || !name) continue;

    out[slug] = {
      name,
      href: `/alumni/${encodeURIComponent(slug)}`,
      avatarSrc: clean((a as any).headshotUrl) || undefined,
    };
  }

  return out;
}
