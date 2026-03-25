// components/productions/PosterImageWithFallback.tsx
"use client";

import { useState } from "react";
import Image from "next/image";

const FALLBACK_POSTER = "/posters/fallback-16x9.jpg";

type Props = {
  src?: string;
  alt: string;
  fill?: boolean;
  className?: string;
};

export default function PosterImageWithFallback({
  src,
  alt,
  fill,
  className,
}: Props) {
  const [currentSrc, setCurrentSrc] = useState(src || FALLBACK_POSTER);

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill={fill}
      className={className}
      onError={() => {
        if (currentSrc !== FALLBACK_POSTER) {
          setCurrentSrc(FALLBACK_POSTER);
        }
      }}
    />
  );
}
