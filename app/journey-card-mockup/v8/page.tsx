// app/journey-card-mockup/v8/page.tsx
// ⚠️  MOCKUP ONLY — not wired to live data, auth, or backend systems.

import type { Metadata } from "next";
import JourneyCardV8 from "./JourneyCardV8";

export const metadata: Metadata = {
  title: "[MOCKUP v8] Journey Card — DAT",
  description:
    "v8: Fixed landscape artifact. Four zones — Cover, Chapters, Photos, Map. Profile Embed below.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <JourneyCardV8 />;
}
