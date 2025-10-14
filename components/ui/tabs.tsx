import React from "react";
import clsx from "clsx";

type TabsCtx = { value: string; setValue: (v: string) => void };
const Ctx = React.createContext<TabsCtx | null>(null);

type TabsProps = {
  /** Controlled value of the active tab */
  value?: string;
  /** Callback when the active tab changes */
  onValueChange?: (v: string) => void;
  /** Uncontrolled initial value */
  defaultValue?: string;
  children: React.ReactNode;
  className?: string;
};

export function Tabs({
  value,
  onValueChange,
  defaultValue,
  children,
  className,
}: TabsProps) {
  const [uncontrolled, setUncontrolled] = React.useState<string>(
    defaultValue ?? ""
  );

  const isControlled = value !== undefined;
  const current = isControlled ? (value as string) : uncontrolled;

  const setValue = (v: string) => {
    if (!isControlled) setUncontrolled(v);
    onValueChange?.(v);
  };

  return (
    <Ctx.Provider value={{ value: current, setValue }}>
      <div className={className}>{children}</div>
    </Ctx.Provider>
  );
}

export function TabsList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("flex gap-2", className)} {...props} />;
}

type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
};

export function TabsTrigger({
  value,
  children,
  className,
  onClick,
  ...props
}: TabsTriggerProps) {
  const ctx = React.useContext(Ctx);
  if (!ctx) return null;

  const active = ctx.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={(e) => {
        onClick?.(e);
        ctx.setValue(value);
      }}
      className={clsx(
        "rounded-md px-3 py-1 text-sm",
        active ? "bg-black text-white" : "bg-gray-100",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

type TabsContentProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string;
};

export function TabsContent({
  value,
  children,
  className,
  ...props
}: TabsContentProps) {
  const ctx = React.useContext(Ctx);
  if (!ctx || ctx.value !== value) return null;

  return (
    <div
      role="tabpanel"
      className={clsx("mt-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}
