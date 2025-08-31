"use client";

import Link from "next/link";
import { AlumniRow } from "@/lib/types";
import { slugifyTag } from "@/lib/tags";

export default function TagsGrid({ alumni }: { alumni: AlumniRow[] }) {
  // Collect all tags across alumni
  const tagCounts: Record<string, number> = {};

  for (const artist of alumni) {
    for (const tag of artist.identityTags ?? []) {
      const canonical = tag.trim();
      if (canonical) {
        tagCounts[canonical] = (tagCounts[canonical] ?? 0) + 1;
      }
    }
  }

  const tags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "0.75rem",
      }}
    >
      {tags.map(([tag, count]) => (
        <Link
          key={tag}
          href={`/tag/${slugifyTag(tag)}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1rem",
            borderRadius: "15px",
            backgroundColor: "#241123",
            color: "#FFCC00",
            opacity: 0.8,
            letterSpacing: "0.06em",
            fontFamily: "Space Grotesk, sans-serif",
            fontWeight: 600,
            fontSize: "1rem",
            boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow =
              "0 8px 22px rgba(0,0,0,0.28)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.8";
            e.currentTarget.style.transform = "scale(1.0)";
            e.currentTarget.style.boxShadow =
              "0 4px 14px rgba(0,0,0,0.2)";
          }}
        >
          <span>{tag}</span>
          <span style={{ fontSize: "0.9rem", opacity: 0.85 }}>{count}</span>
        </Link>
      ))}
    </div>
  );
}
