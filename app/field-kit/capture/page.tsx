// app/field-kit/capture/page.tsx
//
// Quick Capture — Slice A (text-only note/quote, online). Gates (defense in
// depth), resolves the current itinerary day so each capture can carry a
// dayIndex, and renders the client form. POSTs land in the Field-Captures tab
// via /api/field-kit/capture, which re-derives author + program server-side.

import CaptureForm from "@/components/field-kit/CaptureForm";
import { requireFieldKitPage } from "@/lib/fieldKitAccess";
import { loadProgramItinerary } from "@/lib/loadProgram";
import { resolveToday } from "@/lib/programItinerary";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function CapturePage() {
  // Defense in depth: gate before loading anything.
  const access = await requireFieldKitPage();
  if (!access) return null; // not on the roster — the layout renders the gate.

  // Current itinerary day (readily available) → stamped onto each capture so a
  // note knows which program day it belongs to. Blank when none resolves.
  const itinerary = await loadProgramItinerary(access.programId);
  const currentDayId = itinerary ? resolveToday(itinerary).todayDayId ?? "" : "";

  return <CaptureForm currentDayId={currentDayId} />;
}
