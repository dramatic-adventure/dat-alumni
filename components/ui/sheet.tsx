import React from "react";
import clsx from "clsx";

export interface SheetProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

export function Sheet({ children }: SheetProps) {
  return <>{children}</>;
}

export function SheetContent({
  side = "right",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  side?: "left" | "right" | "top" | "bottom";
}) {
  const pos =
    side === "right"
      ? "right-0 top-0 h-full w-80"
      : side === "left"
      ? "left-0 top-0 h-full w-80"
      : side === "top"
      ? "top-0 left-0 w-full h-64"
      : "bottom-0 left-0 w-full h-64";

  return (
    <div
      className={clsx(
        "fixed z-50 bg-white shadow-xl transition-transform animate-in p-4",
        pos,
        className
      )}
      {...props}
    />
  );
}

export function SheetHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("mb-4", props.className)} {...props} />;
}

export function SheetTitle(
  props: React.HTMLAttributes<HTMLHeadingElement>
) {
  return (
    <h3
      className={clsx("text-lg font-semibold leading-none", props.className)}
      {...props}
    />
  );
}

export function SheetFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("mt-4 flex justify-end gap-2", props.className)}
      {...props}
    />
  );
}
