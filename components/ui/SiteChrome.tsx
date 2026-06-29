// components/ui/SiteChrome.tsx
//
// Decides whether a route gets the global marketing chrome (Header + Footer) or
// renders as a bare "app surface". The Field Kit (/field-kit/*) is an app-like
// experience with its OWN chrome (a slim top bar + the bottom CompanionTabBar),
// so the global fixed header (which would overlap content) and the marketing
// footer are suppressed there, along with the footer-clearance bottom padding.
//
// Header/Footer are already client components and this needs usePathname(), so
// this wrapper is a client component. Server-rendered `children` are passed
// through untouched (the standard App Router pattern).

"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";

// Route prefixes that render without the global marketing chrome.
const BARE_PREFIXES = ["/field-kit"];

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const bare = BARE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // App surface: stop the overscroll "rubber-band" and match the document
  // background to the Field Kit's dark plum (T.bg), so an overscroll bounce at
  // the top/bottom can never reveal the site's kraft-paper background. Reverted
  // when navigating back to a marketing route.
  useEffect(() => {
    if (!bare) return;
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverscroll: html.style.overscrollBehavior,
      htmlBg: html.style.backgroundColor,
      bodyBg: body.style.backgroundColor,
    };
    html.style.overscrollBehavior = "none";
    html.style.backgroundColor = "#16101c"; // T.bg
    body.style.backgroundColor = "#16101c";
    return () => {
      html.style.overscrollBehavior = prev.htmlOverscroll;
      html.style.backgroundColor = prev.htmlBg;
      body.style.backgroundColor = prev.bodyBg;
    };
  }, [bare]);

  if (bare) {
    // App surface: no global header/footer, no footer-clearance padding.
    return <main className="grow w-full p-0 m-0">{children}</main>;
  }

  return (
    <>
      <Header />
      {/* bottom clearance so in-page footer nav can't hide behind Footer */}
      <main className="grow w-full p-0 m-0 pb-24">{children}</main>
      {/* footer sits above normal page content but below the fixed header (z-50) */}
      <div className="mt-auto relative z-10">
        <Footer />
      </div>
    </>
  );
}
