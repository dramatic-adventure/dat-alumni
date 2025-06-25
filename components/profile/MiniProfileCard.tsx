"use client";

import Image from "next/image";
import Link from "next/link";

interface MiniProfileCardProps {
  name: string;
  role?: string;
  slug: string;
  headshotUrl?: string;
}

export default function MiniProfileCard({
  name,
  role,
  slug,
  headshotUrl,
}: MiniProfileCardProps) {
  const fallbackImage = "/images/default-headshot.png";

  return (
    <Link
      href={`/alumni/${slug}`}
      className="group block w-full max-w-sm overflow-hidden"
    >
      <div className="relative aspect-[3/4] bg-[#C39B6C] rounded-lg shadow-md">
        <Image
          src={headshotUrl || fallbackImage}
          alt={name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg"
        />
      </div>

      <div className="pt-3">
        <h3 className="text-lg font-bold uppercase">{name}</h3>

        {role && (
          <p className="text-sm text-neutral-600">{role}</p> // ✅ only renders if role exists
        )}
      </div>
    </Link>
  );
}
