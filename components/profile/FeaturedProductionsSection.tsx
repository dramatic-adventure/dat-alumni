// components/profile/FeaturedProductionsSection.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

// Converts "24px" | "1.5rem" | number -> number (px guess for strings)
function toNumber(v: string | number | undefined, fallback = 0) {
  if (v == null) return fallback;
  if (typeof v === "number") return v;
  // Extract a leading numeric value: "24px" -> 24, "1.5rem" -> 1.5
  const m = String(v).match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : fallback;
}

type FeaturedProductionsSectionProps = {
  // Example props – adjust to your real ones
  cardGap?: string | number;     // e.g., "16px" or 16
  cardWidth?: string | number;   // e.g., "280px" or 280
  items: Array<{
    href: string;
    title: string;
    imageUrl?: string;
    subtitle?: string;
  }>;
};

export default function FeaturedProductionsSection({
  cardGap = 16,
  cardWidth = 280,
  items,
}: FeaturedProductionsSectionProps) {
  // ✅ Ensure arithmetic is on numbers
  const gapNum = toNumber(cardGap, 16);
  const cardWNum = toNumber(cardWidth, 280);

  const totalWidth = useMemo(() => {
    const count = items.length;
    return count > 0 ? count * cardWNum + (count - 1) * gapNum : 0;
  }, [items.length, cardWNum, gapNum]);

  return (
    <section aria-labelledby="featured-productions-heading" className="bg-transparent">
      <div style={{ width: "90%", margin: "0 auto", padding: "2rem 0" }}>
        <h2 id="featured-productions-heading" className="text-sm font-semibold uppercase tracking-[0.22em] text-[#241123]/70">
          Featured Productions
        </h2>

        <div className="mt-4 overflow-x-auto">
          <ul
            className="flex"
            style={{
              gap: gapNum,
              width: totalWidth || "auto",
              minWidth: "100%",
              paddingBottom: 8,
            }}
          >
            {items.map((it) => (
              <li key={it.href} style={{ width: cardWNum, minWidth: cardWNum }}>
                <Link
                  href={it.href}
                  className="block rounded-2xl bg-white/90 shadow-sm border border-[#241123]/10 overflow-hidden no-underline"
                  style={{ color: "#241123" }}
                >
                  <div className="relative h-40 bg-[#F5F2EC]">
                    {it.imageUrl ? (
                      <Image src={it.imageUrl} alt={it.title} fill className="object-cover" />
                    ) : null}
                  </div>
                  <div className="p-3">
                    <p className="text-[0.9rem] font-semibold">{it.title}</p>
                    {it.subtitle && <p className="text-xs text-[#241123]/70 mt-1">{it.subtitle}</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
