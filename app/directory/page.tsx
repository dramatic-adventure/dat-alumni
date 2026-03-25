// app/directory/page.tsx
import "server-only";

import { Suspense } from "react";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import DirectoryPageClient from "@/components/alumni/DirectoryPageClient";

import { enrichAlumniData } from "@/components/alumni/AlumniSearch/enrichAlumniData.server";
import {
  loadProfileLiveRowsPublic,
  loadProfileMediaRows,
} from "@/lib/alumniSheetsPublic.server";

import type { EnrichedProfileLiveRow } from "@/components/alumni/AlumniSearch/enrichAlumniData.server";

// ✅ Let Next cache the RSC payload to reduce Sheets quota hits
export const revalidate = 60; // bump to 300+ if you want even fewer reads

export default async function DirectoryPage() {
  const [alumni, profileLiveRows, profileMediaRows] = await Promise.all([
    loadVisibleAlumni(),
    loadProfileLiveRowsPublic(),
    loadProfileMediaRows(),
  ]);

  const enrichedData: EnrichedProfileLiveRow[] = await enrichAlumniData(
    profileLiveRows,
    profileMediaRows
  );

  return (
    <Suspense fallback={<div style={{ height: 1 }} />}>
      <DirectoryPageClient alumni={alumni} enrichedData={enrichedData} />
    </Suspense>
  );
}
