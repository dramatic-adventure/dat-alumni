"use client";

import { useRouter } from "next/navigation";

interface LocationBadgeProps {
  location?: string;
  className?: string;
}

export default function LocationBadge({ location }: { location?: string }) {
  if (!location || typeof location !== "string") return null;

  const locationSlug = location.toLowerCase().replace(/\s+/g, "-");
  const link = `/locations/${locationSlug}`;

  return (
    <a
      href={link}
      className="text-[#9B2915] text-sm font-semibold uppercase tracking-widest underline hover:text-red-800"
    >
      Based in {location}
    </a>
  );
}

