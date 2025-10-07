"use client";

import * as React from "react";
import Link from "next/link";
import {
  getCanonicalFlag,
  flagStyles,
  iconMap,
  slugifyFlag,
  type FlagLabel,
} from "@/lib/flags";

interface StatusFlagsProps {
  flags: string[];
  fontSize?: string;
  fontFamily?: string;
  textColor?: string;
  borderRadius?: string;
  className?: string;
  /** ✅ NEW: allow callers to control padding */
  padding?: string;
}

/** Small inline badge list used on cards, etc. */
export default function StatusFlags({
  flags,
  fontSize = "clamp(1.5rem, 4vw, 2rem)",
  fontFamily = 'var(--font-dm-sans), system-ui, sans-serif',
  textColor = "#241123",
  borderRadius = "8px",
  className = "",
  padding = "2.2rem 0.65rem 0.65rem", // default preserves current look
}: StatusFlagsProps) {
  if (!flags || flags.length === 0) return null;

  return (
    <div className={`flex items-center ${className ?? ""}`} role="list">
      {flags.map((flag) => {
        const canonical = getCanonicalFlag(flag) as FlagLabel | null;
        if (!canonical) return null;

        const icon = iconMap[canonical];
        const bgColor = flagStyles[canonical];
        const slug = slugifyFlag(canonical);

        return (
          <Link
            key={`${canonical}-${slug}`}
            href={`/role/${slug}`}
            title={canonical}
            aria-label={canonical}
            role="listitem"
            className="group relative flex flex-col items-center text-center no-underline focus:outline-none"
            style={{ textDecoration: "none" }}
          >
            <div
              className="flex items-center justify-center transition-transform duration-200 ease-in-out group-hover:scale-105 group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
              style={{
                backgroundColor: bgColor,
                padding,                 // ✅ use incoming padding
                fontSize,
                fontFamily,
                color: textColor,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomLeftRadius: borderRadius,
                borderBottomRightRadius: borderRadius,
              }}
            >
              {icon}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
