// app/field-kit/cohort/page.tsx — stub destination (The Company ships later).
import ComingSoon from "@/components/field-kit/ComingSoon";
import { requireFieldKitPage } from "@/lib/fieldKitAccess";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function CohortPage() {
  // Defense in depth: gate before rendering (the layout also gates).
  const access = await requireFieldKitPage();
  if (!access) return null; // not on the roster — the layout renders the gate.

  return <ComingSoon title="The Company" blurb="Your cohort — who's with you today, and their stories — arrives in a later slice." />;
}
