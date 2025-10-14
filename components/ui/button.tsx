import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  href?: string;                 // allow link-style
  onClick?: () => void;          // allow button-style
  target?: "_blank" | "_self";
  disabled?: boolean;
};

export default function Button({
  children,
  href,
  onClick,
  target = "_self",
  disabled = false,
}: ButtonProps) {
  const className =
    "inline-block px-6 py-[6px] rounded-md font-normal uppercase tracking-[0.4em] text-[13px] " +
    "text-[var(--btn-text)] bg-[var(--btn-bg)] hover:opacity-90 transition text-center " +
    (disabled ? "opacity-50 pointer-events-none" : "");

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        className={className}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
