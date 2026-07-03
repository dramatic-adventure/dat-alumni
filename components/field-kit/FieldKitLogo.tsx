// components/field-kit/FieldKitLogo.tsx
//
// Field Kit top-bar DAT badge. MUST be a plain <a href="/"> with no target
// attribute. "/" is OUTSIDE the manifest scope ("/field-kit"); per Apple's own
// WWDC23 PWA guidance, a plain top-level navigation to an out-of-scope URL is
// what triggers iOS to hand it off to a Safari View Controller (a real browser
// view with a Done/back control), breaking out of the installed standalone app.
// target="_blank" (and window.open) are explicitly documented to do the
// OPPOSITE — they always stay inside the standalone app regardless of scope —
// which is why adding it here previously made the logo link feel "stuck in the
// app". Same pattern as the same-origin "View full profile →" link in
// ArtistView.tsx. The logo image + #ffcc00 glow are unchanged from the
// layout's original markup.

import Image from "next/image";

export default function FieldKitLogo() {
  return (
    <a
      href="/"
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
