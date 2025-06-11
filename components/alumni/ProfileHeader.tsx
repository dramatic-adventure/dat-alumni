// components/alumni/ProfileHeader.tsx

import Image from "next/image";

export default function ProfileHeader({
  name,
  role,
  headshotUrl,
  programBadges,
}: {
  name: string;
  role: string;
  headshotUrl: string;
  programBadges: string[];
}) {
  return (
    <div className="flex flex-col items-start gap-4">
      {/* Headshot */}
      <div className="w-full aspect-[3/4] relative rounded-xl overflow-hidden shadow-lg">
        <Image
          src={headshotUrl}
          alt={name}
          fill
          className="object-cover"
        />
      </div>

      {/* Name block */}
      <div className="bg-white px-4 py-2 rounded text-4xl font-display leading-tight tracking-tight" style={{ fontFamily: 'Anton, sans-serif' }}>
        {name}
      </div>

      {/* Role (right-aligned, subtle) */}
      <div className="text-sm text-right w-full text-gray-600 italic">
        {role}
      </div>

      {/* Program badges */}
      <div className="flex flex-col gap-2 mt-2">
        {programBadges.map((badge, i) => (
          <span
            key={i}
            className="px-3 py-1 border border-white text-white text-sm rounded-full bg-[#241123]/80 font-medium whitespace-nowrap"
          >
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}
