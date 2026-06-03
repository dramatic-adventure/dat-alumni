// app/journey-card-mockup/v14/alumni-index/option-c-stack/page.tsx
// ⚠️  MOCKUP ONLY — not wired to live data.
//
// Option C — a tactile "stack of passports" treatment. The most-recent
// journey sits on top; older journeys fan out beneath. Clicking a card
// raises it to the front. Editorial caption to the side.

import type { Metadata } from "next";
import OptionCStack from "./OptionCStack";

export const metadata: Metadata = {
  title:  "[MOCKUP] Alumni Journeys — Option C · Passport Stack",
  description: "Mockup of a fanned/stacked passport treatment for alumni journeys.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <OptionCStack />;
}
