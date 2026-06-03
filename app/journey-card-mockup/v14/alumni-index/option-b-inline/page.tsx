// app/journey-card-mockup/v14/alumni-index/option-b-inline/page.tsx
// ⚠️  MOCKUP ONLY — not wired to live data.
//
// Option B — an inline "Journeys" section embedded directly into the
// /alumni/[slug] page, modeled on the existing photo/journey gallery patterns.
// Horizontal scroll-snap rail with rich captions.

import type { Metadata } from "next";
import OptionBInline from "./OptionBInline";

export const metadata: Metadata = {
  title:  "[MOCKUP] Alumni Journeys — Option B · Inline Rail",
  description: "Mockup of an inline alumni-profile rail of journey-card covers.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <OptionBInline />;
}
