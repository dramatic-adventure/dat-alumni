import * as React from "react";
import { CHIP_BASE, CHIP_ACTIVE, CHIP_INACTIVE } from "./sponsorshipStyles";

export function Chip({
  selected,
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      className={[
        CHIP_BASE,
        selected ? CHIP_ACTIVE : CHIP_INACTIVE,
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
