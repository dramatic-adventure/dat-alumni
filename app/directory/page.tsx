// app/directory/page.tsx
import { Suspense } from "react";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import DirectoryPageClient from "@/components/alumni/DirectoryPageClient";

export const dynamic = "force-dynamic"; // runtime render; revalidate would be ignored

export default async function DirectoryPage() {
  const alumni = await loadVisibleAlumni(); // server fetch
  return (
    <Suspense fallback={<div style={{height: 1}} />}>
  <DirectoryPageClient alumni={alumni} />
</Suspense>
  );
}
