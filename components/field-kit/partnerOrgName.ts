// components/field-kit/partnerOrgName.ts
//
// Partner-org display name — a pure, server-safe helper (NO "use client").
// Lives in its own module so server components (e.g. ItineraryCompanion) can
// call it directly. parts.tsx re-exports it for client consumers.
//
// There is no production partner-org store yet (net-new). Until there is, we
// resolve the slug to a readable label: a small known-name override map, then a
// humanized fallback. Honest (it's the slug we have), never a fabricated link.

const PARTNER_NAME_OVERRIDES: Record<string, string> = {
  "etp-slovensko": "ETP Slovensko",
  "kosice-kc": "Kasárne / Kulturpark",
};

export function partnerOrgName(slug: string): string {
  const s = String(slug ?? "").trim();
  if (!s) return "";
  if (PARTNER_NAME_OVERRIDES[s]) return PARTNER_NAME_OVERRIDES[s];
  return s
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
