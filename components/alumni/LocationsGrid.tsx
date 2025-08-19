"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { AlumniRow } from "@/lib/types";
import {
  getLocationLinksForAlumni,
  slugifyLocation,
  getLocationHrefForLabel,
} from "@/lib/locations";

function collapseForGrid(label: string): { label: string; slug: string } {
  const s = label.trim().toLowerCase();
  if (/,\s*nyc$/.test(s)) {
    return { label: "New York City", slug: "new-york-city" };
  }
  if (s === "new york city" || s === "new york, ny") {
    return { label: "New York City", slug: "new-york-city" };
  }
  return { label, slug: slugifyLocation(label) };
}

interface LocationsGridProps {
  alumni: AlumniRow[];
  limit?: number; // optional: show only top N
}

export default function LocationsGrid({ alumni, limit }: LocationsGridProps) {
  const buckets = useMemo(() => {
    // key -> { label, slug, count }
    const map = new Map<string, { label: string; slug: string; count: number }>();

    for (const a of alumni) {
      // Dedupe per alum so one person doesn't inflate a location twice
      const perAlum = new Set<string>();
      for (const l of getLocationLinksForAlumni(a)) {
        const { label, slug } = collapseForGrid(l.label);
        if (perAlum.has(slug)) continue;
        perAlum.add(slug);

        const prev = map.get(slug);
        if (prev) {
          prev.count += 1;
        } else {
          map.set(slug, { label, slug, count: 1 });
        }
      }
    }

    // Sort by size desc, then A→Z
    const list = Array.from(map.values()).sort(
      (a, b) => b.count - a.count || a.label.localeCompare(b.label)
    );

    return typeof limit === "number" ? list.slice(0, limit) : list;
  }, [alumni, limit]);

  if (buckets.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "0.75rem",
        alignItems: "stretch",
      }}
    >
      {buckets.map(({ label, slug, count }) => (
        <Link
          key={slug}
          href={getLocationHrefForLabel(label)} // boroughs link to NYC
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1rem",
            borderRadius: "999px",
            backgroundColor: "#241123", // dark purple
            color: "#FFCC00",            // DAT yellow
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontFamily: "Anton, sans-serif",
            fontSize: "0.95rem",
            boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
            transform: "translateZ(0)",
            transition: "transform 120ms ease, box-shadow 120ms ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.03)";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow =
              "0 8px 22px rgba(0,0,0,0.28)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.0)";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow =
              "0 4px 14px rgba(0,0,0,0.2)";
          }}
        >
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {label}
          </span>
          <span
            style={{
              marginLeft: "0.75rem",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "0.85rem",
              opacity: 0.85,
            }}
          >
            {count}
          </span>
        </Link>
      ))}
    </div>
  );
}
