"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export type ProductionCarouselCardProps = {
  slug: string;
  title: string;
  seasonLabel?: string | null;
  dates?: string | null;
  hrefBase?: string; // default: "/theatre"
  heroImageUrl?: string | null;
  fallbackImageUrl?: string; // default: "/posters/fallback-16x9.jpg"
  ariaLabel?: string;
};

function cleanStr(v?: string | null): string | undefined {
  const t = (v ?? "").trim();
  return t.length ? t : undefined;
}

export default function ProductionCarouselCard({
  slug,
  title,
  seasonLabel,
  dates,
  hrefBase = "/theatre",
  heroImageUrl,
  fallbackImageUrl = "/posters/fallback-16x9.jpg",
  ariaLabel,
}: ProductionCarouselCardProps) {
  const t = cleanStr(title) ?? "";
  const season = cleanStr(seasonLabel);
  const d = cleanStr(dates);

  const metaLine = [season, d].filter(Boolean).join(" • ");

  const [imgSrc, setImgSrc] = useState<string>(
    cleanStr(heroImageUrl) ? (heroImageUrl as string) : fallbackImageUrl
  );

  const href = `${hrefBase}/${slug}`;

  return (
    <Link
      href={href}
      className="related-card no-underline"
      aria-label={ariaLabel ?? t}
    >
      <div className="related-image-shell">
        <Image
          src={imgSrc}
          alt={t || "Production image"}
          fill
          sizes="(max-width: 900px) 86vw, 340px"
          className="object-cover"
          onError={() => {
            if (imgSrc !== fallbackImageUrl) setImgSrc(fallbackImageUrl);
          }}
        />
      </div>

      <div className="related-meta">
        <div className="related-title">{t}</div>

        {metaLine ? <div className="related-sub">{metaLine}</div> : null}
      </div>
    </Link>
  );
}
