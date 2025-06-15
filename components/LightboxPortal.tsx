"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface LightboxPortalProps {
  children: React.ReactNode;
}

export default function LightboxPortal({ children }: LightboxPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false); // Clean up if component unmounts
  }, []);

  if (typeof window === "undefined" || !mounted) return null;

  return createPortal(children, document.body);
}
