"use client";

import Image from "next/image";
import Link from "next/link";

interface MiniProfileCardProps {
  name: string;
  role: string;
  slug: string;
  headshotUrl?: string;
  customStyle?: React.CSSProperties; // ✅ Allows overriding container width or style
  nameFontSize?: number; // ✅ Optional font size for Name
  roleFontSize?: number; // ✅ Optional font size for Role
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
      prefetch
      className="block"
      style={{ textDecoration: "none" }}
    >
      <div
        className="flex flex-col items-start group"
        style={{ width: "140px", ...customStyle }} // ✅ Default width, override if provided
      >
        {/* Headshot */}
        <div
          className="relative w-full transition-transform duration-300 group-hover:scale-110"
          style={{
            aspectRatio: "4 / 5", // ✅ 8x10 ratio
            overflow: "hidden",
            boxShadow: "2px 3px 4px rgba(36,17,35,0.5)",
            transformOrigin: "center center",
          }}
        >
          <Image
            src={imageSrc}
            alt={name}
            fill
            className="object-cover"
            sizes="180px"
            loading="lazy"
            placeholder="blur"
            blurDataURL={defaultImage}
          />
        </div>

        {/* Name */}
        <h3
          className="text-[#f2f2f2] uppercase leading-snug transition-colors group-hover:text-[#F23359]"
          style={{
            fontFamily: "Space Grotesk",
            fontWeight: 425,
            fontSize: nameFontSize || 15, // ✅ Dynamic font size
            margin: "15px 0 0 0", // ✅ Extra gap for hover safety
            textAlign: "left",
          }}
        >
          {name}
        </h3>

        {/* Role */}
        <p
          className="text-[#f2f2f2] transition-colors group-hover:text-[#F23359]"
          style={{
            fontFamily: "DM Sans",
            fontWeight: 400,
            opacity: 0.6,
            fontSize: roleFontSize || 14, // ✅ Dynamic font size
            margin: 0,
            textAlign: "left",
          }}
        >
          {role}
        </p>
      </div>
    </Link>
  );
}
