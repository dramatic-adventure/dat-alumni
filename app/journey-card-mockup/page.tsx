// app/journey-card-mockup/page.tsx
// ⚠️  MOCKUP ONLY — not wired to live data, auth, or backend systems.
// Safe to delete or keep as a dev reference.

import type { Metadata } from "next";
import JourneyCardMockup from "./JourneyCardMockup";

export const metadata: Metadata = {
  title: "[MOCKUP] Journey Card — DAT",
  description: "Design prototype for the DAT Journey Card artifact. Not production.",
  robots: { index: false, follow: false },
};

export default function JourneyCardMockupPage() {
  return <JourneyCardMockup />;
}
