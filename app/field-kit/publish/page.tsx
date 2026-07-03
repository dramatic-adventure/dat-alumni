// app/field-kit/publish/page.tsx
//
// Review & Publish (Slice 6) — the ceremonial private→public handoff, ported
// from the approved mockup publish/PublishReview.tsx. The artist reviews the
// honest state of their draft (never punitive — "every Journey Card is
// different"), sees exactly what changes when they stamp, and presses the stamp.
//
// The stamp is gated on the capture queue being fully drained (media synced)
// and on connectivity — offline shows the warm hold, not an error. The write
// itself is the §4-R Q5 design: promote media (idempotent) → one idempotent
// append via the extended /api/alumni/journey with a client-minted card id.

import ImpersonationBanner from "@/components/field-kit/ImpersonationBanner";
import PublishClient from "@/components/field-kit/publish/PublishClient";
import { requireFieldKitPage, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { loadProgramItinerary } from "@/lib/loadProgram";
import { loadCapturesForAuthor } from "@/lib/loadFieldKitCaptures";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function PublishPage({
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

  // Sealed traces never appear in the publish flow (never offered to the card).
  const photoTraces = capturesAll
    .filter((c) => c.kind === "photo" && c.driveFileId && c.visibility !== "sealed")
    .map((c) => ({ captureId: c.captureId, driveFileId: c.driveFileId, bodyText: c.bodyText }));

  return (
    <>
      {access.impersonating && <ImpersonationBanner slug={access.slug} />}
      <PublishClient
        programId={access.programId}
        profileSlug={authorSlug}
        asId={access.impersonating ? access.slug : undefined}
        program={{
          program: itinerary?.program ?? "",
          location: itinerary?.location ?? "",
          country: itinerary?.country ?? "",
          year: itinerary?.year ?? "",
          dates: itinerary?.dates ?? "",
          label: itinerary?.label ?? "",
        }}
        photoTraces={photoTraces}
      />
    </>
  );
}
