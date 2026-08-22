// app/dat-lab/kosice/layout.tsx
// Metadata for the evergreen DAT Lab: Košice city-edition page (must be a
// Server Component, since page.tsx is a Client Component for the EN/SK
// toggle). The archived 2026 edition overrides this in 2026/layout.tsx.
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "DAT Lab: Košice — Dramatic Adventure Theatre",
  description:
    "The founding edition of DAT Lab, created with ETP Slovensko in Košice, Slovakia. Returns June–July 2027 to begin a new original piece devised across the 2027 and 2028 cohorts.",
  openGraph: {
    title: "DAT Lab: Košice — Dramatic Adventure Theatre",
    description:
      "The founding edition of DAT Lab, created with ETP Slovensko in Košice, Slovakia. Returns June–July 2027 to begin a new original piece devised across the 2027 and 2028 cohorts.",
  },
  robots: { index: true, follow: true },
};

export default function DatLabKosiceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
