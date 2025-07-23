"use client";

import React, { useState } from "react";
import Link from "next/link";
import { randomInt, randomFromArray, shuffleArray } from "@/utils/random";

interface UpdateItem {
  text: string;
  link?: string;
  author?: string;
}

interface UpdatesPanelProps {
  updates: UpdateItem[];
  linkText: string;
  linkUrl: string;
}

// ✅ Constants
const DOODLES: DoodleType[] = ["underline", "circle"];
type DoodleType = "underline" | "circle";

const STAGE_DIRECTIONS = [
  "(smiling)",
  "(with excitement)",
  "(pauses for effect)",
  "(nervously adjusting notes)",
  "(confidently)",
  "(laughing softly)",
  "(leans forward)",
];

const ROCK_SALT_PHRASES = ["Wow!", "Amazing.", "Let's GooOo!!", "Adventure time!", "Yes!!!", "Yay!"];

const STOPWORDS = [
  "and", "or", "the", "with", "for", "about", "a", "an", "by", "of", "to", "at", "in", "on", "is", "it", "as", "but", "if", "then", "from"
];

const LOCATION_WORDS = [
  "ecuador", "slovakia", "africa", "galápagos", "broadway", "nyc", "new york", "brno", "amazon", "rome", "italy", "kosice"
];

const AVERAGE_DOODLES_PER_UPDATE = 0.85; // ✅ For 3 updates → about 2–3 doodles total

// ✅ Main Component
export default function UpdatesPanel({ updates, linkText, linkUrl }: UpdatesPanelProps) {
  const fallbackUpdates: UpdateItem[] = [
    { author: "ALEX", text: "I just joined a new Broadway cast!", link: "/alumni/alex" },
    { author: "JAMIE", text: "I launched a theatre program in Ecuador.", link: "/alumni/jamie" },
    { author: "PRIYA", text: "I published a play about climate change.", link: "/alumni/priya" },
  ];

  const baseUpdates = updates.length > 0
    ? updates.map((u) => ({ ...u, text: ensureFirstPerson(u.text) }))
    : fallbackUpdates;

  // ✅ Precompute everything ONCE
  const [stableUpdates] = useState(() => {
    const shuffledPhrases = shuffleArray([...ROCK_SALT_PHRASES]);
    const phraseIndexes = selectUniqueRandomIndexes(baseUpdates.length, 2);

    // Determine total doodles for the whole panel (0.66–1.0 per update)
    const totalDoodles = randomInt(
      Math.ceil(baseUpdates.length * 0.66),
      Math.ceil(baseUpdates.length * 1.0)
    );

    // Prepare pool for doodles
    const allCandidates: { updateIndex: number; start: number; weight: number }[] = [];

    baseUpdates.forEach((u, i) => {
      const words = u.text.split(" ");
      words.forEach((word, idx) => {
        const lower = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
        if (!lower || STOPWORDS.includes(lower) || lower.length <= 3) return;

        let weight = 1;
        if (LOCATION_WORDS.includes(lower)) weight += 10;
        if (/^[A-Z]{2,}$/.test(word)) weight += 8;
        if (/^".+"$/.test(word)) weight += 8;
        if (idx >= words.length - 3) weight += 6; // object-of-sentence bias
        if (/^[A-Z]/.test(word) && lower !== "i") weight += 4;

        allCandidates.push({ updateIndex: i, start: idx, weight });
      });
    });

    const selectedDoodles = weightedRandomSelection(allCandidates, totalDoodles);
    const doodleMapByUpdate: Record<number, Record<number, DoodleType>> = {};

    selectedDoodles.forEach((cand) => {
      if (!doodleMapByUpdate[cand.updateIndex]) doodleMapByUpdate[cand.updateIndex] = {};
      doodleMapByUpdate[cand.updateIndex][cand.start] = randomFromArray(DOODLES);
    });

    return baseUpdates.map((u, i) => ({
      ...u,
      direction: Math.random() > 0.6 ? randomFromArray(STAGE_DIRECTIONS) : null,
      doodleMap: doodleMapByUpdate[i] || {},
      rockSaltPhrase: phraseIndexes.includes(i) ? shuffledPhrases.pop() || null : null,
    }));
  });

  return (
    <section
      style={{
        backgroundColor: "#F6E4C1",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        borderRadius: "8px",
        padding: "1.5rem",
        fontFamily: "'Courier Prime', monospace",
      }}
    >
      {/* Title */}
      <p
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "1.7rem",
          fontWeight: 500,
          textAlign: "center",
          textTransform: "uppercase",
          marginBottom: "2rem",
          color: "#241123",
        }}
      >
        Recent Updates
      </p>

      {/* Updates */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {stableUpdates.map((update, index) => (
          <Link
            key={index}
            href={update.link || "#"}
            style={{ textDecoration: "none", color: "inherit", display: "block" }}
          >
            <div
              style={{ textAlign: "center", padding: "0.25rem 0", position: "relative" }}
              onMouseEnter={(e) => handleHover(e, true)}
              onMouseLeave={(e) => handleHover(e, false)}
            >
              {/* Rock Salt Phrase */}
              {update.rockSaltPhrase && (
                <span
                  style={{
                    position: "absolute",
                    top: "-28px",
                    left: randomInt(5, 60) + "%",
                    transform: `rotate(${randomInt(-12, 12)}deg)`,
                    fontFamily: "'Rock Salt', cursive",
                    fontSize: `${randomInt(16, 26)}px`,
                    color: "#F23359",
                  }}
                >
                  {update.rockSaltPhrase}
                </span>
              )}

              {/* Name */}
              <p
                className="update-name"
                style={{
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  color: "#241123",
                  marginBottom: "0.5rem",
                  display: "inline-block",
                  padding: "0 0.3rem",
                  transition: "all 0.3s ease",
                }}
              >
                {update.author?.toUpperCase()}
              </p>

              {/* Stage direction */}
              {update.direction && (
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "#444",
                    fontStyle: "italic",
                    textAlign: "left",
                    maxWidth: "400px",
                    margin: "0 auto 0.4rem auto",
                    paddingLeft: "2rem",
                  }}
                >
                  {update.direction}
                </p>
              )}

              {/* Dialogue */}
              <p
                className="update-dialogue"
                style={{
                  fontSize: "1rem",
                  lineHeight: 1.5,
                  color: "#241123",
                  maxWidth: "400px",
                  margin: "0 auto",
                  textAlign: "left",
                  paddingLeft: "3rem",
                }}
              >
                {renderText(update.text, update.doodleMap)}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Button */}
      <div style={{ textAlign: "center", marginTop: "3rem", paddingBottom: "2rem" }}>
        <Link
          href={linkUrl}
          style={{
            backgroundColor: "#6C00AF",
            color: "#fff",
            padding: "1rem 1.5rem",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 400,
            fontSize: "0.95rem",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            display: "inline-block",
            transition: "opacity 0.3s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {linkText}
        </Link>
      </div>
    </section>
  );
}

// ✅ Hover logic
function handleHover(e: React.MouseEvent<HTMLDivElement>, isHover: boolean) {
  const nameEl = e.currentTarget.querySelector(".update-name") as HTMLElement;
  const dialogueEl = e.currentTarget.querySelector(".update-dialogue") as HTMLElement;

  if (isHover) {
    nameEl.style.backgroundColor = "rgba(242, 51, 89, 0.85)";
    nameEl.style.color = "#241123";
    dialogueEl.style.backgroundColor = "#FFCC00";
  } else {
    nameEl.style.backgroundColor = "transparent";
    nameEl.style.color = "#241123";
    dialogueEl.style.backgroundColor = "transparent";
  }
}

// ✅ Ensure first-person
function ensureFirstPerson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.toLowerCase().startsWith("i ")) return trimmed;
  return `I ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
}

// ✅ Weighted random selection
function weightedRandomSelection<T extends { weight: number }>(arr: T[], count: number): T[] {
  const result: T[] = [];
  let pool = [...arr];
  while (result.length < count && pool.length > 0) {
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    const rand = Math.random() * totalWeight;
    let running = 0;
    for (let i = 0; i < pool.length; i++) {
      running += pool[i].weight;
      if (rand <= running) {
        result.push(pool[i]);
        pool.splice(i, 1);
        break;
      }
    }
  }
  return result;
}

// ✅ Render text with doodles
function renderText(text: string, doodleMap: Record<number, DoodleType>) {
  const words = text.split(" ");
  return words.map((word, i) => (
    <span key={i} style={{ position: "relative", display: "inline-block", padding: "0 2px" }}>
      {word}
      {doodleMap[i] && renderDoodle(doodleMap[i])}
    </span>
  ));
}

// ✅ Render doodles (UNCHANGED STYLE)
function renderDoodle(type: DoodleType): React.ReactNode {
  const opacity = (Math.random() * 0.2 + 0.8).toFixed(2);
  const rotation = randomInt(-10, 10);

  switch (type) {
    case "underline":
      return (
        <span
          style={{
            position: "absolute",
            bottom: "-3px",
            left: 0,
            width: "100%",
            height: "3px",
            backgroundColor: "#F23359",
            transform: `rotate(${rotation}deg)`,
            opacity,
          }}
        />
      );
    case "circle":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: "absolute",
            width: "140%",
            height: "170%",
            top: "-30%",
            left: "-20%",
            transform: `rotate(${rotation}deg)`,
            opacity,
          }}
          stroke="#F23359"
          strokeWidth={randomInt(2, 4)}
          fill="none"
          strokeDasharray={`${randomInt(140, 160)}, ${randomInt(15, 25)}`}
        >
          <ellipse cx="50%" cy="50%" rx="48%" ry="40%" />
        </svg>
      );
  }
}

// ✅ Utility for picking multiple unique indexes
function selectUniqueRandomIndexes(max: number, count: number) {
  const indexes: number[] = [];
  while (indexes.length < count) {
    const idx = randomInt(0, max - 1);
    if (!indexes.includes(idx)) indexes.push(idx);
  }
  return indexes;
}
