import * as React from "react";
import { TOGGLE_WRAP, TOGGLE_BTN, TOGGLE_ON, TOGGLE_OFF } from "./sponsorshipStyles";

type Opt<T extends string> = { value: T; label: string };

export function PillToggle<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<Opt<T>>;
  ariaLabel: string;
}) {
  return (
    <div className={TOGGLE_WRAP} role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => {
        const on = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={on}
            className={[TOGGLE_BTN, on ? TOGGLE_ON : TOGGLE_OFF].join(" ")}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
