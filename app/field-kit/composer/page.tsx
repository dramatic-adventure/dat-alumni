// app/field-kit/composer/page.tsx
//
// The Composer (Slice 6) — where the traveling artist shapes their own Traces
// into a Journey Card draft. Two faces in production (per the approved mockup
// composer/ComposerStudio.tsx): the Full Editor and the Private Preview. The
// mockup's Face 1 (Quick Capture) IS the existing /field-kit/capture screen —
// linked, not duplicated.
//
// Server side: gate (defense in depth), load the itinerary spine + the artist's
// own captures, and hand a serializable payload to the client. The draft itself
// is client-territory (IndexedDB + /api/field-kit/draft merge) so the editor
// works fully offline.
//
// Privacy: sealed captures are filtered OUT here — they are never offered to
// the card (slice-6 spec §4-R Q3). The Composer only ever sees "card" traces.

import ImpersonationBanner from "@/components/field-kit/ImpersonationBanner";
import ComposerClient from "@/components/field-kit/composer/ComposerClient";
import { requireFieldKitPage, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { loadProgramItinerary } from "@/lib/loadProgram";
import { loadCapturesForAuthor } from "@/lib/loadFieldKitCaptures";
import type { ComposerChapter, ComposerTrace } from "@/components/field-kit/composer/ComposerClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function ComposerPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const asId = Array.isArray(sp?.asId) ? sp?.asId[0] : sp?.asId;

  const [access, itinerary] = await Promise.all([
    requireFieldKitPage(FIELD_KIT_PROGRAM_ID, asId),
    loadProgramItinerary(FIELD_KIT_PROGRAM_ID),
  ]);
  if (!access) return null; // not on the roster — the layout renders the gate.

  const authorSlug = access.slug;
  const capturesAll = authorSlug
    ? await loadCapturesForAuthor(access.programId, authorSlug)
    : [];

  // Sealed reflections never leave the journal — never offered to the card.
  const traces: ComposerTrace[] = capturesAll
    .filter((c) => c.visibility !== "sealed")
    .map((c) => ({
      captureId: c.captureId,
      kind: c.kind,
      bodyText: c.bodyText,
      createdAt: c.createdAt,
      dayIndex: c.dayIndex,
      chapterId: c.chapterId,
      quoteSpeaker: c.quoteSpeaker,
      driveFileId: c.driveFileId,
    }));

  // Serializable itinerary spine subset — what the editor needs per chapter.
  const chapters: ComposerChapter[] = (itinerary?.chapters ?? []).map((ch) => ({
    id: ch.id,
    num: ch.num,
    verb: ch.verb,
    place: ch.place,
    title: ch.title,
    goal: ch.goal,
    prompt: ch.prompt,
    accent: ch.accent,
    dayIds: ch.days.map((d) => d.id),
    dateLabel:
      ch.days.length > 0
        ? [ch.days[0]?.dateLabel, ch.days[ch.days.length - 1]?.dateLabel]
            .filter(Boolean)
            .filter((v, i, a) => a.indexOf(v) === i)
            .join(" – ")
        : "",
  }));

  return (
    <>
      {access.impersonating && <ImpersonationBanner slug={access.slug} />}
      <ComposerClient
        programId={access.programId}
        authorSlug={authorSlug}
        asId={access.impersonating ? access.slug : undefined}
        program={{
          program: itinerary?.program ?? "",
          location: itinerary?.location ?? "",
          country: itinerary?.country ?? "",
          year: itinerary?.year ?? "",
          dates: itinerary?.dates ?? "",
          label: itinerary?.label ?? "",
        }}
        chapters={chapters}
        traces={traces}
      />
    </>
  );
}
