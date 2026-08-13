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
  /**
   * This chapter's days as (id, ISO yyyy-mm-dd) pairs, in itinerary order.
   *
   * Carried so the auto-assembler can place a capture by WHEN it was taken, not
   * only by the chapterId the artist tagged it with (lib/journeyAutoComposer).
   * EMPTY is meaningful: a chapter with no day rows is scaffolding — a
   * pre-departure "ch0" that exists to catch packing and orientation captures —
   * and only appears on a card when something actually lands in it.
   */
  dayDates: { id: string; fullDate: string }[];
  /**
   * Effective IANA timezone for this chapter's days (chapter override → program
   * default). Date→day matching MUST run in this zone: a 10pm capture in
   * Bratislava is already the next day in UTC, and matching against the server's
   * clock would file every evening capture one day late.
   */
  timezone?: string;
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
    dayDates: ch.days
      .filter((d) => d.fullDate)
      .map((d) => ({ id: d.id, fullDate: d.fullDate })),
    timezone: ch.timezone || itinerary?.timezone || undefined,
    dateLabel:
      ch.days.length > 0
        ? [ch.days[0]?.dateLabel, ch.days[ch.days.length - 1]?.dateLabel]
            .filter(Boolean)
            .filter((v, i, a) => a.indexOf(v) === i)
            .join(" – ")
        : "",
  }));
}
