// components/alumni/IdentityTags.tsx

"use client";

export default function IdentityTags({ tags }: { tags: string[] }) {
  return (
    <>
      {tags.map((tag, i) => (
        <span
          key={i}
          className="text-sm md:text-xs px-3 py-1 rounded-full bg-green-700 text-white font-medium"
        >
          {tag}
        </span>
      ))}
    </>
  );
}
