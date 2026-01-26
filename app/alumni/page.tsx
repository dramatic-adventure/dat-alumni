// /app/alumni/page.tsx
import "server-only";

import { Suspense } from "react";
import AlumniPage from "@/components/alumni/AlumniPage";
import { getFeaturedAlumni } from "@/lib/featuredAlumni";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import { getRecentUpdates } from "@/lib/getRecentUpdates";
import {
  loadProfileLiveRowsPublic,
  loadProfileMediaRows,
} from "@/lib/alumniSheetsPublic.server";
import { enrichAlumniData } from "@/components/alumni/AlumniSearch/enrichAlumniData.server";
import type { EnrichedProfileLiveRow } from "@/components/alumni/AlumniSearch/enrichAlumniData.server";

/**
 * ✅ Let this page use ISR so Next can prefetch and cache
 *    the RSC payloads for detail routes. This makes client
 *    navigation feel instant.
 */
export const revalidate = 60; // cache RSC payload; reduces Sheets quota hits

// Shape AlumniPage expects
type HighlightItem = {
  name: string;
  slug: string;
  roles?: string[];
  headshotUrl?: string;
};

type AlumniCardItem = {
  name: string;
  slug: string;
  roles: string[];
  headshotUrl: string;
};

type UpdateItem = {
  text: string;
  link: string;
  author: string;
};

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

function isLegacySquarespaceUrl(u: unknown) {
  const s = String(u ?? "").trim().toLowerCase();
  return s.includes("squarespace-cdn.com") || s.includes("images.squarespace-cdn.com");
}

export default async function Alumni() {
  const { highlights } = await getFeaturedAlumni();
  const alumni = await loadVisibleAlumni();

  // ✅ Same authoritative sources used across /alumni + /directory
  const [profileLiveRows, profileMediaRows] = await Promise.all([
    loadProfileLiveRowsPublic(),
    loadProfileMediaRows(),
  ]);

  const DEBUG_SHEETS =
    process.env.NODE_ENV === "development" &&
    (process.env.NEXT_PUBLIC_DEBUG_SHEETS === "1" || process.env.DEBUG_SHEETS === "1");

  if (DEBUG_SHEETS) {
    console.log("[profile-media] rows:", profileMediaRows.length);

    const sampleIds = profileMediaRows
      .map((r) => String((r as any)?.alumniId || "").trim())
      .filter(Boolean)
      .slice(0, 10);

    console.log("[profile-media] sample alumniIds:", sampleIds);

    const jesse = profileMediaRows
      .filter((r) => String((r as any)?.alumniId || "").trim().toLowerCase() === "jesse-baxter")
      .slice(0, 10);

    console.log("[profile-media] jesse-baxter rows:", jesse.length, jesse);
  }


  // ✅ Enrichment merges the two and picks best headshot per person
  const enrichedData: EnrichedProfileLiveRow[] = await enrichAlumniData(
    profileLiveRows,
    profileMediaRows,
  );

  const liveBySlug = new Map(profileLiveRows.map((r) => [norm(r.slug), r]));

  // canonicalSlug + slug → best headshotUrl
  const headshotBySlug = new Map<string, string>();
  for (const r of enrichedData) {
    const url = String((r as any)?.headshotUrl || "").trim();
    if (!url) continue;

    const s1 = norm((r as any)?.canonicalSlug || "");
    const s2 = norm((r as any)?.slug || "");

    if (s1) headshotBySlug.set(s1, url);
    if (s2) headshotBySlug.set(s2, url);
  }

  const safeHighlights: HighlightItem[] = (Array.isArray(highlights) ? highlights : [])
    .map((h: any) => ({
      name: String(h?.name ?? h?.title ?? "").trim(),
      slug: norm(h?.slug),
      roles: Array.isArray(h?.roles) ? (h.roles as string[]) : [],
      headshotUrl: (() => {
        const k = norm(h?.slug);

        const enriched = headshotBySlug.get(k);
        if (enriched) return enriched;

        const live = liveBySlug.get(k)?.currentHeadshotUrl;
        if (live && !isLegacySquarespaceUrl(live)) return live;

        const hUrl =
          typeof h?.headshotUrl === "string"
            ? h.headshotUrl
            : typeof h?.image === "string"
              ? h.image
              : undefined;

        if (hUrl && !isLegacySquarespaceUrl(hUrl)) return hUrl;

        return undefined;
      })(),
    }))
    .filter((h) => h.name && h.slug);

  const alumniData: AlumniCardItem[] = alumni.map((a) => ({
    name: a.name,
    slug: a.slug,
    roles: a.roles || [],
    headshotUrl: (() => {
      const k = norm(a.slug);

      const enriched = headshotBySlug.get(k);
      if (enriched) return enriched;

      const live = liveBySlug.get(k)?.currentHeadshotUrl;
      if (live && !isLegacySquarespaceUrl(live)) return live;

      if (a.headshotUrl && !isLegacySquarespaceUrl(a.headshotUrl)) return a.headshotUrl;

      return "";
    })(),
  }));

  const initialUpdates: UpdateItem[] = getRecentUpdates(alumni).map((u: any) => ({
    text: u.message || "Update coming soon...",
    link: `/alumni/${u.slug}`,
    author: u.name || "ALUM",
  }));

  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <AlumniPage
        highlights={safeHighlights}
        alumniData={alumniData}
        initialUpdates={initialUpdates.slice(0, 5)}
        enrichedData={enrichedData}
      />
    </Suspense>
  );
}
