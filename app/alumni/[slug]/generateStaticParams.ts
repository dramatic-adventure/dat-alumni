// app/alumni/[slug]/generateStaticParams.ts
import { loadVisibleAlumni } from "@/lib/loadAlumni";

export default async function generateStaticParams() {
  // IMPORTANT: this runs at build. loadAlumni/loadCsv already fall back
  // to cached CSV-on-disk if Google fetch is blocked during prerender.
  const rows = await loadVisibleAlumni();
  return rows
    .map(r => (r.slug || "").trim())
    .filter(Boolean)
    .map(slug => ({ slug }));
}
