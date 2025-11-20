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

export type ProductionTagButtonsProps = CommonProps & (SingleSelectProps | MultiSelectProps);

export default function ProductionTagButtons(props: ProductionTagButtonsProps) {
  const {
    tags,
    gap = "0.5rem",
    dense = false,
    className,
    style,
    fontFamily = 'var(--font-dm-sans), "DM Sans", system-ui, sans-serif',
  } = props;

  const isMulti = (props as MultiSelectProps).multi === true;

  // ---- Fixed initializers (avoid boolean `false` leaking into useState) ----
  const initialSingle: string | null = !isMulti
    ? ((props as SingleSelectProps).defaultSelected ?? null)
    : null;

  const initialMulti: string[] = isMulti
    ? ((props as MultiSelectProps).defaultSelected ?? [])
    : [];

  const [internalSingle, setInternalSingle] = React.useState<string | null>(initialSingle);
  const [internalMulti, setInternalMulti] = React.useState<string[]>(initialMulti);

  // Derived selected (controlled vs uncontrolled)
  const selectedSingle = !isMulti ? (props as SingleSelectProps).selected ?? internalSingle : null;
  const selectedMulti = isMulti ? (props as MultiSelectProps).selected ?? internalMulti : [];

  const handleClick = (tag: string) => {
    props.onClick?.(tag);

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

  const padding = dense ? "0.35rem 0.6rem" : "0.5rem 0.8rem";
  const fontSize = dense ? "0.68rem" : "0.75rem";
  const radius = 12;

  return (
    <div
      role="listbox"
      aria-multiselectable={isMulti || undefined}
      aria-label={(props as any)["aria-label"] ?? "Tags"}
      className={className}
      style={{ display: "flex", flexWrap: "wrap", gap, ...style }}
    >
      {tags.map((tag) => {
        const isSelected = isMulti ? selectedMulti.includes(tag) : selectedSingle === tag;
        return (
          <button
            key={tag}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => handleClick(tag)}
            className="dat-tagchip"
            style={{
              fontFamily,
              userSelect: "none",
              cursor: "pointer",
              border: "1px solid rgba(36,17,35,0.10)",
              backgroundColor: isSelected ? "#241123" : "#FFFFFF",
              color: isSelected ? "#FFCC00" : "#241123",
              padding,
              fontSize,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              borderRadius: radius,
              transition: "background-color 140ms ease, color 140ms ease, transform 120ms ease, border-color 140ms ease",
              outline: "none",
              boxShadow: "none",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = "#F7F7F7";
                e.currentTarget.style.borderColor = "rgba(36,17,35,0.18)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = "#FFFFFF";
                e.currentTarget.style.borderColor = "rgba(36,17,35,0.10)";
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick(tag);
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
