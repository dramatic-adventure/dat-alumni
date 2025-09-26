import React from "react";
import clsx from "clsx";

export type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  /** Visual style */
  variant?: "default" | "secondary" | "outline" | "ghost";
  /** Size preset */
  size?: "default" | "sm" | "lg" | "icon";
  /** Render styles onto a single child element (e.g., <a>) */
  asChild?: boolean;

  /** Link support (renders <a> when provided and asChild is false) */
  href?: string;
  target?: React.AnchorHTMLAttributes<HTMLAnchorElement>["target"];
  rel?: string;

  /** Common interaction props */
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLElement>;
  type?: "button" | "submit" | "reset";
} & React.HTMLAttributes<HTMLElement>;

export function Button({
  children,
  className,
  variant = "default",
  size = "default",
  asChild = false,
  href,
  target,
  rel,
  disabled,
  onClick,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = clsx(
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
    variant === "default" && "bg-blue-600 text-white hover:bg-blue-700",
    variant === "secondary" && "bg-gray-100 text-gray-900 hover:bg-gray-200",
    variant === "outline" && "border border-gray-300 text-gray-900 hover:bg-gray-50",
    variant === "ghost" && "hover:bg-gray-100",
    size === "default" && "h-9 px-4",
    size === "sm" && "h-8 px-3 text-xs",
    size === "lg" && "h-10 px-6 text-base",
    size === "icon" && "h-9 w-9 p-0",
    className
  );

  // asChild: merge props/classes into a single child element (e.g., <a>)
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      className: clsx((children as any).props?.className, classes),
      onClick,
      ...rest,
      ...(disabled ? { "aria-disabled": true, tabIndex: -1 } : null),
    });
  }

  // Anchor mode when href is provided
  if (href) {
    const safeRel = target === "_blank" ? rel ?? "noopener noreferrer" : rel;
    return (
      <a
        href={href}
        target={target}
        rel={safeRel}
        className={classes}
        onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}
        {...rest}
        {...(disabled ? { "aria-disabled": true, tabIndex: -1 } : null)}
      >
        {children}
      </a>
    );
  }

  // Default button
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
      {...rest}
    >
      {children}
    </button>
  );
}
