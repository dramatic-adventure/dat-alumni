// app/journey-card-mockup/v6/page.tsx
// ⚠️  MOCKUP ONLY — visual study. Not wired to data, auth, or backend.
// v6: Digital artifact composed from prompt-response units. Built the way the
//     polaroid-journal page is built — small handwritten captioned units
//     arranged on a composed page — not the way a magazine article is built.

import type { Metadata } from "next";
import JourneyCardV6 from "./JourneyCardV6";

export const metadata: Metadata = {
  title: "[MOCKUP v6] Journey Card — Prompt-Response Artifact",
  description:
    "Digital artifact built from the short prompts collected during PASSAGE: Slovakia 2026. Not production. No live data.",
  robots: { index: false, follow: false },
};

export default function JourneyCardV6Page() {
  return <JourneyCardV6 />;
}
