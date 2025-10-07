// app/layout.tsx
import "@/app/globals.css";
import type { ReactNode } from "react";
import Providers from "./providers";
import ChunkErrorReload from "./ChunkErrorReload";

import localFont from "next/font/local";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";

// =============================
// Local fonts (self-hosted)
// =============================

// Anton (400)
const anton = localFont({
  variable: "--font-anton",
  display: "swap",
  src: [{ path: "../public/fonts/anton-v26-latin-regular.woff2", weight: "400", style: "normal" }],
});

// DM Sans (all weights/italics you listed)
const dmSans = localFont({
  variable: "--font-dm-sans",
  display: "swap",
  src: [
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-100.woff2", weight: "100", style: "normal" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-100italic.woff2", weight: "100", style: "italic" },

    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-200.woff2", weight: "200", style: "normal" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-200italic.woff2", weight: "200", style: "italic" },

    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-300.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-300italic.woff2", weight: "300", style: "italic" },

    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-italic.woff2", weight: "400", style: "italic" },

    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-500.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-500italic.woff2", weight: "500", style: "italic" },

    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-600.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-600italic.woff2", weight: "600", style: "italic" },

    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-700.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-700italic.woff2", weight: "700", style: "italic" },

    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-800.woff2", weight: "800", style: "normal" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-800italic.woff2", weight: "800", style: "italic" },

    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-900.woff2", weight: "900", style: "normal" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-900italic.woff2", weight: "900", style: "italic" },
  ],
});

// Space Grotesk (300/400/500/600/700)
const spaceGrotesk = localFont({
  variable: "--font-space-grotesk",
  display: "swap",
  src: [
    { path: "../public/fonts/space-grotesk-v21-latin/space-grotesk-v21-latin-300.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/space-grotesk-v21-latin/space-grotesk-v21-latin-regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/space-grotesk-v21-latin/space-grotesk-v21-latin-500.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/space-grotesk-v21-latin/space-grotesk-v21-latin-600.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/space-grotesk-v21-latin/space-grotesk-v21-latin-700.woff2", weight: "700", style: "normal" },
  ],
});

// Rock Salt (400)
const rockSalt = localFont({
  variable: "--font-rock-salt",
  display: "swap",
  src: [{ path: "../public/fonts/rock-salt-v23-latin-regular.woff2", weight: "400", style: "normal" }],
});

// Gloucester (local)
const gloucester = localFont({
  variable: "--font-gloucester",
  display: "swap",
  src: [{ path: "../public/fonts/GloucesterMT-ExtraCondensed.woff2", weight: "400", style: "normal" }],
});

// VT323 (400)
const vt323 = localFont({
  variable: "--font-vt323",
  display: "swap",
  src: [{ path: "../public/fonts/vt323-v17-latin-regular.woff2", weight: "400", style: "normal" }],
});

// Special Elite (400)
const specialElite = localFont({
  variable: "--font-special-elite",
  display: "swap",
  src: [{ path: "../public/fonts/special-elite-v19-latin-regular.woff2", weight: "400", style: "normal" }],
});

// Share Tech Mono (400)
const shareTechMono = localFont({
  variable: "--font-share-tech",
  display: "swap",
  src: [{ path: "../public/fonts/share-tech-mono-v15-latin-regular.woff2", weight: "400", style: "normal" }],
});

// Cutive Mono (400)
const cutiveMono = localFont({
  variable: "--font-cutive-mono",
  display: "swap",
  src: [{ path: "../public/fonts/cutive-mono-v22-latin-regular.woff2", weight: "400", style: "normal" }],
});

// Anonymous Pro (400/700)
const anonymousPro = localFont({
  variable: "--font-anonymous-pro",
  display: "swap",
  src: [
    { path: "../public/fonts/anonymous-pro-v21-latin/anonymous-pro-v21-latin-regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/anonymous-pro-v21-latin/anonymous-pro-v21-latin-700.woff2", weight: "700", style: "normal" },
  ],
});

// Syne Mono (400)
const syneMono = localFont({
  variable: "--font-syne-mono",
  display: "swap",
  src: [{ path: "../public/fonts/syne-mono-v15-latin-regular.woff2", weight: "400", style: "normal" }],
});

// Major Mono Display (400)
const majorMono = localFont({
  variable: "--font-major-mono",
  display: "swap",
  src: [{ path: "../public/fonts/major-mono-display-v17-latin-regular.woff2", weight: "400", style: "normal" }],
});

// Zilla Slab (300/400/500/600/700)
const zillaSlab = localFont({
  variable: "--font-zilla-slab",
  display: "swap",
  src: [
    { path: "../public/fonts/zilla-slab-v11-latin/zilla-slab-v11-latin-300.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/zilla-slab-v11-latin/zilla-slab-v11-latin-regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/zilla-slab-v11-latin/zilla-slab-v11-latin-500.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/zilla-slab-v11-latin/zilla-slab-v11-latin-600.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/zilla-slab-v11-latin/zilla-slab-v11-latin-700.woff2", weight: "700", style: "normal" },
  ],
});

// =============================

export const metadata = {
  title: "Dramatic Adventure Theatre – Alumni Stories",
  description: "Immersive global storytelling from DAT artists.",
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${dmSans.variable} ${spaceGrotesk.variable} ${rockSalt.variable} ${gloucester.variable}
                  ${vt323.variable} ${specialElite.variable} ${shareTechMono.variable} ${cutiveMono.variable}
                  ${anonymousPro.variable} ${syneMono.variable} ${majorMono.variable} ${zillaSlab.variable}
                  font-sans`}
    >
      <head>
        {/* Preload the background texture used on /alumni/update */}
        <link rel="preload" as="image" href="/texture/kraft-paper.png" />
        <meta name="theme-color" content="#241123" />
      </head>
      <body className="min-h-screen flex flex-col text-black">
        <ChunkErrorReload />
        <Providers>
          <Header />
          <main className="grow w-full p-0 m-0">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
