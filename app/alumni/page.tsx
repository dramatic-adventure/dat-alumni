// /app/alumni/page.tsx
import { Suspense } from "react";
import AlumniPage from "@/components/alumni/AlumniPage";
import { getFeaturedAlumni } from "@/lib/featuredAlumni";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import { getRecentUpdates } from "@/lib/getRecentUpdates";

/**
 * ✅ Let this page use ISR so Next can prefetch and cache
 *    the RSC payloads for detail routes. This makes client
 *    navigation feel instant.
 */
export const revalidate = 300; // 5 minutes

// Shape AlumniPage expects
type HighlightItem = {
  name: string;
  slug: string;
  roles?: string[];
  headshotUrl?: string;
};

type UpdateItem = {
  text: string;
  link: string;
  author: string;
};

export default async function Alumni() {
  const { highlights } = await getFeaturedAlumni();
  const alumni = await loadVisibleAlumni();

  // Normalize highlights defensively → exact shape AlumniPage wants
  const safeHighlights: HighlightItem[] = (Array.isArray(highlights) ? highlights : [])
    .map((h: any) => ({
      name: String(h?.name ?? h?.title ?? "").trim(),
      slug: String(h?.slug ?? "").trim(),
      roles: Array.isArray(h?.roles) ? (h.roles as string[]) : [],
      headshotUrl:
        typeof h?.headshotUrl === "string"
          ? h.headshotUrl
          : typeof h?.image === "string"
          ? h.image
          : undefined,
    }))
    .filter((h) => h.name && h.slug);

  const alumniData = alumni.map((a) => ({
    name: a.name,
    slug: a.slug,
    roles: a.roles || [],
    headshotUrl: a.headshotUrl || "",
  }));

  const initialUpdates: UpdateItem[] = getRecentUpdates(alumni).map((u: any) => ({
    text: u.message || "Update coming soon...",
    link: `/alumni/${u.slug}`,
    author: u.name || "ALUM",
  }));

  return (
    // ✅ AlumniPage is a Client Component; Suspense keeps Next happy
    //    and shows a quick fallback while the client hydrates.
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <AlumniPage
        highlights={safeHighlights}
        alumniData={alumniData}
        initialUpdates={initialUpdates.slice(0, 5)}
      />
    </Suspense>
  );
}
