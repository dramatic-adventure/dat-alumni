// app/journey-card-mockup/v14/embeds/page.tsx
// ⚠️  MOCKUP ONLY — faux UI mockups of how the journey card unfurls as a link
// preview on each major social platform. Static, not interactive. Useful for
// stakeholder review of share previews before launch.

import type { Metadata } from "next";
import EmbedMockups from "./EmbedMockups";

export const metadata: Metadata = {
  title:  "[MOCKUP] Embed Previews — Journey Card",
  description: "Faux share-preview mockups across iMessage, Slack, Twitter/X, Facebook, LinkedIn, and Instagram.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <EmbedMockups />;
}
