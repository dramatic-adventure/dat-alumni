// app/journey-card-mockup/v13/page.tsx
// ⚠️  MOCKUP ONLY — not wired to live data, auth, or backend systems.
//
// PER-PLATFORM SHARE PREVIEW STRATEGY
// Different platforms read different image dimensions. We advertise several
// variants in the OG image list so each crawler can pick the best one.
//
//   • Facebook / LinkedIn / Slack  → 1200×630 (1.91:1)
//   • Twitter / X (summary_large_image) → 1200×675 (16:9)
//   • Instagram / SMS link preview → 1080×1080 (1:1)
//   • Pinterest / Stories          → 1080×1920 (9:16)
//
// IN PRODUCTION we should generate these dynamically per participant using
// Next.js `opengraph-image.tsx` / `twitter-image.tsx` files colocated with
// this route (one file per size). For the mockup we point all variants at the
// same Squarespace hero crop with the proper aspect-ratio request params.
//
// WHEN THIS GOES LIVE:
//   • Remove `robots: { index: false, follow: false }` so the page is indexable.
//   • Replace the SHARE_* constants with values from the participant profile.
//   • Generate stable share images via /opengraph-image.tsx + /twitter-image.tsx.
//   • Add `alternates: { canonical: "https://dramaticadventure.com/journey/<slug>" }`.

import type { Metadata } from "next";
import JourneyCardV13 from "./JourneyCardV13";

const SHARE_TITLE = "Isabel Martínez · PASSAGE Slovakia 2026 — DAT Journey Card";
const SHARE_DESC  =
  "A first-person journey through Dramatic Adventure Theatre's PASSAGE Slovakia 2026 program — workshops, residencies, and the Roma youth storytelling work at Zemplínska Teplica.";

const SQUARESPACE_BASE =
  "https://images.squarespace-cdn.com/content/v1/6022114419b886404b1030fa/1688754593745-N9E8YZU0VE49QMQIOG4J/Marisa+Puller+007.jpg";

// Squarespace serves arbitrary crops via ?format=Xw — we request platform-fit sizes.
const OG_LANDSCAPE = `${SQUARESPACE_BASE}?format=1500w`; // Facebook / LinkedIn / Slack
const OG_TWITTER   = `${SQUARESPACE_BASE}?format=1500w`; // Twitter X large summary
const OG_SQUARE    = `${SQUARESPACE_BASE}?format=1500w`; // Instagram / iMessage
const OG_PORTRAIT  = `${SQUARESPACE_BASE}?format=1500w`; // Pinterest / Stories

export const metadata: Metadata = {
  title:       SHARE_TITLE,
  description: SHARE_DESC,
  openGraph: {
    title:       SHARE_TITLE,
    description: SHARE_DESC,
    type:        "article",
    siteName:    "Dramatic Adventure Theatre",
    images: [
      // 1.91:1 landscape — Facebook / LinkedIn / Slack pick the first valid one.
      { url: OG_LANDSCAPE, width: 1200, height: 630, alt: SHARE_TITLE },
      // 16:9 Twitter card.
      { url: OG_TWITTER,   width: 1200, height: 675, alt: SHARE_TITLE },
      // 1:1 square — iMessage and Instagram in-app browser previews.
      { url: OG_SQUARE,    width: 1080, height: 1080, alt: SHARE_TITLE },
      // 9:16 portrait — Pinterest / story-format crawlers.
      { url: OG_PORTRAIT,  width: 1080, height: 1920, alt: SHARE_TITLE },
    ],
  },
  twitter: {
    card:        "summary_large_image",
    title:       SHARE_TITLE,
    description: SHARE_DESC,
    images:      [OG_TWITTER],
  },
  // Keep this mockup out of search results.
  robots: { index: false, follow: false },
};

export default function Page() {
  return <JourneyCardV13 />;
}
