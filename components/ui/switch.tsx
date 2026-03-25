import React from "react";
import clsx from "clsx";

type Props = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
};

export function Switch({
  checked = false,
  onCheckedChange,
  className,
  disabled = false,
}: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
      className={clsx(
        "inline-flex items-center rounded-full transition-colors focus:outline-none",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className
      )}
      style={{
        width: 44,
        height: 24,
        background: checked ? "#22c55e" : "#e5e7eb",
        position: "relative",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.15s",
        }}
      />
    </button>
  );
}
