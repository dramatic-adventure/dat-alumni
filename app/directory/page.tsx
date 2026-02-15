// app/directory/page.tsx
import "server-only";

import { Suspense } from "react";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import DirectoryPageClient from "@/components/alumni/DirectoryPageClient";

import { loadProfileLiveRowsPublic } from "@/lib/alumniSheetsPublic.server";

import type { EnrichedProfileLiveRow } from "@/components/alumni/AlumniSearch/enrichAlumniData.server";

// ✅ Make Directory stable + cacheable (dramatically reduces read bursts)
export const dynamic = "force-static";
export const revalidate = 600; // 10 minutes (raise to 1800+ if you want even fewer reads)

export default async function DirectoryPage() {
  // ✅ Directory should not do multiple Profile sheets reads per render.
  // We load Profile-Live only (public), and derive minimal enrichment needed for headshots.
  const [alumni, profileLiveRows] = await Promise.all([
    loadVisibleAlumni(),
    loadProfileLiveRowsPublic(),
  ]);

  // ✅ Minimal “enrichment” derived from Profile-Live (no Profile-Media read).
  const enrichedData: EnrichedProfileLiveRow[] = (profileLiveRows || [])
    .map((r: any) => {
      const slug = String(r?.slug || "").trim();
      if (!slug) return null;

      const canonicalSlug = String(r?.canonicalSlug || "").trim() || undefined;

      // Prefer explicit currentHeadshotUrl from Profile-Live, then common alternates
      const headshotUrl =
        String(
          r?.currentHeadshotUrl ||
            r?.headshotUrl ||
            r?.headshotURL ||
            r?.headshot ||
            r?.avatarUrl ||
            r?.avatarURL ||
            r?.avatar ||
            ""
        ).trim() || undefined;

      const headshotCacheKey =
        r?.headshotCacheKey ??
        r?.avatarUpdatedAt ??
        r?.headshotUpdatedAt ??
        r?.updatedAt ??
        undefined;

      return {
        slug,
        ...(canonicalSlug ? { canonicalSlug } : {}),
        ...(headshotUrl ? { headshotUrl } : {}),
        ...(headshotCacheKey != null ? { headshotCacheKey } : {}),
      } as any;
    })
    .filter(Boolean) as any;

  return (
    <Suspense fallback={<div style={{ height: 1 }} />}>
      <DirectoryPageClient alumni={alumni} enrichedData={enrichedData} />
    </Suspense>
  );
}
