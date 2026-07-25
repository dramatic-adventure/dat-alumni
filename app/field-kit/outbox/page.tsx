// app/field-kit/outbox/page.tsx
//
// Outbox diagnostics — an on-device view of the three offline queues.
//
// Everything real happens client-side (the queues live in IndexedDB on the
// phone; the server has no idea what's unsent). This page exists only to gate
// access and mount the client component, matching the pattern in
// app/field-kit/traces/page.tsx.
//
// Reachable by any roster member, not just admins, ON PURPOSE: the stranded
// captures that matter most are on artists' phones, and the whole point is
// that they can read and fix their own outbox without a laptop.

import OutboxDiagnostics from "@/components/field-kit/OutboxDiagnostics";
import { requireFieldKitPage, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function OutboxPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const asId = Array.isArray(sp?.asId) ? sp?.asId[0] : sp?.asId;

  const access = await requireFieldKitPage(FIELD_KIT_PROGRAM_ID, asId);
  if (!access) return null; // not on the roster — the layout renders the gate.

  // Build stamp. An installed iOS web app can keep running an old JS bundle for
  // a long time after a deploy, and without this there is NO way to tell from
  // the device whether a fix is actually live — we burned a debugging round on
  // exactly that ambiguity. COMMIT_REF is injected by Netlify at build time;
  // "local" means a dev server. Rendered on the page and included in the copied
  // diagnostics so any report says which code produced it.
  const build = (process.env.COMMIT_REF || "local").slice(0, 7);

  return <OutboxDiagnostics build={build} />;
}
