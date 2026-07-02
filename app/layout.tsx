// app/layout.tsx
import "@/app/globals.css";
import type { ReactNode } from "react";
import type { Viewport } from "next";

import WarmNameStackHints from "@/components/WarmNameStackHints";
import Providers from "./providers";

// ✅ Keep it imported, but only render in production (see below)
import ChunkErrorReload from "./ChunkErrorReload";

import SiteChrome from "@/components/ui/SiteChrome";
import ComingSoonModal from "@/components/ui/ComingSoonModal";

import {
  anton,
  dmSans,
  spaceGrotesk,
  rockSalt,
  gloucester,
  vt323,
  specialElite,
  shareTechMono,
  cutiveMono,
  anonymousPro,
  syneMono,
  zillaSlab,
} from "./fonts";

function normalizeBaseUrl(raw?: string) {
  const s = String(raw ?? "").trim();
  if (!s || s === "undefined" || s === "null") return undefined;
  // allow values like "example.com" by auto-adding https
  const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  return withProto.replace(/\/+$/, "");
}

function resolveMetadataBase() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL, // your explicit preferred canonical
    process.env.SITE_URL,             // Netlify standard
    process.env.URL,                  // Netlify runtime
    process.env.DEPLOY_PRIME_URL,     // Netlify previews
    process.env.DEPLOY_URL,           // Netlify alt
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ];

  for (const c of candidates) {
    const normalized = normalizeBaseUrl(c);
    if (normalized) return new URL(normalized);
  }

  return new URL("http://localhost:3000");
}

export const metadata = {
  title: "Dramatic Adventure Theatre – Alumni Stories",
  description: "Immersive global storytelling from DAT artists.",
  metadataBase: resolveMetadataBase(),
};

// ✅ viewportFit: "cover" lets the page (and its fixed kraft background) extend
// into the iOS safe-area / notch regions instead of being letterboxed with
// white bars in landscape. themeColor keeps the safe areas brand-colored.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#241123",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // ✅ Server-side guard: never allow reload-loop helpers during local dev
  const enableChunkRecovery = process.env.NODE_ENV === "production";

  return (
    <html
      lang="en"
      className={[
        anton.variable,
        dmSans.variable,
        spaceGrotesk.variable,
        rockSalt.variable,
        gloucester.variable,
        vt323.variable,
        specialElite.variable,
        shareTechMono.variable,
        cutiveMono.variable,
        anonymousPro.variable,
        syneMono.variable,
        zillaSlab.variable,
        "font-sans",
      ].join(" ")}
      suppressHydrationWarning
    >
      <head>
        <link rel="preload" as="image" href="/texture/kraft-paper.png" />
      </head>

      <body className="min-h-screen flex flex-col text-black">
        <WarmNameStackHints />

        {/* ✅ Only run in prod so dev can never get stuck */}
        {enableChunkRecovery ? <ChunkErrorReload /> : null}

        <Providers>
          <ComingSoonModal />
          {/* SiteChrome renders the global Header/Footer on marketing routes and a
              bare app surface (no header/footer) on /field-kit. */}
          <SiteChrome>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
