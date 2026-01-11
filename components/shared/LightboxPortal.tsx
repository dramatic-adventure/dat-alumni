// components/shared/LightboxPortal.tsx
"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

type LightboxPortalProps = {
  children: React.ReactNode;
};

export default function LightboxPortal({ children }: LightboxPortalProps) {
  const [mounted, setMounted] = useState(false);

  // useLayoutEffect avoids a “one-frame null” render
  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}