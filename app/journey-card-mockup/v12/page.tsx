// app/journey-card-mockup/v12/page.tsx
// ⚠️  MOCKUP ONLY — not wired to live data, auth, or backend systems.

import type { Metadata } from "next";
import JourneyCardV12 from "./JourneyCardV12";

export const metadata: Metadata = {
  title: "[MOCKUP v12] Journey Card — DAT",
  description:
    "v12: Links throughout (profile, drama clubs, program, DAT home). Larger headshot, repositioned stamp, hover effects, drama club pills, travel attribution.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <JourneyCardV12 />;
}
