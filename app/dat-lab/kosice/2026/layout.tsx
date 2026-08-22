// app/dat-lab/kosice/2026/layout.tsx
// Metadata for the archived DAT Lab: Košice 2026 page (must be a Server
// Component, since page.tsx is a Client Component for the EN/SK toggle).
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "DAT Lab: Košice 2026 — Dramatic Adventure Theatre",
  description:
    "Archive: the founding edition of DAT Lab — a creative laboratory in Košice with NYC-based DAT artists and local theatre artists, culminating in Water That Wanders on August 1, 2026. Part of PASSAGE: Slovakia.",
  openGraph: {
    title: "DAT Lab: Košice 2026 — Dramatic Adventure Theatre",
    description:
      "US, Slovak, and Romani artists devising original, site-responsive performance material in Eastern Slovakia. July 17 – August 1, 2026.",
  },
  robots: { index: true, follow: true },
};

export default function DatLabKosice2026Layout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
