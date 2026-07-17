// app/field-kit/capture/page.tsx
//
// Quick Capture — Slice A (text-only note/quote, online). Gates (defense in
// depth), resolves the current itinerary day so each capture can carry a
// dayIndex, and renders the client form. POSTs land in the Field-Captures tab
// via /api/field-kit/capture, which re-derives author + program server-side.

import CaptureForm from "@/components/field-kit/CaptureForm";
import ImpersonationBanner from "@/components/field-kit/ImpersonationBanner";
import { requireFieldKitPage, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { loadProgramItinerary } from "@/lib/loadProgram";
import { resolveToday } from "@/lib/programItinerary";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function CapturePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const asId = Array.isArray(sp?.asId) ? sp?.asId[0] : sp?.asId;

  // Gate + itinerary read are independent (the gate always resolves to this
  // same FIELD_KIT_PROGRAM_ID), so run them concurrently rather than waiting
  // on the gate's Sheets round-trip before starting the itinerary's.
  const [access, itinerary] = await Promise.all([
    requireFieldKitPage(FIELD_KIT_PROGRAM_ID, asId),
    loadProgramItinerary(FIELD_KIT_PROGRAM_ID),
  ]);
  if (!access) return null; // not on the roster — the layout renders the gate.

  // Current itinerary day (readily available) → stamped onto each capture so a
  // note knows which program day it belongs to. Blank when none resolves.
  // Slice 6: the day's chapter rides along too, so the Composer can group
  // traces under the chapter they were captured in.
  const currentDayId = itinerary ? resolveToday(itinerary).todayDayId ?? "" : "";
  const currentChapterId =
    (currentDayId &&
      itinerary?.chapters.find((ch) => ch.days.some((d) => d.id === currentDayId))?.id) ||
    "";

  // All trip days (compact) → the form's "Capture day" picker. Lets an uploaded
  // photo/voice file auto-file under the day it was taken (matched by the file's
  // timestamp against fullDate), with a manual override for any capture.
  const days = itinerary
    ? itinerary.chapters.flatMap((ch) =>
        ch.days.map((d) => ({
          id: d.id,
          chapterId: ch.id,
          dayNum: d.dayNum,
          dateLabel: d.dateLabel,
          fullDate: d.fullDate,
        }))
      )
    : [];

  return (
    <>
      {access.impersonating && <ImpersonationBanner slug={access.slug} />}
      <CaptureForm currentDayId={currentDayId} currentChapterId={currentChapterId} days={days} />
    </>
  );
}
