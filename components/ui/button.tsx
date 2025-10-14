// components/ui/button.tsx
import React from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "md" | "sm" | "icon";

export type ButtonProps = {
  children: React.ReactNode;
  className?: string;

  // behavior
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";

  // link mode (renders <a> when href is present)
  href?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";

  // styling
  variant?: Variant;
  size?: Size;
};

const variantClass: Record<Variant, string> = {
  primary:
    "bg-[var(--btn-bg,#241123)] text-[var(--btn-text,#fff)] hover:opacity-90",
  secondary:
    "bg-neutral-200 text-black hover:bg-neutral-300",
  outline:
    "border border-current bg-transparent text-current hover:bg-black/5",
  ghost:
    "bg-transparent text-current hover:bg-black/5",
};

const sizeClass: Record<Size, string> = {
  md: "px-4 py-2 text-sm",
  sm: "px-3 py-1.5 text-xs",
  icon: "p-2 aspect-square",
};

export default function Button({
  children,
  className,
  onClick,
  disabled = false,
  type = "button",
  href,
  target = "_self",
  variant = "primary",
  size = "md",
}: ButtonProps) {
  const classes = clsx(
    "inline-flex items-center justify-center rounded-md uppercase tracking-[0.12em] transition select-none",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    variantClass[variant],
    sizeClass[size],
    disabled && "opacity-50 pointer-events-none",
    className
  );

  if (href) {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };

    return (
      <a
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        role="button"
        aria-disabled={disabled || undefined}
        className={classes}
        onClick={handleClick}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={classes}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
