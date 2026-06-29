// components/field-kit/ComingSoon.tsx
// Shared stub screen for Field Kit destinations that ship in later slices.

import { T, FONT } from "@/components/field-kit/tokens";

export default function ComingSoon({ title, blurb }: { title: string; blurb?: string }) {
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "72px clamp(18px, 5vw, 40px)", textAlign: "center" }}>
      <p style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: T.teal, margin: "0 0 12px" }}>
        The Companion
      </p>
      <h1 style={{ fontFamily: FONT.anton, fontSize: "clamp(30px, 7vw, 52px)", lineHeight: 0.95, textTransform: "uppercase", color: T.ink, margin: "0 0 16px" }}>
        {title}
      </h1>
      <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 15, lineHeight: 1.55, color: T.ink, opacity: 0.78, margin: 0 }}>
        {blurb ?? "Coming in a later slice. The Journey (itinerary) is live now — tap Journey below."}
      </p>
    </main>
  );
}
