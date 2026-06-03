// app/journey-card-mockup/v14/alumni-index/page.tsx
// ⚠️  MOCKUP ONLY — overview page that links into the three alumni-index
// mockup options. Lives at /journey-card-mockup/v14/alumni-index.

import type { Metadata } from "next";
import AlumniIndexOverview from "./AlumniIndexOverview";

export const metadata: Metadata = {
  title:  "[MOCKUP] Alumni Journeys — Options Overview",
  description: "Overview of the three V14 alumni-index design options.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AlumniIndexOverview />;
}
