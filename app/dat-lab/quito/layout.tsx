// app/dat-lab/quito/layout.tsx
// Metadata for the DAT Lab: Quito page (must be a Server Component,
// since page.tsx is a Client Component for the EN/ES language toggle).
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "DAT Lab: Quito | Dramatic Adventure Theatre",
  description:
    "DAT's new-work laboratory returns to Ecuador — a January 2027 residency in Quito building the Spanish-language edition of A GIRL WITHOUT WINGS. Ecuadorian and Spanish-speaking theatre artists: get involved.",
  openGraph: {
    title: "DAT Lab: Quito | Dramatic Adventure Theatre",
    description:
      "DAT's new-work laboratory returns to Ecuador — a January 2027 residency in Quito building the Spanish-language edition of A GIRL WITHOUT WINGS. Ecuadorian and Spanish-speaking theatre artists: get involved.",
  },
  robots: { index: true, follow: true },
};

export default function DatLabQuitoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
