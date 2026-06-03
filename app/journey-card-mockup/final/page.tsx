// app/journey-card-mockup/final/page.tsx
// ⚠️  MOCKUP ONLY — not wired to live data, auth, or backend systems.
// Safe to delete or keep as a dev reference.

import type { Metadata } from "next";
import JourneyCardFinal from "./JourneyCardFinal";

export const metadata: Metadata = {
  title: "[MOCKUP v2] Journey Card Final — DAT",
  description:
    "Second design pass on the DAT Journey Card artifact. Not production. No live data.",
  robots: { index: false, follow: false },
};

export default function JourneyCardFinalPage() {
  return <JourneyCardFinal />;
}
