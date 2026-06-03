// app/journey-card-mockup/v7/page.tsx
// ⚠️  MOCKUP ONLY — not wired to live data, auth, or backend systems.

import type { Metadata } from "next";
import JourneyCardV7 from "./JourneyCardV7";

export const metadata: Metadata = {
  title: "[MOCKUP v7] Journey Card — DAT",
  description: "v7: Dark zine aesthetic. Prompt-response structure. Artist-first.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <JourneyCardV7 />;
}
