// lib/composerSpine.ts
//
// Slice 7 — the serializable per-chapter spine subset that both the Composer
// page (app/field-kit/composer/page.tsx) and the server-side auto-assembler
// (lib/journeyAutoAssemble.ts) derive from the itinerary. Extracted so the two
// can never drift: what the artist sees in Composer is exactly what the
// assembler grouped against. Pure (no IO) — structurally identical to
// ComposerClient's ComposerChapter type.

import type { ProgramItinerary, ItineraryAccent } from "@/lib/programItinerary";

export type SpineChapter = {
  id: string;
  num: number;
  verb: string;
  place: string;
  title: string;
  goal: string;
  prompt: string;
  accent: ItineraryAccent;
  dayIds: string[];
  dateLabel: string;
};

export function spineFromItinerary(itinerary: ProgramItinerary | null): SpineChapter[] {
  return (itinerary?.chapters ?? []).map((ch) => ({
    id: ch.id,
    num: ch.num,
    verb: ch.verb,
    place: ch.place,
    title: ch.title,
    goal: ch.goal,
    prompt: ch.prompt,
    accent: ch.accent,
    dayIds: ch.days.map((d) => d.id),
    dateLabel:
      ch.days.length > 0
        ? [ch.days[0]?.dateLabel, ch.days[ch.days.length - 1]?.dateLabel]
            .filter(Boolean)
            .filter((v, i, a) => a.indexOf(v) === i)
            .join(" – ")
        : "",
  }));
}
