import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  href: string;
  target?: "_blank" | "_self";
};

export default function Button({ children, href, target = "_self" }: ButtonProps) {
  return (
    <a
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      className="inline-block px-6 py-[6px] rounded-md font-normal uppercase tracking-[0.4em] text-[13px] text-[var(--btn-text)] bg-[var(--btn-bg)] hover:opacity-90 transition text-center"
    >
      {children}
    </a>
  );
}
