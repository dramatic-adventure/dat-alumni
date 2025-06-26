"use client";

import * as React from "react";
import Link from "next/link";

type FlagLabel =
  | "Founding Member"
  | "Staff"
  | "Board Member"
  | "Artist-in-Residence"
  | "Fellow"
  | "Intern"
  | "Volunteer";

const flagStyles: Record<FlagLabel, string> = {
  "Founding Member": "#3E3A36",
  "Staff": "#E6B24A",
  "Board Member": "#A15C40",
  "Artist-in-Residence": "#4C8C86",
  "Fellow": "#F25C4D",
  "Intern": "#924E75",
  "Volunteer": "#659157",
};

const iconMap: Record<FlagLabel, string> = {
  "Founding Member": "⭐️",
  "Staff": "🛠️",
  "Board Member": "🧭",
  "Artist-in-Residence": "🛖",
  "Fellow": "✨",
  "Intern": "🌱",
  "Volunteer": "🫶",
};

interface StatusFlagsProps {
  flags: string[];
  fontSize?: string;
  fontFamily?: string;
  textColor?: string;
  borderRadius?: string;
}

export default function StatusFlags({
  flags,
  fontSize = "clamp(1.5rem, 4vw, 2rem)",
  fontFamily = '"DM Sans", sans-serif',
  textColor = "#241123",
  borderRadius = "8px",
}: StatusFlagsProps) {
  if (!flags || flags.length === 0) return null;

  return (
    <div className="flex items-center gap-2" role="list">
      {flags.map((flag) => {
        const normalizedFlag = flag.trim() as FlagLabel;

        if (!(normalizedFlag in iconMap && normalizedFlag in flagStyles)) {
          return null;
        }

        const icon = iconMap[normalizedFlag];
        const bgColor = flagStyles[normalizedFlag];
        const slug = normalizedFlag.toLowerCase().replace(/\s+/g, "-");

        return (
          <Link
            key={normalizedFlag}
            href={`/status/${slug}`}
            title={normalizedFlag} // ✅ This gives us the native tooltip
            aria-label={normalizedFlag}
            role="listitem"
            className="group relative flex flex-col items-center text-center no-underline focus:outline-none"
            style={{ textDecoration: "none" }}
          >
            <div
              className="flex items-center justify-center transition-transform duration-200 ease-in-out group-hover:scale-105 group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
              style={{
                backgroundColor: bgColor,
                padding: "2.2rem 0.65rem 0.65rem",
                fontSize,
                fontFamily,
                color: "#F6E4C1",
                borderTopLeftRadius: "0px",
                borderTopRightRadius: "0px",
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
