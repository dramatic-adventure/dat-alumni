"use client";

import Image from "next/image";
import Link from "next/link";
import { CSSProperties } from "react";

interface MiniProfileCardProps {
  name: string;
  role: string;
  slug: string;
  headshotUrl?: string;
  customStyle?: CSSProperties;
  nameFontSize?: number;
  roleFontSize?: number;
  /** Set true for cards above the fold so the image + RSC get fetched ASAP */
  priority?: boolean;
}

export default function MiniProfileCard({
  name,
  role,
  slug,
  headshotUrl,
  customStyle,
  nameFontSize,
  roleFontSize,
  priority = false,
}: MiniProfileCardProps) {
  const defaultImage = "/images/default-headshot.png";
  const imageSrc = (headshotUrl || defaultImage).replace(/^http:\/\//i, "https://");

  return (
    <Link
      href={`/alumni/${slug}`}
      prefetch
      className="block group"
      style={{ textDecoration: "none" }}
      aria-label={`${name} profile`}
    >
      <div
        className="flex flex-col items-start"
        style={{ width: "144px", ...customStyle }}
      >
        {/* Headshot (4:5, stable box to avoid CLS) */}
        <div
          className="relative w-full transition-all duration-300 group-hover:scale-[1.11] group-hover:brightness-105"
          style={{
            aspectRatio: "4 / 5",
            overflow: "hidden",
            boxShadow: "2px 3px 4px rgba(36,17,35,0.5)",
            transformOrigin: "center center",
          }}
        >
          <Image
            src={imageSrc}
            alt={`${name}${role ? ` — ${role}` : ""}`}
            fill
            className="object-cover transition-all duration-300"
            sizes="144px"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            draggable={false}
          />
        </div>

        {/* Name */}
        <h3
          className="uppercase leading-snug text-[#f2f2f2] group-hover:text-[#FFCC00] transition-colors duration-300"
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 600,
            letterSpacing: "0.05rem",
            fontSize: nameFontSize || 16,
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
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
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
          box-shadow: 0 12px 28px rgba(36,17,35,0.6);
        }
      `}</style>
    </Link>
  );
}
