import React from "react";
import clsx from "clsx";

type Base = React.HTMLAttributes<HTMLDivElement>;

export interface DialogProps extends Base {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

export function Dialog({ children, open, onOpenChange, ...props }: DialogProps) {
  // Very minimal mock: just wraps children and calls onOpenChange(false) on backdrop click
  return (
    <div {...props}>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => onOpenChange?.(false)}
        />
      )}
      {children}
    </div>
  );
}

export function DialogTrigger({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props}>
      {children}
    </button>
  );
}

export function DialogContent({ className, ...props }: Base) {
  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        className
      )}
      {...props}
    />
  );
}

export function DialogHeader(props: Base) {
  return <div className={clsx("mb-2", props.className)} {...props} />;
}

export function DialogTitle(
  props: React.HTMLAttributes<HTMLHeadingElement>
) {
  return (
    <h3
      className={clsx("text-lg font-semibold leading-none", props.className)}
      {...props}
    />
  );
}

export function DialogDescription(props: Base) {
  return (
    <div
      className={clsx("text-sm text-slate-600", props.className)}
      {...props}
    />
  );
}

export function DialogFooter(props: Base) {
  return (
    <div
      className={clsx("mt-4 flex justify-end gap-2", props.className)}
      {...props}
    />
  );
}
