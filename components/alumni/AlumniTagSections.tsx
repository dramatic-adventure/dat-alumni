"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import {
  filterToCanonicalLabels,
  LAYER_LABELS,
  type TaxonomyLayer,
} from "@/lib/alumniTaxonomy";
import { slugifyTag } from "@/lib/tags";

type Props = {
  identityTags?: string[] | string;
  practiceTags?: string[] | string;
  exploreCareTags?: string[] | string;

  /** Optional overrides for layout. */
  sectionStyle?: CSSProperties;
  /** Alignment of the pill row — matches existing IdentityTags behavior. */
  align?: "start" | "end";
};

const sectionWrapStyle: CSSProperties = {
  display: "grid",
  gap: "1.25rem",
};

const sectionHeadingStyle: CSSProperties = {
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontSize: "0.78rem",
  textTransform: "uppercase",
  letterSpacing: "0.2rem",
  fontWeight: 600,
  opacity: 0.75,
  margin: 0,
  color: "inherit",
};

const pillRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.6rem",
  marginTop: "0.5rem",
};

const pillStyle: CSSProperties = {
  backgroundColor: "#16697A",
  color: "#F2F2F2",
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  textTransform: "uppercase",
  letterSpacing: "0.18rem",
  fontSize: "0.72rem",
  fontWeight: 700,
  padding: "0.7rem 1rem",
  borderRadius: 999,
  border: "none",
  boxShadow: "none",
  cursor: "pointer",
  lineHeight: 1.2,
  transition: "background-color 150ms ease",
};

function LayerSection({
  layer,
  labels,
  align,
}: {
  layer: TaxonomyLayer;
  labels: string[];
  align: "start" | "end";
}) {
  const router = useRouter();
  if (!labels.length) return null;
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: align === "end" ? "flex-end" : "flex-start",
        }}
      >
        <h4 style={sectionHeadingStyle}>{LAYER_LABELS[layer]}</h4>
      </div>
      <div
        style={{
          ...pillRowStyle,
          justifyContent: align === "end" ? "flex-end" : "flex-start",
        }}
      >
        {labels.map((label) => (
          <button
            key={label}
            type="button"
            style={pillStyle}
            onClick={() => router.push(`/tag/${slugifyTag(label)}`)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#0f4f5c";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#16697A";
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AlumniTagSections({
  identityTags,
  practiceTags,
  exploreCareTags,
  sectionStyle,
  align = "end",
}: Props) {
  const id = filterToCanonicalLabels(identityTags ?? [], "identity");
  const practice = filterToCanonicalLabels(practiceTags ?? [], "practice");
  const explore = filterToCanonicalLabels(exploreCareTags ?? [], "exploreCare");

  if (id.length === 0 && practice.length === 0 && explore.length === 0) {
    return null;
  }

  return (
    <div style={{ ...sectionWrapStyle, ...sectionStyle }}>
      <LayerSection layer="identity" labels={id} align={align} />
      <LayerSection layer="practice" labels={practice} align={align} />
      <LayerSection layer="exploreCare" labels={explore} align={align} />
    </div>
  );
}
