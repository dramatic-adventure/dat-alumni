"use client";

import Image from "next/image";
import Link from "next/link";

interface MiniProfileCardProps {
  name: string;
  role?: string;
  slug: string;
  headshotUrl: string;
}

export default function MiniProfileCard({
  name,
  role,
  slug,
  headshotUrl,
}: MiniProfileCardProps) {
  return (
    <Link
      href={`/alumni/${slug}`}
      className="group block w-full max-w-sm overflow-hidden"
    >
      <div className="relative aspect-[3/4] bg-neutral-200">
        <Image
          src={headshotUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="pt-3">
        <h3 className="text-lg font-bold uppercase">{name}</h3>
        {role && <p className="text-sm text-neutral-600">{role}</p>}
      </div>
    </Link>
  );
}