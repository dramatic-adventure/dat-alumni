"use client";

import Link from "next/link";

interface LocationBadgeProps {
  location?: string;
  className?: string;
}

export default function LocationBadge({ location, className = "" }: LocationBadgeProps) {
  const trimmedLocation = location?.trim();

  if (!trimmedLocation) return null;

  const locationSlug = trimmedLocation.toLowerCase().replace(/\s+/g, "-");
  const link = `/location/${locationSlug}`; // ✅ Match your folder name (singular)

  if (process.env.NODE_ENV === "development") {
    console.log("🔍 LocationBadge →", { trimmedLocation, link });
  }

  return (
    <Link
      href={link}
      className={`text-[#9B2915] text-sm font-semibold uppercase tracking-widest underline hover:text-red-800 ${className}`}
    >
      Based in {trimmedLocation}
    </Link>
  );
}
