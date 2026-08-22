// app/dat-lab/baltimore/layout.tsx
// Metadata for the DAT Lab: Baltimore page. OG image: site default for now.
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "DAT Lab: Baltimore | Dramatic Adventure Theatre",
  description:
    "DAT's new-work laboratory comes to Baltimore — a hot-rehearsal residency developing THE ATTENDANT, a performance made for an actual sauna. Baltimore theatre artists and performer-practitioners from the wellness world: get involved.",
  openGraph: {
    title: "DAT Lab: Baltimore | Dramatic Adventure Theatre",
    description:
      "DAT's new-work laboratory comes to Baltimore — a hot-rehearsal residency developing THE ATTENDANT, a performance made for an actual sauna. Baltimore theatre artists and performer-practitioners from the wellness world: get involved.",
  },
  robots: { index: true, follow: true },
};

export default function DatLabBaltimoreLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
