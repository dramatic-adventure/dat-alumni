"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface SeasonCardProps {
  slug: string;
  seasonTitle: string;
  years: string;
  projects: string[];
}

export default function SeasonCardAlt({
  slug,
  seasonTitle,
  years,
  projects,
}: SeasonCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Hover tracked in JS so "−" can clear it and reliably unflip the card.
  // CSS-only hover fought React state: clicking "−" removed .flipped but
  // the cursor was still on the card so the CSS rule kept it visually flipped.
  const [isHovering, setIsHovering] = useState(false);
  const [ctaHovered, setCtaHovered] = useState(false);
  const router = useRouter();

  const imageUrl = `/seasons/${slug}.jpg`;
  const seasonUrl = `/season/${slug.replace("season-", "")}`;
  const isFlipped = isOpen || isHovering;

  return (
    <div
      style={{
        perspective: "1000px",
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <div
        className={`season-card ${isFlipped ? "flipped" : ""}`}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          backgroundColor: "#241123",
          borderRadius: "12px",
          boxShadow: "0 6px 16px rgba(0, 0, 0, 0.3)",
          transformStyle: "preserve-3d",
          transition: "transform 0.6s ease",
          minHeight: "420px",
          cursor: "pointer",
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => {
          // Front click → flip to back. Back click → navigate.
          if (isFlipped) {
            router.push(seasonUrl);
          } else {
            setIsOpen(true);
          }
        }}
      >
        {/* ── FRONT ─────────────────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            padding: "1rem",
            backfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            borderRadius: "12px",
          }}
        >
          {/* Season image */}
          <div
            style={{
              width: "100%",
              aspectRatio: "4 / 3",
              borderRadius: "12px",
              overflow: "hidden",
              marginBottom: "0.5rem",
            }}
          >
            <Image
              src={imageUrl}
              alt={`${seasonTitle} cover`}
              width={400}
              height={300}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "12px",
              }}
            />
          </div>

          <h3
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "3rem",
              fontWeight: 400,
              color: "#f2f2f2",
              margin: "0 0 0.25rem 0",
              textAlign: "left",
            }}
          >
            {seasonTitle}
          </h3>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "2rem",
              color: "#F23359",
              margin: "0 0 0.5rem 0",
              textAlign: "left",
            }}
          >
            {years}
          </p>

          {/* "+" — absolute bottom-right, same position as "−" on the back */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            style={cornerButtonStyle}
            aria-label="Show projects"
          >
            +
          </button>
        </div>

        {/* ── BACK ──────────────────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            // Extra bottom padding keeps the project list and CTA clear of the "−" button
            padding: "1rem 1rem 3.5rem",
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
            backgroundColor: "#241123",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "3rem",
              fontWeight: 400,
              color: "#f2f2f2",
              margin: "0 0 0.25rem 0",
              textAlign: "left",
            }}
          >
            {seasonTitle}
          </h3>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "2rem",
              color: "#F23359",
              margin: "0 0 0.5rem 0",
              textAlign: "left",
            }}
          >
            {years}
          </p>

          {/* Project list */}
          <ul
            style={{
              listStyle: "none",
              opacity: 0.7,
              padding: 3,
              margin: "0 0 auto 0",
              textAlign: "left",
            }}
          >
            {projects.map((proj, i) => (
              <li
                key={i}
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.9rem",
                  paddingTop: 4,
                  paddingBottom: 4,
                  color: "#f2f2f2",
                }}
              >
                {proj}
              </li>
            ))}
          </ul>

          {/* CTA — sits in flow above the "−" button area */}
          <Link
            href={seasonUrl}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              marginTop: "0.75rem",
              padding: "0.55rem 1.1rem",
              backgroundColor: "#FFCC00",
              color: "#241123",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.85rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              borderRadius: "6px",
              textDecoration: "none",
              opacity: ctaHovered ? 0.72 : 1,
              transition: "opacity 0.18s ease",
            }}
          >
            Explore Season
          </Link>

          {/* "−" — absolute bottom-right, same position as "+" on the front.
              Also clears isHovering so the card reliably returns to the front. */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              setIsHovering(false);
            }}
            style={cornerButtonStyle}
            aria-label="Close projects"
          >
            −
          </button>
        </div>
      </div>

      {/* Flip is driven entirely by JS state (isFlipped = isOpen || isHovering).
          No CSS hover rule needed — that was causing "−" to appear broken. */}
      <style jsx>{`
        .season-card.flipped {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}

// Shared style for "+" (front) and "−" (back) — both absolute at bottom-right.
const cornerButtonStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "0",
  right: "0",
  width: "50px",
  height: "50px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  fontSize: "2rem",
  fontWeight: "normal",
  color: "#FFCC00",
  cursor: "pointer",
  zIndex: 50,
};
