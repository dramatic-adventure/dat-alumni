"use client";

import Image from "next/image";
import Link from "next/link";

interface MiniProfileCardProps {
  name: string;
  role: string;
  slug: string;
  headshotUrl?: string;
  customStyle?: React.CSSProperties;
  nameFontSize?: number;
  roleFontSize?: number;
}

export default function MiniProfileCard({
  name,
  role,
  slug,
  headshotUrl,
  customStyle,
  nameFontSize,
  roleFontSize,
}: MiniProfileCardProps) {
  const defaultImage = "/images/default-headshot.png";
  const imageSrc = headshotUrl
    ? headshotUrl.replace(/^http:\/\//i, "https://")
    : defaultImage;

  return (
    <Link
      href={`/alumni/${slug}`}
      className="block group"
      style={{ textDecoration: "none" }}
    >
      <div
        className="flex flex-col items-start"
        style={{ width: "144px", ...customStyle }}
      >
        {/* Headshot */}
        <div
          className="relative w-full transition-all duration-300 group-hover:scale-111 group-hover:brightness-105 filter"
          style={{
            aspectRatio: "4 / 5",
            overflow: "hidden",
            boxShadow: "2px 3px 4px rgba(36,17,35,0.5)",
            transformOrigin: "center center",
          }}
        >
          <Image
            src={imageSrc}
            alt={name}
            fill
            className="object-cover transition-all duration-300"
            sizes="180px"
            loading="lazy"
            placeholder="blur"
            blurDataURL={defaultImage}
          />
        </div>

        {/* Name */}
        <h3
          className="uppercase leading-snug text-[#f2f2f2] group-hover:text-[#FFCC00] transition-colors duration-300"
          style={{
            fontFamily: "Space Grotesk",
            fontWeight: 425,
            fontSize: nameFontSize || 15,
            margin: "15px 0 0 0",
            textAlign: "left",
          }}
        >
          {name}
        </h3>

        {/* Role */}
        <p
          className="text-[#f2f2f2]"
          style={{
            fontFamily: "DM Sans",
            fontWeight: 400,
            opacity: 0.6,
            fontSize: roleFontSize || 14,
            margin: 0,
            textAlign: "left",
          }}
        >
          {role}
        </p>
      </div>

      <style>{`
        .group:hover div.relative {
          box-shadow: 0 12px 28px rgba(36,17,35,0.6); /* Bigger shadow on hover */
        }
      `}</style>
    </Link>
  );
}
