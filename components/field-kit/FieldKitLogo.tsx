// components/field-kit/FieldKitLogo.tsx
//
// Field Kit top-bar DAT badge. Always a plain <a href="/"> — a real navigation to
// "/", which is OUTSIDE the manifest scope ("/field-kit"). target="_blank" forces
// this out to the system browser (a real new window/tab) instead of the installed
// standalone app's in-app overlay, which otherwise still reads as "inside the app"
// even with its Done button. The logo image + #ffcc00 glow are unchanged from the
// layout's original markup.

import Image from "next/image";

export default function FieldKitLogo() {
  return (
    <a
      href="/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Dramatic Adventure Theatre — home"
      style={{
        flexShrink: 0,
        display: "inline-flex",
        textDecoration: "none",
        marginBottom: -36,
      }}
    >
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
    </a>
  );
}
