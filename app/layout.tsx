// app/layout.tsx
import "@/app/globals.css";
import { Anton, DM_Sans, Space_Grotesk, Rock_Salt } from "next/font/google";
import localFont from "next/font/local";
import Header from "@/components/Header";
import type { ReactNode } from "react";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const rockSalt = Rock_Salt({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-rock-salt",
  display: "swap",
});

const gloucester = localFont({
  src: "../public/fonts/GloucesterMT-ExtraCondensed.woff2",
  variable: "--font-gloucester",
  display: "swap",
});

export const metadata = {
  title: "Dramatic Adventure Theatre – Alumni Stories",
  description: "Immersive global storytelling from DAT artists.",
  metadataBase: new URL("https://stories.dramaticadventure.com"), // ✅ Use your real domain in production
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${dmSans.variable} ${spaceGrotesk.variable} ${rockSalt.variable} ${gloucester.variable} font-sans`}
    >
      <body className="min-h-screen flex flex-col text-black">
        <Header />
        <main className="z-0 flex-grow w-full max-w-6xl mx-auto px-4 pt-4 sm:px-12 bg-[url('/texture/kraft-paper.png')] bg-cover bg-center bg-fixed">
          {children}
        </main>
      </body>
    </html>
  );
}
