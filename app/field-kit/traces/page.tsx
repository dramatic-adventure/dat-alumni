// app/field-kit/traces/page.tsx
//
// My Traces — Slice A read view. Shows the signed-in member's OWN captures only.
// The author is resolved server-side from the session email (never the URL), and
// the loader filters strictly by program + author (defense in depth).

import TracesList from "@/components/field-kit/TracesList";
import { requireFieldKitPage } from "@/lib/fieldKitAccess";
import { getAlumniIdForOwnerEmail } from "@/lib/ownership";
import { loadCapturesForAuthor } from "@/lib/loadFieldKitCaptures";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function TracesPage() {
  // Defense in depth: gate before loading anything.
  const access = await requireFieldKitPage();
  if (!access) return null; // not on the roster — the layout renders the gate.

  // Author is ALWAYS the signed-in member — resolved from the session email,
  // never read from the URL.
  const authorSlug = await getAlumniIdForOwnerEmail(process.env.ALUMNI_SHEET_ID || "", access.email);
  const captures = authorSlug ? await loadCapturesForAuthor(access.programId, authorSlug) : [];

  return <TracesList captures={captures} />;
}
