// app/layout.tsx
import "@/app/globals.css";
import type { ReactNode } from "react";

import WarmNameStackHints from "@/components/WarmNameStackHints";
import Providers from "./providers";

// ✅ Keep it imported, but only render in production (see below)
import ChunkErrorReload from "./ChunkErrorReload";

import localFont from "next/font/local";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";

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

// Major Mono Display (400)
const majorMono = localFont({
  variable: "--font-major-mono",
  display: "swap",
  src: [
    {
      path: "../public/fonts/major-mono-display-v17-latin-regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
});

export const metadata = {
  title: "Dramatic Adventure Theatre – Alumni Stories",
  description: "Immersive global storytelling from DAT artists.",
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
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
        majorMono.variable,
        zillaSlab.variable,
        "font-sans",
      ].join(" ")}
      suppressHydrationWarning
    >
      <head>
        <link rel="preload" as="image" href="/texture/kraft-paper.png" />
        <meta name="theme-color" content="#241123" />
      </head>

      <body className="min-h-screen flex flex-col text-black">
        <WarmNameStackHints />

        {/* ✅ Only run in prod so dev can never get stuck */}
        {enableChunkRecovery ? <ChunkErrorReload /> : null}

        <Providers>
          <Header />

          {/* give bottom clearance so in-page footer nav can't hide behind Footer */}
          <main className="grow w-full p-0 m-0 pb-24">{children}</main>

          {/* force Footer above any page overlays */}
          <div className="mt-auto relative z-50">
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
