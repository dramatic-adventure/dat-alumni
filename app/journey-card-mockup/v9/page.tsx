// app/journey-card-mockup/v9/page.tsx
// ⚠️  MOCKUP ONLY — not wired to live data, auth, or backend systems.

import type { Metadata } from "next";
import JourneyCardV9 from "./JourneyCardV9";

export const metadata: Metadata = {
  title: "[MOCKUP v9] Journey Card — DAT",
  description:
    "v9: Light-ground landscape. Four zones — Cover, Editorial Spine, Photo Strip, Map. Isabel Martínez · PASSAGE Slovakia 2026.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <JourneyCardV9 />;
}
