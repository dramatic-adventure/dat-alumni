// app/journey-card-mockup/v10/page.tsx
// ⚠️  MOCKUP ONLY — not wired to live data, auth, or backend systems.

import type { Metadata } from "next";
import JourneyCardV10 from "./JourneyCardV10";

export const metadata: Metadata = {
  title: "[MOCKUP v10] Journey Card — DAT",
  description:
    "v10: Sliding-pages artifact. 7 chapters (Before + 5 stops + After). Web Audio ambient, adaptive photo grids, inline Slovakia map.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <JourneyCardV10 />;
}
