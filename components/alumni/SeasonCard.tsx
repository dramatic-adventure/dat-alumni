"use client";

import Image from "next/image";
import Link from "next/link";

interface SeasonCardProps {
  slug: string;
  seasonTitle: string;
  years: string;
  projects: string[];
}

export default function SeasonCard({
  slug,
  seasonTitle,
  years,
  projects,
}: SeasonCardProps) {
  const imageUrl = `/seasons/${slug}.jpg`;

  return (
    <Link
      href={`/season/${slug.replace("season-", "")}`}
      aria-label={`View details for ${seasonTitle}`}
      className="group rounded-lg overflow-hidden transition-transform duration-300"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "transparent",
        textDecoration: "none",
      }}
    >
      {/* ✅ Image Section */}
      <div className="relative w-full aspect-[3/2] overflow-hidden rounded-md">
        <Image
          src={imageUrl}
          alt={`${seasonTitle} cover`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* ✅ Hover Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* ✅ Text Section */}
      <div
        className="flex flex-col flex-1"
        style={{
          paddingTop: "0.25rem", // ✅ Minimal gap from image
          paddingRight: "0rem",
          paddingBottom: "1.5rem",
          paddingLeft: "0rem",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "3rem",
            fontWeight: 400,
            color: "#f2f2f2",
            margin: "0 0 0.25rem 0", // ✅ Remove extra gap under title
          }}
        >
          {seasonTitle}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "2rem",
            color: "#F23359",
            margin: "0 0 0.5rem 0", // ✅ Tighten gap before projects
          }}
        >
          {years}
        </p>

        <div className="flex-1">
          <ul
            style={{
              listStyle: "none",
              opacity: 0.7,
              padding: 3,
              margin: 0,
            }}
            className="space-y-3" // ✅ Slightly less spacing for compact look
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
        </div>
      </div>
    </Link>
  );
}
