// app/journey-card-mockup/v5/page.tsx
// ⚠️  MOCKUP ONLY — visual study. Not wired to data, auth, or backend.
// v5: Editorial study. One artifact composed as a magazine feature, drawing
//     directly from three references: a Japanese SPECIAL ISSUE photo spread,
//     a handmade Camino travel journal, and the SULTEN restaurant-guide page.

import type { Metadata } from "next";
import JourneyCardV5 from "./JourneyCardV5";

export const metadata: Metadata = {
  title: "[MOCKUP v5] Journey Card — Editorial Study",
  description:
    "Editorial-magazine study of the DAT Journey Card form. Not production. No live data.",
  robots: { index: false, follow: false },
};

export default function JourneyCardV5Page() {
  return <JourneyCardV5 />;
}
