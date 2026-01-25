"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { randomInt, randomFromArray, shuffleArray } from "@/utils/random";

type CommunityFeedItem = {
  id?: string;
  alumniId?: string;
  name?: string;
  slug?: string;
  text?: string; // composer update text
};

function personKey(u: UpdateItem): string {
  return u.alumniId || u.link || u.author || u.text;
}

function uniquePeopleCount(items: UpdateItem[]): number {
  const s = new Set(items.map(personKey));
  return s.size;
}

function dedupeByPerson(items: UpdateItem[]): UpdateItem[] {
  const seen = new Set<string>();
  const out: UpdateItem[] = [];
  for (const it of items) {
    const k = personKey(it);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

function toPanelUpdate(it: CommunityFeedItem): UpdateItem | null {
  // "text" is currentUpdateText, nothing else allowed
  const text = String(it?.text ?? "").trim();
  if (!text) return null;

  const slugOrId = it?.slug || it?.alumniId;

  return {
    alumniId: it.alumniId,
    author: String(it?.name ?? "ALUM").toUpperCase(),
    text,
    link: slugOrId ? `/alumni/${slugOrId}` : "/alumni",
  };
}

interface UpdateItem {
  text: string;
  link?: string;
  author?: string;
  alumniId?: string;
}

interface UpdatesPanelProps {
  updates: UpdateItem[];
  linkText: string;
  linkUrl: string;
  strictness?: number; // Extra control for clamping
  verticalOffset?: string; // Allows vertical adjustment
}

const DOODLES: DoodleType[] = ["underline", "circle"];
type DoodleType = "underline" | "circle";

const STAGE_DIRECTIONS = [
  "(smiling)",
  "(beat)",
  "(pauses for effect)",
  "(nervously adjusting notes)",
  "(confidently)",
  "(laughing softly)",
  "(leans forward)",
  "(whispering)",
  "(glancing around)",
  "(with a sly grin)",
  "(clutching the script tightly)",
  "(catching their breath)",
  "(with wide eyes)",
  "(voice trembling slightly)",
  "(gesturing broadly)",
  "(shaking their head)",
  "(breaking into laughter)",
  "(taking a deep breath)",
  "(wiping sweat from brow)",
  "(glancing toward the wings)",
  "(with sudden intensity)",
  "(slowly pacing)",
  "(raising an eyebrow)",
  "(holding back tears)",
  "(with a teasing tone)",
  "(in a hushed voice)",
  "(tilting head curiously)",
  "(with a heavy sigh)",
  "(nodding solemnly)",
  "(tapping foot impatiently)",
];

const SCENE_DESCRIPTIONS = [
  "A rehearsal room littered with dog-eared scripts.",
  "The humid air of the Amazon clings to everything.",
  "A graffiti-covered wall serves as the backdrop.",
  "An empty stage, lights buzzing overhead.",
  "The scent of coffee and old wood fills the room.",
  "A narrow street alive with distant music.",
  "Backstage chaos hums like a restless heartbeat.",
  "A lonely chair under a single spotlight.",
  "The whisper of leaves in a Galápagos breeze.",
  "A cracked mirror reflects dreams in fragments.",
  "Sweat drips in the heat of a makeshift rehearsal hall.",
  "A skyline shimmers through a dusty window.",
  "Sound of drums echoing from beyond the door.",
  "A cobblestone alley lit by a single lamp in Kosice.",
  "The sharp scent of eucalyptus rides the wind.",
  "A half-built set waits under the Ecuadorian sun.",
  "A battered suitcase rests against a Roma caravan.",
  "The hush of mountains holds a secret.",
  "Train tracks hum as twilight falls over Bratislava.",
  "Volcanic soil crunches beneath determined steps.",
  "A thatched roof casts shadows on worn wooden floors.",
  "The taste of salt lingers in a Galápagos breeze.",
  "A rusted gate swings open to a courtyard of stories.",
  "Echoes of laughter bounce through a Quito plaza.",
  "A dog sleeps in the shade of a crumbling wall.",
  "Paint peels from a door, revealing layers of history.",
  "The Andes stand guard under a silver sky.",
  "Strings of colored lights sway above a midnight café.",
  "The smell of rain mingles with fresh-cut cane.",
  "A weathered stage waits under a cathedral dome.",
  "Footprints vanish quickly in shifting jungle mud.",
];

const ROCK_SALT_PHRASES = [
  "Wow!",
  "Amazing.",
  "Let's go!",
  "Adventure time!",
  "Yes!!!",
  "Yay!",
  "Boom!",
  "Unreal!",
  "Crushing it!",
  "Magic!",
  "Go time!",
  "All in!",
  "Crush it!",
  "Brilliant.",
  "Epic!",
  "Bring it!",
  "Own it!",
  "Big win!",
  "Shazam!",
  "Rock on!",
  "Unstoppable!",
  "Game on!",
  "Let’s fly!",
  "Fire it up!",
  "Go big!",
  "Wild ride!",
  "Charge!",
  "Lights up!",
  "Here we go!",
  "Full throttle!",
  "Dream big!",
];

const STOPWORDS = [
  "and",
  "or",
  "the",
  "with",
  "for",
  "about",
  "a",
  "an",
  "by",
  "of",
  "to",
  "at",
  "in",
  "on",
  "is",
  "it",
  "as",
  "but",
  "if",
  "then",
  "from",
];

const LOCATION_WORDS = [
  "ecuador",
  "slovakia",
  "africa",
  "galápagos",
  "broadway",
  "nyc",
  "new york",
  "brno",
  "amazon",
  "rome",
  "italy",
  "kosice",
];

function weightedRandomSelection<T extends { weight: number }>(
  arr: T[],
  count: number
): T[] {
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

const renderText = (
  text: string,
  doodleMap: Record<number, { type: DoodleType; rotation: number; opacity: number; strokeWidth?: number; dashArray?: string }>
) => {
  const words = text.split(" ");
  return words.map((word, i) => {
    const doodle = doodleMap[i];
    return (
      <span key={i} style={{ position: "relative", display: "inline-block", padding: "0 2px" }}>
        {word}
        {doodle && (
  doodle.type === "underline" ? (
    <span
      style={{
        position: "absolute",
        bottom: "-3px",
        left: 0,
        width: "100%",
        height: "3px",
        backgroundColor: "#F23359",
        transform: `rotate(${doodle.rotation}deg)`,
        opacity: doodle.opacity,
      }}
    />
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        width: "140%",
        height: "170%",
        top: "-30%",
        left: "-20%",
        transform: `rotate(${doodle.rotation}deg)`,
        opacity: doodle.opacity,
      }}
      stroke="#F23359"
      strokeWidth={doodle.strokeWidth} // ✅ Stable now
      fill="none"
      strokeDasharray={doodle.dashArray} // ✅ Stable now
    >
      <ellipse cx="50%" cy="50%" rx="48%" ry="40%" />
    </svg>
  )
)}
      </span>
    );
  });
};


function selectUniqueRandomIndexes(max: number, count: number): number[] {
  const indexes: number[] = [];
  while (indexes.length < count) {
    const idx = randomInt(0, max - 1);
    if (!indexes.includes(idx)) indexes.push(idx);
  }
  return indexes;
}

function computePhraseStyle(
  horizontalPercent: number,
  containerWidth: number,
  paddingLeft: number,
  paddingRight: number,
  phraseWidth: number,
  rotation: number,
  strictness: number,
  verticalOffset: string
) {
  
  
  const innerWidth = containerWidth - paddingLeft - paddingRight;
  let leftValue =
    paddingLeft + innerWidth / 2 + innerWidth * (horizontalPercent / 100);

  const safeMargin = (innerWidth * (1 - strictness)) / 2;
  const minLeft = paddingLeft + innerWidth / 2 - safeMargin;
  const maxLeft = paddingLeft + innerWidth / 2 + safeMargin;

  if (leftValue < minLeft) leftValue = minLeft;
  if (leftValue > maxLeft) leftValue = maxLeft;

  if (leftValue + phraseWidth > containerWidth - paddingRight) {
    leftValue = containerWidth - paddingRight - phraseWidth;
  }
  if (leftValue < paddingLeft) {
    leftValue = paddingLeft;
  }

  return {
    position: "absolute",
    top: verticalOffset,
    left: `${leftValue}px`,
    transform: `rotate(${rotation}deg)`,
  } as React.CSSProperties;
}

export default function UpdatesPanel({
  updates,
  linkText,
  linkUrl,
  strictness = 0.5,
  verticalOffset = "-44%",
}: UpdatesPanelProps) {
  const [feedUpdates, setFeedUpdates] = useState<UpdateItem[] | null>(null);
  const [feedKey, setFeedKey] = useState<string>(""); // used to re-stabilize art when feed changes
  const containerRef = useRef<HTMLDivElement>(null);
  const phraseRefs = useRef<(HTMLSpanElement | null)[]>([]);
  // (removed phraseWidths — we measure per-item directly from phraseRefs when needed)
  const [containerSize, setContainerSize] = useState({
    width: 600,
    paddingLeft: 0,
    paddingRight: 0,
  });

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        if (containerRef.current) {
          const width = containerRef.current.offsetWidth;
          const style = getComputedStyle(containerRef.current);
          const paddingLeft = parseFloat(style.paddingLeft) || 0;
          const paddingRight = parseFloat(style.paddingRight) || 0;
          setContainerSize({ width, paddingLeft, paddingRight });
        }
      });

      resizeObserver.observe(containerRef.current);

      return () => resizeObserver.disconnect();
    }
  }, []);

    useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch("/api/alumni/community-feed?days=60&limit=6", {
          cache: "no-store",
        });
        const j = await res.json().catch(() => null);

        if (!alive) return;
        if (!res.ok || !j?.ok || !Array.isArray(j?.items)) {
          setFeedUpdates([]); // will fall back below
          setFeedKey("bad");
          return;
        }

        const mapped = (j.items as CommunityFeedItem[])
          .map(toPanelUpdate)
          .filter(Boolean) as UpdateItem[];

        // A simple stable key so the “random art” only regenerates when data truly changes
        const nextKey = mapped.map((u) => `${u.author}|${u.link}|${u.text}`).join("||");

        setFeedUpdates(mapped);
        setFeedKey(nextKey);
      } catch {
        if (!alive) return;
        setFeedUpdates([]); // will fall back below
        setFeedKey("err");
      }
    })();

    return () => {
      alive = false;
    };
  }, []);


  const fallbackUpdates: UpdateItem[] = [
    { author: "ALEX", text: "I just joined a new Broadway cast!", link: "/alumni/alex" },
    { author: "JAMIE", text: "I launched a theatre program in Ecuador.", link: "/alumni/jamie" },
    { author: "PRIYA", text: "I published a play about climate change.", link: "/alumni/priya" },
  ];

const incomingRaw =
  feedUpdates && feedUpdates.length > 0
    ? feedUpdates
    : updates.length > 0
    ? updates
    : fallbackUpdates;

const incoming =
  uniquePeopleCount(incomingRaw) > 3 ? dedupeByPerson(incomingRaw) : incomingRaw;

const baseUpdates = incoming.map((u) => ({
  ...u,
  text: String(u.text ?? "").trim(),
}));



  type DoodleMark = {
  type: DoodleType;
  rotation: number;
  opacity: number;
  strokeWidth?: number;
  dashArray?: string;
};

type StableUpdate = UpdateItem & {
  direction: string | null;
  rockSaltPhrase: string | null;
  horizontalPercent: number;
  rotation: number;
  doodleMap: Record<number, DoodleMark>;
  fontSize: number;
};

type StableData = {
  updates: StableUpdate[];
  randomAct: number;
  randomScene: number;
  randomSceneDescription: string;
};

const stableDataRef = useRef<StableData | null>(null);

  const stableKeyRef = useRef<string>("");

  if (!stableDataRef.current || stableKeyRef.current !== feedKey) {
    stableKeyRef.current = feedKey;

    const shuffledPhrases = shuffleArray([...ROCK_SALT_PHRASES]);
    const phraseIndexes = selectUniqueRandomIndexes(baseUpdates.length, 2);

    const totalDoodles = randomInt(
      Math.ceil(baseUpdates.length * 0.66),
      Math.ceil(baseUpdates.length * 1.0)
    );

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
        if (idx >= words.length - 3) weight += 6;
        if (/^[A-Z]/.test(word) && lower !== "i") weight += 4;

        allCandidates.push({ updateIndex: i, start: idx, weight });
      });
    });

    const selectedDoodles = weightedRandomSelection(allCandidates, totalDoodles);

    const doodleMapByUpdate: Record<
      number,
      Record<number, { type: DoodleType; rotation: number; opacity: number; strokeWidth?: number; dashArray?: string }>
    > = {};

    selectedDoodles.forEach((cand) => {
      if (!doodleMapByUpdate[cand.updateIndex]) doodleMapByUpdate[cand.updateIndex] = {};
      doodleMapByUpdate[cand.updateIndex][cand.start] = {
        type: randomFromArray(DOODLES),
        rotation: randomInt(-10, 10),
        opacity: parseFloat((Math.random() * 0.2 + 0.8).toFixed(2)),
        strokeWidth: randomInt(2, 4),
        dashArray: `${randomInt(140, 160)}, ${randomInt(15, 25)}`,
      };
    });

    const numDirections = randomInt(
      Math.ceil(baseUpdates.length * 0.33),
      Math.ceil(baseUpdates.length * 0.66)
    );
    const directionIndexes = selectUniqueRandomIndexes(baseUpdates.length, numDirections);
    const shuffledDirections = shuffleArray([...STAGE_DIRECTIONS]);

    stableDataRef.current = {
      updates: baseUpdates.map((u, i) => {
        const positionType = i === 0 ? "near" : "far";
        const horizontalPercent =
          positionType === "near"
            ? randomInt(5, 12) * (Math.random() > 0.5 ? 1 : -1)
            : randomInt(18, 24) * (Math.random() > 0.5 ? 1 : -1);

        return {
          ...u,
          direction: directionIndexes.includes(i) ? shuffledDirections.pop() || null : null,
          rockSaltPhrase:
            phraseIndexes.includes(i) && shuffledPhrases.length > 0 ? shuffledPhrases.pop()! : null,
          horizontalPercent,
          rotation: randomInt(-8, 8),
          doodleMap: doodleMapByUpdate[i] || {},
          fontSize: randomInt(14, 24),
        };
      }),
      randomAct: randomInt(1, 3),
      randomScene: randomInt(1, 10),
      randomSceneDescription: randomFromArray(SCENE_DESCRIPTIONS),
    };
  }

  const stableData = stableDataRef.current!;

  const innerWidthPx = Math.max(
    0,
    containerSize.width - containerSize.paddingLeft - containerSize.paddingRight
  );

  // cap for aesthetics on wide screens, but never exceed the container’s inner width
  const textBlockWidth = `${Math.min(420, innerWidthPx)}px`;

  return (
    <section
      ref={containerRef}
      style={{
        backgroundColor: "#F6E4C1",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        borderRadius: "8px",
        padding: "0.5rem",
        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h2
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "2rem",
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: "0.1rem",
          }}
        >
          Recent Updates
        </h2>
        <p style={{ margin: "0.1rem 0", fontSize: "1.2rem", fontWeight: 500, opacity: 0.5 }}>A Play in Progress</p>
        <p style={{ margin: "0.25rem 0", fontSize: "0.95rem", fontStyle: "italic", color: "#241123", opacity: 0.5 }}>
          ( inspired by actual events )
        </p>
        <p style={{ margin: "1.4rem 0 2.6rem 0", fontSize: "1.2rem", opacity: 0.5 }}>A New Scene by DAT Alumni</p>
        <h3
          style={{
            marginTop: "0.75rem",
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "1.15rem",
            fontWeight: 600,
            borderBottom: "2px solid #241123",
            display: "inline-block",
            paddingBottom: "0rem",
            marginBottom: "0.1rem",
            opacity: 0.5,
          }}
        >
          Act {stableData.randomAct}, Scene {stableData.randomScene}
        </h3>
        <p
          style={{
            fontSize: "1rem",
            color: "#241123",
            marginTop: "0rem",
            marginBottom: "3.25rem",
            width: "100%",
            maxWidth: textBlockWidth,
            margin: "0 auto",
            textAlign: "left",
            paddingInline: "2rem",
            boxSizing: "border-box",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            opacity: 0.5,
          }}
        >
          {stableData.randomSceneDescription}
        </p>
      </div>

      {/* Updates */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2.6rem" }}>
{stableData.updates.map((update, index) => {
  const fontSize = update.fontSize; // ✅ Stable now
  const phraseWidth = phraseRefs.current[index]?.offsetWidth || 0;

  return (
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
                {update.rockSaltPhrase && (
                  <span
                    ref={(el) => {
                      phraseRefs.current[index] = el;
                    }}
                    style={{
                      ...computePhraseStyle(
                      update.horizontalPercent,
                      containerSize.width,
                      containerSize.paddingLeft,
                      containerSize.paddingRight,
                      phraseWidth,
                      update.rotation,
                      strictness,
                      verticalOffset
                    ),
                      fontFamily: "var(--font-rock-salt), cursive",
                      fontSize: `${fontSize}px`,
                      color: "#F23359",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {update.rockSaltPhrase}
                  </span>
                )}
                <p
                  className="update-name"
                  style={{
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    color: "#241123",
                    marginBottom: "0.5rem",
                    display: "inline",
                  }}
                >
                  {update.author?.toUpperCase()}
                </p>
                {update.direction && (
                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: "#241123",
                      fontStyle: "italic",
                      textAlign: "left",
                      width: "100%",
                      maxWidth: textBlockWidth,
                      margin: "0 auto 0rem auto",
                      paddingInline: "2rem",
                      boxSizing: "border-box",
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                      opacity: 0.5,
                    }}
                  >
                    {update.direction}
                  </p>
                )}
                <p
                  className="update-dialogue"
                  style={{
                    fontSize: "1rem",
                    lineHeight: 1.5,
                    color: "#241123",
                    width: "100%",
                    maxWidth: textBlockWidth,
                    margin: "0 auto",
                    textAlign: "left",
                    paddingInline: "2rem",
                    boxSizing: "border-box",
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                  }}
                >
                  {renderText(update.text, update.doodleMap)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Button */}
      <div style={{ textAlign: "center", marginTop: "3.75rem", paddingBottom: "2rem" }}>
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
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.5")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {linkText}
        </Link>
      </div>
    </section>
  );
}

function handleHover(e: React.MouseEvent<HTMLDivElement>, isHover: boolean) {
  const nameEl = e.currentTarget.querySelector(".update-name") as HTMLElement;
  const dialogueSpans = e.currentTarget.querySelectorAll(".update-dialogue span");

  if (isHover) {
    nameEl.style.backgroundColor = "rgba(242, 51, 89, 0.85)";
    nameEl.style.color = "#241123";

    dialogueSpans.forEach((span) => {
      (span as HTMLElement).style.backgroundColor = "#FFCC00";
      (span as HTMLElement).style.display = "inline"; // ensures no extra block area
    });
  } else {
    nameEl.style.backgroundColor = "transparent";
    nameEl.style.color = "#241123";

    dialogueSpans.forEach((span) => {
      (span as HTMLElement).style.backgroundColor = "transparent";
    });
  }
}

