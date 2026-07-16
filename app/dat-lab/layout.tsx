// app/dat-lab/layout.tsx
// Holds metadata for the DAT Lab: Košice page (must be a Server Component,
// since page.tsx is a Client Component for the EN/SK language toggle).
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "DAT Lab: Košice — Dramatic Adventure Theatre",
  description:
    "A creative laboratory in Košice with NYC-based DAT artists and local theatre artists, culminating in Water That Wanders on August 1, 2026. Part of PASSAGE: Slovakia.",
  openGraph: {
    title: "DAT Lab: Košice — Dramatic Adventure Theatre",
    description:
      "US, Slovak, and Romani artists devising original, site-responsive performance material in Eastern Slovakia. July 17 – August 1, 2026.",
  },
  robots: { index: true, follow: true },
};

export default function DatLabLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
