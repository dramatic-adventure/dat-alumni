import * as React from "react";
import clsx from "clsx";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variant === "default" && "bg-gray-200 text-gray-800",
        variant === "secondary" && "bg-slate-100 text-slate-700",
        variant === "outline" && "border border-gray-300 text-gray-800",
        className
      )}
      {...props}
    />
  );
}
