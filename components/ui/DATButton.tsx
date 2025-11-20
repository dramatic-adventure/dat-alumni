"use client";

import * as React from "react";

type Variant = "ink" | "yellow" | "teal";
type Size = "sm" | "md" | "lg";

type Shared = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  fullWidth?: boolean;
  /** DAT font family. Defaults to DM Sans. */
  fontFamily?: string;
  /** Flat sizes tuned to your UI. */
  size?: Size;
  /** Visual theme */
  variant?: Variant;
  /** Disable interaction (button only) */
  disabled?: boolean;
};

const PALETTE: Record<Variant, { base: string; hover: string; text: string }> = {
  ink:   { base: "#241123", hover: "#1C0D1B", text: "#F2F2F2" },
  yellow:{ base: "#FFCC00", hover: "#E6B800", text: "#241123" },
  teal:  { base: "#2493A9", hover: "#1F7F92", text: "#F2F2F2" },
};

const SIZES: Record<Size, { px: string; radius: number; fs: string; lh: number }> = {
  sm: { px: "0.55rem 0.85rem", radius: 12, fs: "0.72rem", lh: 1.15 },
  md: { px: "0.85rem 1.15rem", radius: 14, fs: "0.78rem", lh: 1.15 },
  lg: { px: "1rem 1.35rem",    radius: 16, fs: "0.86rem", lh: 1.15 },
};

function baseStyles({
  fullWidth,
  fontFamily,
  size = "md",
  variant = "ink",
}: Pick<Shared, "fullWidth" | "fontFamily" | "size" | "variant">) {
  const pal = PALETTE[variant];
  const sz = SIZES[size];

  const styles: React.CSSProperties = {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    width: fullWidth ? "100%" : undefined,
    padding: sz.px,
    borderRadius: sz.radius,
    fontFamily: fontFamily ?? 'var(--font-dm-sans), "DM Sans", system-ui, sans-serif',
    fontSize: sz.fs,
    lineHeight: sz.lh,
    fontWeight: 800,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    textDecoration: "none",
    outline: "none",
    border: "none",
    backgroundColor: pal.base,
    color: pal.text,
    WebkitTextFillColor: pal.text,
    transition: "background-color 150ms ease, opacity 120ms ease, transform 120ms ease",
    cursor: "pointer",
    boxShadow: "none", // flat
  };

  return { styles, pal };
}

/** Anchor variant (for links) */
export function DATButtonLink({
  href,
  target,
  rel,
  children,
  className,
  style,
  fullWidth,
  fontFamily,
  size,
  variant,
}: Shared & { href: string; target?: string; rel?: string }) {
  const { styles, pal } = baseStyles({ fullWidth, fontFamily, size, variant });
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={className}
      style={{ ...styles, ...style, textDecoration: "none" }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = pal.hover; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = pal.base; }}
    >
      {children}
    </a>
  );
}

/** Button variant (for forms/click handlers) */
export function DATButton({
  children,
  className,
  style,
  fullWidth,
  fontFamily,
  size,
  variant,
  disabled,
  onClick,
  type = "button",
}: Shared & { onClick?: React.MouseEventHandler<HTMLButtonElement>; type?: "button" | "submit" | "reset" }) {
  const { styles, pal } = baseStyles({ fullWidth, fontFamily, size, variant });
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
      style={{ ...styles, ...style, ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : null) }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.backgroundColor = pal.hover;
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.backgroundColor = pal.base;
      }}
    >
      {children}
    </button>
  );
}
