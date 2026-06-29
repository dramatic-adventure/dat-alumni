// components/field-kit/FieldKitLogo.tsx
//
// Field Kit top-bar DAT badge. Normally links home in the same tab (web). But when
// running as the INSTALLED standalone app, "/" opens in the EXTERNAL browser
// (Safari) instead — a deliberate "leave the app, open the website" exit, so the
// website doesn't take over the installed app window. The logo image + #ffcc00 glow
// are unchanged from the layout's original markup.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari exposes this non-standard flag for home-screen apps.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function FieldKitLogo() {
  const [standalone, setStandalone] = useState(false);

  // Resolved client-side only (matchMedia/navigator.standalone aren't available
  // during SSR); defaults to same-tab navigation until then.
  useEffect(() => {
    setStandalone(isStandalone());
  }, []);

  const badge = (
    <Image
      src="/images/dat-mobile-logo.png"
      alt="DAT"
      width={64}
      height={64}
      priority
      // #ffcc00 glow — drop-shadow follows the logo's alpha (circular badge),
      // so it haloes the shape rather than a square box.
      style={{ display: "block", filter: "drop-shadow(0 0 5px rgba(255,204,0,0.85)) drop-shadow(0 0 13px rgba(255,204,0,0.45))" }}
    />
  );

  const baseStyle: React.CSSProperties = {
    flexShrink: 0,
    display: "inline-flex",
    textDecoration: "none",
    marginBottom: -36,
  };

  if (standalone) {
    return (
      <a
        href="/"
        target="_blank"
        rel="noopener"
        aria-label="Dramatic Adventure Theatre — open the website"
        style={baseStyle}
      >
        {badge}
      </a>
    );
  }

  return (
    <Link href="/" aria-label="Dramatic Adventure Theatre — home" style={baseStyle}>
      {badge}
    </Link>
  );
}
