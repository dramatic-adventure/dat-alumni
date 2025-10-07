// components/ui/button.tsx
import * as React from "react";
import clsx from "clsx";

type Variant = "default" | "outline" | "ghost" | "destructive" | "secondary";
type Size = "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  "inline-flex items-center justify-center rounded-md font-medium transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "disabled:opacity-50 disabled:pointer-events-none";

const variantClasses: Record<Variant, string> = {
  default: "bg-black text-white hover:opacity-90 focus-visible:ring-black",
  outline:
    "border border-black/20 text-black hover:bg-black/5 focus-visible:ring-black",
  ghost: "bg-transparent hover:bg-black/5 text-black",
  destructive:
    "bg-[#F23359] text-white hover:opacity-90 focus-visible:ring-[#F23359]",
  secondary:
    "bg-[#6C00AF] text-white hover:opacity-90 focus-visible:ring-[#6C00AF]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
  icon: "h-10 w-10 p-0",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(base, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export default Button;
export { Button };
