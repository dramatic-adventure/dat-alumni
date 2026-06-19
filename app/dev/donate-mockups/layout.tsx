// MOCKUP-ONLY ROUTE — /dev/donate-mockups (safe to delete)
import type { Metadata } from "next";
import Link from "next/link";
import "./mockup.css";

export const metadata: Metadata = {
  title: "Donate mockups — DAT (internal)",
  robots: { index: false, follow: false },
};

export default function DonateMockupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dm-page">
      <div className="dm-banner font-sans">
        Design mockup — not connected to payment ·{" "}
        <Link href="/dev/donate-mockups">All options</Link>
      </div>
      {children}
    </div>
  );
}
