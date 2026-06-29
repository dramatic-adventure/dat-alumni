// app/field-kit/traces/page.tsx — stub destination (My Traces ships later).
import ComingSoon from "@/components/field-kit/ComingSoon";
import { requireFieldKitPage } from "@/lib/fieldKitAccess";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function TracesPage() {
  // Defense in depth: gate before rendering (the layout also gates).
  const access = await requireFieldKitPage();
  if (!access) return null; // not on the roster — the layout renders the gate.

  return <ComingSoon title="Stories" blurb="My Traces — everything you've captured, and the path to a Journey Card — arrives in a later slice." />;
}
