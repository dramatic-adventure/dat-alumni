"use client";

import Image from "next/image";
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
  const router = useRouter();
  const imageUrl = `/seasons/${slug}.jpg`;
  const seasonUrl = `/season/${slug.replace("season-", "")}`;

  const handleCardClick = () => {
    if (!isOpen) router.push(seasonUrl); // ✅ Navigate instantly
  };

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
          backgroundColor: "#241123", // DAT Dark Purple
          borderRadius: "12px",
          boxShadow: "0 6px 16px rgba(0, 0, 0, 0.3)",
          transformStyle: "preserve-3d",
          transition: "transform 0.6s ease",
          minHeight: "420px",
          cursor: "pointer",
        }}
        onClick={handleCardClick}
      >
        {/* ✅ FRONT */}
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
          {/* Image */}
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

          {/* Season & Year */}
          <h3
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
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
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "2rem",
              color: "#F23359",
              margin: "0 0 0.5rem 0",
              textAlign: "left",
            }}
          >
            {years}
          </p>

          {/* FRONT BUTTON (+) */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Stop navigation
              setIsOpen(true);
            }}
            style={buttonStyle}
            aria-label="Show projects"
          >
            +
          </button>
        </div>

        {/* ✅ BACK */}
        <div
          onClick={(e) => {
            if (isOpen) router.push(seasonUrl);
          }}
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
              fontFamily: "'Space Grotesk', sans-serif",
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
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "2rem",
              color: "#F23359",
              margin: "0 0 0.5rem 0",
              textAlign: "left",
            }}
          >
            {years}
          </p>
          <ul
            style={{
              listStyle: "none",
              opacity: 0.7,
              padding: 3,
              margin: 0,
              textAlign: "left",
            }}
          >
            {projects.map((proj, i) => (
              <li
                key={i}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
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

          {/* BACK BUTTON (−) */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Stop navigation
              setIsOpen(false);
            }}
            style={buttonStyle}
            aria-label="Close projects"
          >
            −
          </button>
        </div>
      </div>

      {/* ✅ Hover Flip (Desktop Only) */}
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

const buttonStyle: React.CSSProperties = {
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
