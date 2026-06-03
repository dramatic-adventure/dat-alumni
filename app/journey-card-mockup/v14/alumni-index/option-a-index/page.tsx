// app/journey-card-mockup/v14/alumni-index/option-a-index/page.tsx
// ⚠️  MOCKUP ONLY — not wired to live data.
//
// Option A — dedicated editorial index at /alumni/[slug]/journeys.
// Reads like a magazine table of contents: hero header, then each journey
// gets a full-bleed row pairing the passport cover with editorial metadata.

import type { Metadata } from "next";
import OptionAIndex from "./OptionAIndex";

export const metadata: Metadata = {
  title:  "[MOCKUP] Alumni Journeys — Option A · Editorial Index",
  description: "Mockup of a dedicated /alumni/[slug]/journeys editorial index page.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <OptionAIndex />;
}
