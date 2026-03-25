"use client";

import { useRef, useState } from "react";
import { DATButtonLink } from "@/components/ui/DATButton";

/* ============================================
   STYLE CONTROLS — TWEAK THESE VALUES
   ============================================ */

const ROOTS_STYLE = {
  // Sidebar background card
  cardBackground: "rgba(253, 246, 233, 0.6)", // 60% kraft
  cardBorderColor: "rgba(36, 17, 35, 0.18)",
  cardRadiusPx: 28,
  cardPaddingAll: "1.75rem", // top == right == bottom == left

  // Inner content width inside card (as percentage)
  innerWidthPercent: 90,

  // Process chip padding
  processChipPaddingY: "0.5rem",
  processChipPaddingX: "1.25rem",

  // Stages headline size
  stagesHeadlineFontSize: "1.15rem",

  // Stage cards
  stageRadius: "18px",
  stagePaddingBlock: "0.95rem",
  stagePaddingInline: "1.05rem",

  // Number “burned in” style
  numberFontSize: "3.75rem",
};

type Stage = {
  number: number;
  title: string;
  body: string;
};

type DramaClubRootsSidebarProps = {
  stages?: Stage[];
  eyebrow?: string;
  heading?: string;
  introPrimary?: string;
  introSecondary?: string;
  processLabel?: string;
  ctaHref?: string;
  className?: string;
};

const DEFAULT_STAGES: Stage[] = [
  {
    number: 1,
    title: "Spark",
    body: "In those first sessions, participants begin shaping stories drawn from their own lives and landscapes — discovering imagination, confidence, and possibility they may not have known they carried. That shared breakthrough becomes the spark that brings the group back together, again and again.",
  },
  {
    number: 2,
    title: "Club",
    body: "This dedicated group begins to form its own ensemble — gathering in classrooms, church halls, jungle clearings, community centers, or living rooms. Over time, their shared curiosity becomes a rhythm: a place where ideas and questions are tested, leadership emerges, and a community’s humor, history, and heartbeat find space to grow. This is when a Drama Club truly comes into being.",
  },
  {
    number: 3,
    title: "Mentorship",
    body: "As the club deepens, local leaders, older youth, and DAT Artists-in-Residence step in as mentors — guiding rehearsals, strengthening collaboration, and nurturing both artistic and personal growth. With support, young artists learn to direct, organize, communicate, and shape stories that speak to the needs and dreams of their own community. Mentorship turns a gathering of young creators into a force of local leadership.",
  },
  {
    number: 4,
    title: "Legacy",
    body: "Clubs begin creating original performances rooted in local stories, traditions, and urgent questions — sharing them with families, neighbors, and the wider community. Many continue for years, even between DAT visits, growing new artists and leaders who carry the work forward. Over time, a Drama Club becomes part of the cultural fabric of the community — preserving what matters, nurturing what’s emerging, and giving young people a space to dream boldly for their future.",
  },
];

export default function DramaClubRootsSidebar({
  stages = DEFAULT_STAGES,
  eyebrow = "FROM SPARK TO LEGACY",
  heading = "HOW A DRAMA CLUB TAKES ROOT",
  introPrimary = "Drama Clubs take root when local artists, emerging creators, community leaders, and visiting DAT teaching artists gather around a moment of creative possibility — often a single DAT workshop that invites curiosity, voice, and play.",
  introSecondary = "Drama Clubs evolve over time: a spark of interest becomes a consistent place for young people to meet; youth artists take on leadership roles; older ensembles mentor newer ones; and eventually, some clubs become lasting cultural anchors in their region.",
  processLabel = "SPARK → CLUB → MENTORSHIP → LEGACY",
  ctaHref = "/contact",
  className,
}: DramaClubRootsSidebarProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredArrow, setHoveredArrow] = useState<"left" | "right" | null>(
    null
  );
  const trackRef = useRef<HTMLDivElement | null>(null);

  const handleArrow = (direction: "prev" | "next") => {
    if (!trackRef.current) return;

    const maxIndex = stages.length - 1;
    const nextIndex =
      direction === "next"
        ? Math.min(activeIndex + 1, maxIndex)
        : Math.max(activeIndex - 1, 0);

    if (nextIndex === activeIndex) return;

    setActiveIndex(nextIndex);

    const container = trackRef.current;
    const target = container.children[nextIndex] as HTMLElement | undefined;
    if (!target) return;

    // Snap the container so the target card is fully in view (no half cards)
    const left = target.offsetLeft;
    container.scrollTo({ left, behavior: "smooth" });
  };

  return (
    <aside
      className={`border ${className ?? ""}`}
      style={{
        borderRadius: ROOTS_STYLE.cardRadiusPx,
        borderColor: ROOTS_STYLE.cardBorderColor,
        backgroundColor: ROOTS_STYLE.cardBackground,
        padding: ROOTS_STYLE.cardPaddingAll,
        margin: "2.5rem 0", // vertical buffer only; width is controlled by parent
        fontFamily:
          "var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* All content limited to 90% width (adjust in ROOTS_STYLE) */}
      <div
        style={{
          width: `${ROOTS_STYLE.innerWidthPercent}%`,
          margin: "0 auto",
        }}
      >
        {/* Eyebrow – tight to heading */}
        <p
          className="mb-0 text-center text-[0.7rem] uppercase tracking-[0.22em] text-[#F23359]"
          style={{
            fontFamily:
              "var(--font-space-grotesk), system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          {eyebrow}
        </p>

        {/* Main heading */}
        <h2
          className="mb-3 text-center leading-tight text-[#241123]"
          style={{
            fontFamily:
              "var(--font-anton), system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: "clamp(1.8rem, 3.5vw, 3.5rem)",
            textTransform: "uppercase",
            marginTop: 0,
          }}
        >
          {heading}
        </h2>

        {/* Intro – LEFT ALIGNED */}
        <p
          className="mb-4 text-left text-[0.9rem] leading-relaxed text-[#2b1a2a]"
          style={{
            fontFamily:
              "var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          {introPrimary}<br/><br/>
          {introSecondary}
        </p><br/>

        {/* Process chip */}
        <div className="mb-6 flex justify-center">
          <div
            className="inline-flex items-center justify-center rounded-full border text-[0.7rem] uppercase tracking-[0.18em] text-[#241123]"
            style={{
              borderColor: "rgba(36,17,35,0.25)",
              paddingBlock: ROOTS_STYLE.processChipPaddingY,
              paddingInline: ROOTS_STYLE.processChipPaddingX,
              fontFamily:
                "var(--font-space-grotesk), system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            {processLabel}
          </div>
        </div>

        {/* Stages headline */}
        <p
          className="mb-3 text-center uppercase text-[#241123]"
          style={{
            fontFamily:
              "var(--font-space-grotesk), system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: ROOTS_STYLE.stagesHeadlineFontSize,
            letterSpacing: "0.22em",
          }}
        >
          FOUR STAGES OF A DRAMA CLUB’S LIFE
        </p>

        

        {/* =========================
            STAGE SLIDER
        ========================== */}
        <div
          style={{
            position: "relative",
            marginTop: "1.25rem",
            marginBottom: "1.75rem",
          }}
        >
          <div
            ref={trackRef}
            style={{
              display: "flex",
              gap: "1.5rem",
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              scrollBehavior: "smooth",
              paddingBottom: "0.75rem",
            }}
          >
            {stages.map((stage) => (
              <div
                key={stage.number}
                style={{
                  flex: "0 0 100%", // one full card per “page”
                  scrollSnapAlign: "start",
                }}
              >
                <StageCard stage={stage} />
              </div>
            ))}
          </div>

          {/* Arrows */}
          <button
            type="button"
            onClick={() => handleArrow("prev")}
            style={arrowStyle("left", hoveredArrow === "left")}
            onMouseEnter={() => setHoveredArrow("left")}
            onMouseLeave={() => setHoveredArrow(null)}
            aria-label="Previous stage"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => handleArrow("next")}
            style={arrowStyle("right", hoveredArrow === "right")}
            onMouseEnter={() => setHoveredArrow("right")}
            onMouseLeave={() => setHoveredArrow(null)}
            aria-label="Next stage"
          >
            ›
          </button>
        </div>

        {/* Closing copy – LEFT ALIGNED */}
        <p
          className="mb-4 text-left text-[0.85rem] leading-relaxed text-[#2b1a2a]"
          style={{
            fontFamily:
              "var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          Every Drama Club is unique. The role of DAT is to help it take root,
          support local leaders, and keep showing up — so that young artists can
          rise with confidence, tell their stories, and make a difference within
          their communities.
        </p>

        {/* CTA – CENTERED */}
        <div className="mt-2 border-t border-[rgba(36,17,35,0.16)] pt-4 text-center">
          <p
            className="mb-2 text-[1.8rem] text-[#2b1a2a]"
            style={{
              fontFamily:
                "var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            Want to help a DAT Drama Club take root in your community?
          </p>

          <div className="mt-1 flex justify-center">
            <DATButtonLink href={ctaHref} variant="pink" size="md">
              Start the conversation
            </DATButtonLink>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* =========================
   Stage Card (shared)
========================= */

function StageCard({ stage }: { stage: Stage }) {
  return (
    <div
      className="relative"
      style={{
        backgroundColor: "rgba(242, 51, 89, 0.2)",
        borderRadius: ROOTS_STYLE.stageRadius,
        paddingBlock: ROOTS_STYLE.stagePaddingBlock,
        paddingInline: ROOTS_STYLE.stagePaddingInline,
        border: "1px solid rgba(36, 17, 35, 0.12)",
      }}
    >
      {/* Header row: number in left corner, title centered */}
      <div
        style={{
          position: "relative",
          marginBottom: "0.85rem",
          paddingTop: "0.25rem",
          paddingBottom: "0.25rem",
        }}
      >
        {/* Burned-in number – stays in left corner */}
        <span
          style={{
            position: "absolute",
            left: "0.85rem",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: ROOTS_STYLE.numberFontSize,
            fontWeight: 700,
            color: "rgba(187, 24, 57, 0.3)", // darker, low-opacity red
            fontFamily:
              "var(--font-anton), system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            lineHeight: 1,
          }}
        >
          {stage.number}
        </span>

        {/* Title, centered in the card */}
        <p
          className="uppercase tracking-[0.2em] text-[#241123]"
          style={{
            fontFamily:
              "var(--font-anton), system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: "2rem",
            margin: 0,
            textAlign: "center",
          }}
        >
          {stage.title}
        </p>
      </div>

      {/* Stage body – LEFT ALIGNED */}
      <p
        className="text-left text-[0.78rem] leading-relaxed text-[#2b1a2a]"
        style={{
          fontFamily:
            "var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {stage.body}
      </p>
    </div>
  );
}

/* =========================
   Arrow Style (DAT aesthetic)
========================= */

function arrowStyle(position: "left" | "right", isHovered: boolean) {
  const isLeft = position === "left";

  return {
    position: "absolute" as const,
    top: "47%", // slightly higher than 50% so it sits a bit above center
    [position]: "0",
    transform: `translate(${isLeft ? "-140%" : "140%"}, -50%)`,
    backgroundColor: "rgba(255, 204, 0, 0.33)", // very soft, low-opacity yellow
    color: "#241123",
    border: "none",
    width: "30px", // smaller circle
    height: "30px",
    borderRadius: "50%",
    fontSize: "1.6rem", // slightly smaller chevron
    fontWeight: 600,
    cursor: "pointer",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: isHovered
      ? "0px 3px 6px rgba(0,0,0,0.22)"
      : "0px 2px 4px rgba(0,0,0,0.18)",
    transition: "all 0.25s ease",
    opacity: isHovered ? 1 : 0.65, // barely noticeable, lift on hover
  };
}
