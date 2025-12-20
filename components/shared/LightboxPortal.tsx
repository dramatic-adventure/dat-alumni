// components/shared/LightboxPortal.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type LightboxPortalProps = {
  children: React.ReactNode;
};

export default function LightboxPortal({ children }: LightboxPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // ✅ Avoid SSR / hydration issues
  if (!mounted) return null;

  // ✅ Portal into <body> so fixed/blur/backdrop behave correctly
  return createPortal(children, document.body);
}
