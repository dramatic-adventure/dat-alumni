// components/ui/ProductionTagButtons.tsx
"use client";

import * as React from "react";

type CommonProps = {
  tags: string[];
  gap?: string;
  dense?: boolean;
  "aria-label"?: string;
  className?: string;
  style?: React.CSSProperties;
  fontFamily?: string;
  /** Optional base path for turning tags into links, e.g. "/theme" -> /theme/[slug] */
  hrefBase?: string;
};

type SingleSelectProps = {
  selected?: string | null;
  defaultSelected?: string | null;
  onChange?: (next: string | null) => void;
  onClick?: (tag: string) => void;
  multi?: false;
};

type MultiSelectProps = {
  selected?: string[];
  defaultSelected?: string[];
  onChange?: (next: string[]) => void;
  onClick?: (tag: string) => void;
  multi: true;
};

export type ProductionTagButtonsProps = CommonProps &
  (SingleSelectProps | MultiSelectProps);

// DAT blue / teal
const TAG_TEAL = "#2493A9";
const TAG_TEAL_SELECTED = "#1F7E90";
const TAG_TEAL_HOVER = "#2AA3BC";
const TAG_TEXT_LIGHT = "#F7FCFF";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function ProductionTagButtons(props: ProductionTagButtonsProps) {
  const {
    tags,
    gap = "0.5rem",
    dense = false,
    className,
    style,
    fontFamily = 'var(--font-dm-sans), "DM Sans", system-ui, sans-serif',
    hrefBase,
  } = props;

  const isMulti = (props as MultiSelectProps).multi === true;

  // Clean tags: trim, drop empties, de-dupe
  const cleanTags = React.useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of tags) {
      const t = String(raw ?? "").trim();
      if (!t) continue;
      if (seen.has(t)) continue;
      seen.add(t);
      out.push(t);
    }
    return out;
  }, [tags]);

  // Initial internal state
  const initialSingle: string | null = !isMulti
    ? ((props as SingleSelectProps).defaultSelected ?? null)
    : null;

  const initialMulti: string[] = isMulti
    ? ((props as MultiSelectProps).defaultSelected ?? [])
    : [];

  const [internalSingle, setInternalSingle] =
    React.useState<string | null>(initialSingle);
  const [internalMulti, setInternalMulti] =
    React.useState<string[]>(initialMulti);

  // Derived selected (controlled vs uncontrolled)
  const selectedSingle = !isMulti
    ? (props as SingleSelectProps).selected ?? internalSingle
    : null;
  const selectedMulti = isMulti
    ? (props as MultiSelectProps).selected ?? internalMulti
    : [];

  const handleClick = (tag: string, href?: string) => {
    props.onClick?.(tag);

    // If hrefBase is provided, treat this as a navigation chip.
    if (href) {
      if (typeof window !== "undefined") {
        window.location.href = href;
      }
      return;
    }

    // Otherwise: pure selection behavior
    if (isMulti) {
      const curr = new Set(selectedMulti);
      curr.has(tag) ? curr.delete(tag) : curr.add(tag);
      const next = Array.from(curr);
      const onChange = (props as MultiSelectProps).onChange;
      onChange ? onChange(next) : setInternalMulti(next);
    } else {
      const curr = selectedSingle;
      const next = curr === tag ? null : tag;
      const onChange = (props as SingleSelectProps).onChange;
      onChange ? onChange(next) : setInternalSingle(next);
    }
  };

  const padding = dense ? "0.33rem 0.6rem" : "0.45rem 0.85rem";
  const fontSize = dense ? "0.68rem" : "0.76rem";
  const radius = 16; // soft-rectangle, not pill

  return (
    <div
      role="listbox"
      aria-multiselectable={isMulti || undefined}
      aria-label={(props as any)["aria-label"] ?? "Tags"}
      className={className}
      style={{ display: "flex", flexWrap: "wrap", gap, ...style }}
    >
      {cleanTags.map((tag) => {
        const isSelected = isMulti
          ? selectedMulti.includes(tag)
          : selectedSingle === tag;

        const href = hrefBase ? `${hrefBase}/${slugify(tag)}` : undefined;

        const baseBg = isSelected ? TAG_TEAL_SELECTED : TAG_TEAL;
        const baseColor = TAG_TEXT_LIGHT;
        const baseBorder = "1px solid rgba(0,0,0,0.06)";

        return (
          <button
            key={tag}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => handleClick(tag, href)}
            className="dat-tagchip"
            style={{
              fontFamily,
              userSelect: "none",
              cursor: "pointer",
              border: baseBorder,
              backgroundColor: baseBg,
              color: baseColor,
              padding,
              fontSize,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.10em",
              borderRadius: radius,
              transition:
                "background-color 140ms ease, color 140ms ease, border-color 140ms ease",
              outline: "none",
              boxShadow: "none",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = TAG_TEAL_HOVER;
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = TAG_TEAL;
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick(tag, href);
              }
            }}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
