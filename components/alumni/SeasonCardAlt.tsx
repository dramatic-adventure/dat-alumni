"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

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
  const imageUrl = `/seasons/${slug}.jpg`;
  const seasonUrl = `/season/${slug.replace("season-", "")}`;

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
        className={`season-card ${isOpen ? "flipped" : ""}`}
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
          // Front face: pointer signals the card is interactive (flips on click).
          // Back face: default since navigation is via the explicit CTA button.
          cursor: isOpen ? "default" : "pointer",
        }}
        // Clicking the front flips to the back (discover) — navigation is on the back CTA.
        onClick={() => { if (!isOpen) setIsOpen(true); }}
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

          {/* Season title & year */}
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

          {/* "+" hint: tapping/clicking flips to projects */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            style={closeButtonStyle}
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
            padding: "1rem",
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

          {/* Project list — grows to fill available space */}
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

          {/* Bottom row: explicit CTA on the left, close button on the right */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "1rem",
            }}
          >
            <Link
              href={seasonUrl}
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
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
              }}
            >
              EXPLORE SEASON
            </Link>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              style={closeButtonStyle}
              aria-label="Close projects"
            >
              −
            </button>
          </div>
        </div>
      </div>

      {/* Hover flip on desktop only — reveals the back so the CTA is visible on hover */}
      <style jsx>{`
        @media (hover: hover) {
          .season-card:hover {
            transform: rotateY(180deg);
          }
        }
        .season-card.flipped {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}

const closeButtonStyle: React.CSSProperties = {
  width: "50px",
  height: "50px",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  fontSize: "2rem",
  fontWeight: "normal",
  color: "#FFCC00",
  cursor: "pointer",
};
