// app/field-kit/admin/page.tsx
//
// Field Kit staff console (ADMIN-ONLY). The AccountMenu link to here is a
// convenience; THIS is the boundary: gate server-side with requireFieldKitPage
// (defense in depth — load no data for non-roster), then notFound() for any
// non-admin so the route is indistinguishable from a missing page.

import { notFound } from "next/navigation";
import AdminConsole from "@/components/field-kit/AdminConsole";
import { listNotifications } from "@/lib/notifications";
import { getRallyPoint } from "@/lib/rallyPoint";
import { requireFieldKitPage, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function FieldKitAdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const asId = Array.isArray(sp?.asId) ? sp?.asId[0] : sp?.asId;

  const access = await requireFieldKitPage(FIELD_KIT_PROGRAM_ID, asId);
  if (!access) return null; // not on the roster — the layout renders the gate.
  if (!access.isAdmin) notFound(); // admins only.

  const [history, rally] = await Promise.all([
    listNotifications(access.programId),
    getRallyPoint(access.programId),
  ]);

  return (
    <AdminConsole programId={access.programId} initialHistory={history} initialRally={rally} />
  );
}
