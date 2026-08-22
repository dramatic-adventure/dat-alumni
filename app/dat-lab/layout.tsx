// app/dat-lab/layout.tsx
// Metadata for the DAT Lab index (hub) page. Edition pages under
// /dat-lab/kosice and /dat-lab/baltimore override this in their own layouts.
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "DAT Lab — Dramatic Adventure Theatre",
  description:
    "DAT Lab is Dramatic Adventure Theatre's laboratory for creating and shaping original performance material — intimate, artist-centered, collaborative, immediate. Each Lab lives in a particular place and grows from the artists in the room.",
  openGraph: {
    title: "DAT Lab — Dramatic Adventure Theatre",
    description:
      "DAT's laboratory for creating and shaping original performance material. Each Lab lives in a particular place and grows from the artists in the room.",
  },
  robots: { index: true, follow: true },
};

export default function DatLabLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
