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
      className="group rounded-lg overflow-hidden transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#FF00A0]"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "transparent",
        textDecoration: "none", // ✅ No underline on the link
      }}
    >
      {/* Image Section */}
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-md">
        <Image
          src={imageUrl}
          alt={`${seasonTitle} cover`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
        {/* Gradient Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Text Section */}
      <div className="p-4 flex flex-col flex-1">
        <h3
          className="text-2xl mb-1"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            color: "#f2f2f2",
          }}
        >
          {seasonTitle}
        </h3>
        <p
          className="text-lg mb-3"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            color: "#FF00A0",
          }}
        >
          {years}
        </p>

        <div className="flex-1">
          <ul className="space-y-1">
            {projects.map((proj, i) => (
              <li
                key={i}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.95rem",
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
