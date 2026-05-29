// lib/projectNarratives.ts
//
// Curated, irreducibly-human narrative content for archived project pages
// (/projects/[slug]). Everything that can be derived from data lives elsewhere
// (programMap, dramaClubMap, campaigns, productions, stories). This file holds
// only the editorial "soul" pieces that a human writes:
//
//   - essence  : a short tagline shown under the hero title
//   - lede     : the "what this was" paragraph opening The Journey section
//   - weeks    : optional manual stat ("3 weeks in the field")
//   - itinerary: the chapter snapshot (action verb + place + description).
//                NO cost or trip logistics — that lives on the evergreen
//                recruiting page only.
//
// AUTHORING NOTES:
//   - Keys are project slugs (must match programMap keys).
//   - Every field is optional. Anything absent simply doesn't render — the
//     page degrades gracefully and leans on the people/partnership instead.
//   - When no per-project essence exists, FAMILY_ESSENCE provides a fallback
//     keyed by program family (programMap.program).
//   - TODO: fill in narratives for the remaining projects over time. Only
//     PASSAGE: Slovakia 2026 is authored so far (mirrors the build mockup).

export type ProjectItineraryChapter = {
  /** Action verb + place, e.g. "Acclimate in Bratislava" */
  title: string;
  /** Short description — no cost or logistics. */
  description: string;
};

export type ProjectNarrative = {
  essence?: string;
  lede?: string;
  /** Manual stat: weeks in the field. Shown in the stats band when present. */
  weeks?: number;
  itinerary?: ProjectItineraryChapter[];
};

/**
 * Per-family essence fallback, keyed by programMap.program.
 * Mostly static per family — the irreducible one-liner for each program type.
 * TODO: confirm/extend copy with the team.
 */
export const FAMILY_ESSENCE: Record<string, string> = {
  PASSAGE: "Where the journey changes the maker.",
  // Others intentionally left empty for now — they render no essence line
  // until authored. Add entries like:
  //   "Creative Trek": "…",
  //   "ACTion": "…",
  //   "Teaching Artist Residency": "…",
};

export const projectNarratives: Record<string, ProjectNarrative> = {
  "passage-slovakia-2026": {
    essence: "Where the journey changes the maker.",
    weeks: 3,
    lede:
      "An immersive three-week artistic adventure across Slovakia — from the cultural capitals of Bratislava and Košice to the village of Zemplínska Teplica and the mountains of Slovenský Raj — culminating in an evening of eclectic performance shaped by travel, cross-cultural exchange, and shared creative work with Roma youth.",
    itinerary: [
      {
        title: "Acclimate in Bratislava",
        description:
          "The journey begins in Slovakia's capital — its lively old town, cobblestone streets, and towering castle set the stage, alongside the first creative workshops and meeting fellow traveling artists.",
      },
      {
        title: "Engage in Košice",
        description:
          "East to Košice, Europe's 2017 Capital of Culture and a UNESCO center for digital arts, where artists expand their work through co-creative workshops with a local theatre company.",
      },
      {
        title: "Connect in Zemplínska Teplica",
        description:
          "In a quiet village, we join long-time partner ETP Slovensko for community-driven storytelling workshops with Roma youth, building stories to perform together on stage.",
      },
      {
        title: "Create in Slovenský Raj",
        description:
          "In the mountain wilderness of 'Slovak Paradise,' artists rest, reflect, and develop their work among gorges, waterfalls, and the UNESCO-recognized Dobšinská Ice Cave.",
      },
      {
        title: "Perform in Košice",
        description:
          "Back in Košice's old town, the journey climaxes in a celebratory evening of eclectic shared work — acting, song, film, dance — inspired by the cross-cultural experience.",
      },
    ],
  },
};

/** Resolve the essence line for a project: per-project override → family fallback. */
export function resolveProjectEssence(
  slug: string,
  family?: string
): string | undefined {
  const narrative = projectNarratives[slug];
  if (narrative?.essence) return narrative.essence;
  if (family && FAMILY_ESSENCE[family]) return FAMILY_ESSENCE[family];
  return undefined;
}
