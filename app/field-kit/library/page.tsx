// app/field-kit/library/page.tsx
//
// The Field Library (Slice 5) — read-only shelf of program resources. Gates
// (defense in depth), reads the itinerary (the resources ride its payload +
// TTL caches), resolves the real "today" so "Relevant today" is computed from
// the live itinerary — never hardcoded. Offline: the page HTML is cached by the
// service worker's nav caching after first visit; opened files persist in the
// fk-lib cache (see FieldLibrary + public/sw.js).

import FieldLibrary from "@/components/field-kit/FieldLibrary";
import ImpersonationBanner from "@/components/field-kit/ImpersonationBanner";
import { requireFieldKitPage, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { loadProgramItinerary } from "@/lib/loadProgram";
import { resolveToday, dayById } from "@/lib/programItinerary";
import { T, FONT } from "@/components/field-kit/tokens";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const asId = Array.isArray(sp?.asId) ? sp?.asId[0] : sp?.asId;

  // Gate + itinerary read are independent — run concurrently (same shape as
  // Today/Capture; no waterfall).
  const [access, itinerary] = await Promise.all([
    requireFieldKitPage(FIELD_KIT_PROGRAM_ID, asId),
    loadProgramItinerary(FIELD_KIT_PROGRAM_ID),
  ]);
  if (!access) return null; // not on the roster — the layout renders the gate.
  if (!itinerary) return <LibraryEmpty />;

  const today = resolveToday(itinerary);
  const todayDay = today.todayDayId ? dayById(itinerary, today.todayDayId) : undefined;
  const todayLabel = todayDay
    ? `Day ${todayDay.dayNum}${todayDay.location ? ` · ${todayDay.location}` : ""}`
    : "";

  return (
    <>
      {access.impersonating && <ImpersonationBanner slug={access.slug} />}
      <FieldLibrary
        resources={itinerary.resources ?? []}
        programLabel={itinerary.label}
        todayDayId={today.todayDayId ?? ""}
        todayLabel={todayLabel}
      />
    </>
  );
}

function LibraryEmpty() {
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "72px clamp(18px, 5vw, 40px)", textAlign: "center" }}>
      <p style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: T.teal, margin: "0 0 12px" }}>
        Field Library
      </p>
      <h1 style={{ fontFamily: FONT.anton, fontSize: "clamp(28px, 6.5vw, 48px)", lineHeight: 0.96, textTransform: "uppercase", color: T.ink, margin: "0 0 16px" }}>
        The shelf is being stocked.
      </h1>
      <p style={{ fontFamily: FONT.dm, fontSize: 14.5, lineHeight: 1.55, color: T.ink, opacity: 0.78, margin: 0 }}>
        Resources for this trip land here as the road team adds them — scripts, maps, audio, and the
        practical stuff that makes the creative work possible.
      </p>
    </main>
  );
}
