// components/journeys/JourneyBoard.tsx
// The Journey Board — a slim DAT-yellow "enamel sign" band inside the profile
// card (between the passport program stamps and Featured Stories) advertising
// an alum's Journey Cards. The whole band is one link into /journeys/[slug].
// Approved design: journey-teaser-mockup-v10.html (seam lines dropped).
//
// Client component: cards are loaded server-side in app/alumni/[slug]/page.tsx
// and passed down (ProfileCard is a client component and can't load its own).
// Dependency-free by design — CSS animations + one setInterval.

"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import type { JourneyCard } from "@/lib/journeyCard";
import { A } from "./journeyTheme";
import "./journeyBoard.css";

const CYCLE_MS = 6000;
// Matches the CSS opacity transition — text swaps once the old face has faded.
const SWAP_MS = 250;
const TILE_STAGGER_MS = 70;

type Face = {
  program: string;
  /** The big tile word — CITY, or COUNTRY when the card has no city yet. */
  big: string;
  /** Side-stack country; omitted when country IS the big word (no duplication). */
  country?: string;
  year: string;
};

function faceOf(card: JourneyCard): Face {
  const city = (card.city ?? "").trim();
  const country = (card.country ?? "").trim();
  return {
    program: card.program,
    big: (city || country).toUpperCase(),
    country: city ? country || undefined : undefined,
    year: (card.year ?? "").trim(),
  };
}

/** "2026" → "’26"; non-4-digit values pass through untouched. */
function shortYear(year: string): string {
  return /^\d{4}$/.test(year) ? `’${year.slice(2)}` : year;
}

export default function JourneyBoard({
  cards,
  slug,
}: {
  cards: JourneyCard[];
  slug: string;
}) {
  // Oldest → newest (plate order); the display starts on the NEWEST. sortDate
  // is the canonical recency key; journey year breaks ties (retro cards are
  // often created the same day, leaving their sortDates identical).
  const ordered = useMemo(
    () =>
      [...cards].sort(
        (a, b) =>
          String(a.sortDate ?? "").localeCompare(String(b.sortDate ?? "")) ||
          String(a.year ?? "").localeCompare(String(b.year ?? ""))
      ),
    [cards]
  );

  const [index, setIndex] = useState(ordered.length - 1);
  // True during the 250ms cross-fade-out before the face text swaps.
  const [swapping, setSwapping] = useState(false);
  // Tiles animate in only once the board has started cycling — the first paint
  // (and the whole one-card / reduced-motion experience) is static.
  const [cycling, setCycling] = useState(false);
  const swapTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (ordered.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setSwapping(true);
      swapTimer.current = window.setTimeout(() => {
        setCycling(true);
        setIndex((i) => (i + 1) % ordered.length);
        setSwapping(false);
      }, SWAP_MS);
    }, CYCLE_MS);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(swapTimer.current);
    };
  }, [ordered.length]);

  if (!ordered.length) return null;

  const single = ordered.length === 1;
  const face = faceOf(ordered[Math.min(index, ordered.length - 1)]);
  const chars = [...face.big];

  return (
    <Link
      href={`/journeys/${slug}`}
      className="jb-board"
      aria-label={single ? "Journey Card — open the journey" : "Journey Cards — open the field record"}
      style={{ "--jb-yellow": A.yellow, "--jb-ink": A.ink, "--jb-teal": A.teal } as CSSProperties}
    >
      <span className="jb-row1" aria-hidden="true">
        {/* key={index}: remount on advance so the browser paints a fresh node —
            mutating the text mid-opacity-transition can leave ghost glyphs of
            the longer previous word (seen in Safari: PASSAGE → "ACTIONE"). */}
        <span key={`p-${index}`} className={`jb-program${swapping ? " jb-swap" : ""}`}>
          {face.program}
        </span>
        <span className="jb-open">{single ? "Journey Card →" : "Journey Cards →"}</span>
      </span>

      <span className="jb-row2" aria-hidden="true">
        <span className={`jb-big${chars.length >= 9 ? " jb-big--long" : ""}`}>
          {chars.map((ch, i) =>
            ch === " " ? (
              <span key={`${index}-${i}`} className="jb-cell jb-cell--blank" />
            ) : (
              <span
                key={`${index}-${i}`}
                className={`jb-cell${cycling ? " jb-cell--in" : ""}`}
                style={cycling ? { animationDelay: `${i * TILE_STAGGER_MS}ms` } : undefined}
              >
                {ch}
              </span>
            )
          )}
        </span>
        {(face.country || face.year) && (
          <span key={`w-${index}`} className={`jb-where${swapping ? " jb-swap" : ""}`}>
            {face.country && <span className="jb-country">{face.country}</span>}
            {face.year && <span className="jb-year">{face.year}</span>}
          </span>
        )}
      </span>

      {!single && (
        <span className="jb-row3" aria-hidden="true">
          {ordered.map((card, i) => {
            const f = faceOf(card);
            return (
              <span key={card.id} className={`jb-plate${i === index ? " jb-plate--cur" : ""}`}>
                {f.big}
                {f.year && <b>{shortYear(f.year)}</b>}
              </span>
            );
          })}
        </span>
      )}
    </Link>
  );
}
