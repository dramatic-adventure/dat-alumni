// app/privacy/layout.tsx
// Holds metadata for the privacy page (must be a Server Component).
import type { Metadata, ReactNode } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Dramatic Adventure Theatre",
  description:
    "Privacy policy for the Dramatic Adventure Theatre alumni platform and connected services.",
  robots: { index: true, follow: true },
};

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
