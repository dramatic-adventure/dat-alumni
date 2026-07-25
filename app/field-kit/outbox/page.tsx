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

  return <OutboxDiagnostics />;
}
