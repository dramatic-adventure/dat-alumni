// app/field-kit/traces/page.tsx
//
// My Traces — Slice A read view. Shows the signed-in member's OWN captures only.
// The author is resolved server-side from the session email (never the URL), and
// the loader filters strictly by program + author (defense in depth).

import TracesList from "@/components/field-kit/TracesList";
import ImpersonationBanner from "@/components/field-kit/ImpersonationBanner";
import { requireFieldKitPage, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { loadCapturesForAuthor } from "@/lib/loadFieldKitCaptures";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function TracesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const asId = Array.isArray(sp?.asId) ? sp?.asId[0] : sp?.asId;

  // Defense in depth: gate before loading anything.
  const access = await requireFieldKitPage(FIELD_KIT_PROGRAM_ID, asId);
  if (!access) return null; // not on the roster — the layout renders the gate.

  // Author is the access record's resolved slug — the signed-in member, or the
  // impersonated roster member when an admin passed ?asId=… (never read raw from
  // the URL; getFieldKitAccess is what authorizes the swap).
  const authorSlug = access.slug;
  const captures = authorSlug ? await loadCapturesForAuthor(access.programId, authorSlug) : [];

  return (
    <>
      {access.impersonating && <ImpersonationBanner slug={access.slug} />}
      <TracesList captures={captures} />
    </>
  );
}
