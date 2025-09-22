import * as React from "react";
import clsx from "clsx";

export function DropdownMenu(
  props: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>
) {
  const { children, ...rest } = props;
  return (
    <div role="menu" {...rest}>
      {children}
    </div>
  );
}

type TriggerProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  /** When true, merge trigger props into the single child element (e.g., <Button />) */
  asChild?: boolean;
  /** Must be a single element when using `asChild` */
  children: React.ReactElement;
};

export function DropdownMenuTrigger({
  asChild = false,
  children,
  className,
  ...props
}: TriggerProps) {
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    // Use `any` to avoid React.cloneElement prop incompatibility errors across arbitrary elements.
    return React.cloneElement(
      child,
      {
        className: clsx(child.props?.className, className),
        ...props,
      } as any
    );
  }

  return (
    <button type="button" className={className} {...props}>
      {children}
    </button>
  );
}

type ContentProps = React.HTMLAttributes<HTMLDivElement> & {
  /** API-compat only; not used in this minimal implementation */
  align?: "start" | "end" | "center";
};

export function DropdownMenuContent({
  children,
  className,
  align, // kept for TS-compat
  ...props
}: ContentProps) {
  return (
    <div
      className={clsx(
        "rounded-md border border-gray-200 bg-white shadow-md",
        className
      )}
      style={{ minWidth: 160 }}
      {...props}
    >
      {children}
    </div>
  );
}

type ItemProps = {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

export function DropdownMenuItem({ children, onClick, className }: ItemProps) {
  return (
    <div
      role="menuitem"
      tabIndex={0}
      onClick={onClick}
      className={clsx(
        "px-3 py-2 text-sm cursor-pointer select-none hover:bg-gray-100",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLHRElement>) {
  return (
    <hr
      className={clsx("my-1 border-t border-gray-200", className)}
      {...props}
    />
  );
}

export function DropdownMenuLabel({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  return (
    <div
      className={clsx(
        "px-3 py-1.5 text-xs font-semibold text-gray-500",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
