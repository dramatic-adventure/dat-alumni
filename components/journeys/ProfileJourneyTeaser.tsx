// components/journeys/ProfileJourneyTeaser.tsx
// Compact Journey Card teaser for the public alumni profile page. Renders ONLY
// when the alum has at least one live card — alumni with none get nothing, so
// the profile never shows an empty shell. This is the soft-launch entry point
// into /journeys (decided with Jesse 2026-07-03): no global nav/footer link
// until the archive holds a handful of real cards.

import "server-only";

import Link from "next/link";
import { loadJourneyCardsForSlug } from "@/lib/loadJourneyCards";
import JourneyCover from "./JourneyCover";
import { A } from "./journeyTheme";

const MAX_COVERS = 3;

// Subtle work-table scatter, matching the archive's casual card angles.
const ROTATIONS = [-2, 1.5, -1];

export default async function ProfileJourneyTeaser({
  slug,
  slugAliases,
}: {
  slug: string;
  slugAliases?: string[];
}) {
  let cards;
  try {
    cards = await loadJourneyCardsForSlug(slug, slugAliases);
  } catch {
    return null; // best-effort teaser; a Sheets hiccup must never break the profile
  }
  if (!cards.length) return null;

  const covers = cards.slice(0, MAX_COVERS);

  return (
    <section aria-label="Journey Cards" className="bg-[#241123]" style={{ padding: "3.5rem 1rem 3rem" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
        <p
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700,
            fontSize: "0.8rem",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: A.pink,
            margin: 0,
          }}
        >
          Journey Cards
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: "1.75rem",
            marginTop: "1.75rem",
          }}
        >
          {covers.map((card, i) => (
            <JourneyCover key={card.id} card={card} size="sm" rotation={ROTATIONS[i % ROTATIONS.length]} />
          ))}
        </div>

        <Link
          href={`/journeys/${slug}`}
          style={{
            display: "inline-block",
            marginTop: "2rem",
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 400,
            fontSize: "0.885rem",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: A.teal,
            textDecoration: "none",
          }}
        >
          View all journeys →
        </Link>
      </div>
    </section>
  );
}
