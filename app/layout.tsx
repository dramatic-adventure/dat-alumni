// app/layout.tsx
import "@/app/globals.css";
import type { ReactNode } from "react";
import Providers from "./providers";

import { Anton, DM_Sans, Space_Grotesk, Rock_Salt, VT323, Special_Elite, Share_Tech_Mono, Cutive_Mono, Anonymous_Pro, Syne_Mono, Major_Mono_Display, Zilla_Slab, Redacted_Script } from "next/font/google";
import localFont from "next/font/local";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";

// DAT Core Fonts
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-dm-sans", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-space-grotesk", display: "swap" });
const rockSalt = Rock_Salt({ subsets: ["latin"], weight: "400", variable: "--font-rock-salt", display: "swap" });
const gloucester = localFont({ src: "../public/fonts/GloucesterMT-ExtraCondensed.woff2", variable: "--font-gloucester", display: "swap" });

// Passport Stamp Fonts
const vt323 = VT323({ subsets: ["latin"], weight: "400", variable: "--font-vt323", display: "swap" });
const specialElite = Special_Elite({ subsets: ["latin"], weight: "400", variable: "--font-special-elite", display: "swap" });
const shareTechMono = Share_Tech_Mono({ subsets: ["latin"], weight: "400", variable: "--font-share-tech", display: "swap" });
const cutiveMono = Cutive_Mono({ subsets: ["latin"], weight: "400", variable: "--font-cutive-mono", display: "swap" });
const anonymousPro = Anonymous_Pro({ subsets: ["latin"], weight: "400", variable: "--font-anonymous-pro", display: "swap" });
const syneMono = Syne_Mono({ subsets: ["latin"], weight: "400", variable: "--font-syne-mono", display: "swap" });
const majorMono = Major_Mono_Display({ subsets: ["latin"], weight: "400", variable: "--font-major-mono", display: "swap" });
const zillaSlab = Zilla_Slab({ subsets: ["latin"], weight: "400", variable: "--font-zilla-slab", display: "swap" });
const redactedScript = Redacted_Script({ subsets: ["latin"], weight: "400", variable: "--font-redacted", display: "swap" });

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
                  ${anonymousPro.variable} ${syneMono.variable} ${majorMono.variable} ${zillaSlab.variable} ${redactedScript.variable}
                  font-sans`}
    >
      <body className="min-h-screen flex flex-col text-black">
        <Providers>
          <Header />
          <main className="grow w-full p-0 m-0">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
