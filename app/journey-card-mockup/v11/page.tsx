// app/journey-card-mockup/v11/page.tsx
// ⚠️  MOCKUP ONLY — not wired to live data, auth, or backend systems.

import type { Metadata } from "next";
import JourneyCardV11 from "./JourneyCardV11";

export const metadata: Metadata = {
  title: "[MOCKUP v11] Journey Card — DAT",
  description:
    "v11: 9 sliding pages. Dedicated cover (PASSAGE, DAT stamp, headshot). Back cover image mosaic. SVG speaker/share icons. Adaptive photo grids. Web Audio ambient.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <JourneyCardV11 />;
}
