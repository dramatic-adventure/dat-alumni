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
  "Founding Member": "#FFD700",
  "Staff": "#000000",
  "Board Member": "#FFCC00",
  "Artist-in-Residence": "#6C00AF",
  "Fellow": "#F25C4D",
  "Intern": "#2AB0A7",
  "Volunteer": "#4DAA57",
};

const iconMap: Record<FlagLabel, string> = {
  "Founding Member": "⭐️",
  "Staff": "🛠️",
  "Board Member": "🛡️",
  "Artist-in-Residence": "🏠",
  "Fellow": "✨",
  "Intern": "🌱",
  "Volunteer": "🤝",
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
  fontSize = "2rem",
  fontFamily = '"DM Sans", sans-serif',
  textColor = "#241123",
  borderRadius = "8px",
}: StatusFlagsProps) {
  if (!flags || flags.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {flags.map((flag) => {
        const normalizedFlag = flag.trim() as FlagLabel;
        const icon = iconMap[normalizedFlag] ?? "🏅";
        const bgColor = flagStyles[normalizedFlag] ?? "#999";
        const slug = normalizedFlag.toLowerCase().replace(/\s+/g, "-");

        return (
          <Link
            key={normalizedFlag}
            href={`/status/${slug}`}
            className="group relative flex flex-col items-center text-center"
            style={{ textDecoration: "none" }}
            aria-label={normalizedFlag}
          >
            <div
              className="relative flex flex-col items-center justify-end overflow-hidden"
              style={{
                backgroundColor: bgColor,
                padding: "2.4rem 0.75rem 0.75rem",
                fontSize,
                fontFamily,
                color: "#F6E4C1",
                borderTopLeftRadius: "0px",
                borderTopRightRadius: "0px",
                borderBottomLeftRadius: borderRadius,
                borderBottomRightRadius: borderRadius,
                boxShadow: "3px 4px 10px rgba(0, 0, 0, 0.15)",
              }}
            >
              {/* Top Hover Title Bar (inside flag) */}
              <div
                className="absolute top-0 left-0 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                style={{
                  backgroundColor: "rgba(36, 17, 35, 0.5)",
                  color: "#F2F2F2",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  padding: "2px 4px",
                  fontFamily,
                  textAlign: "center",
                  whiteSpace: "normal",
                }}
              >
                {normalizedFlag}
              </div>

              {/* Emoji Icon */}
              {icon}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
