'use client';
import Image from "next/image";

export default function ProfileImage({ src, alt }: { src: string; alt: string }) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      className="mb-4 rounded"
    />
  );
}
