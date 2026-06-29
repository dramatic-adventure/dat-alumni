// app/field-kit/capture/page.tsx — stub destination (Quick Capture ships later).
import ComingSoon from "@/components/field-kit/ComingSoon";
import { requireFieldKitPage } from "@/lib/fieldKitAccess";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function CapturePage() {
  // Defense in depth: gate before rendering (the layout also gates).
  const access = await requireFieldKitPage();
  if (!access) return null; // not on the roster — the layout renders the gate.

  return <ComingSoon title="Capture" blurb="Quick Capture — field notes, quotes, photos, and voice — arrives in a later slice." />;
}
