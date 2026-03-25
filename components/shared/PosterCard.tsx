// components/shared/PosterCard.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export interface PosterCardProps {
  href: string;
  title: string;
  subtitle?: string;
  imageSrc?: string;
  imageAlt?: string;

  /**
   * Optional override. In most cases you can omit this and let the
   * component auto-derive a label. If you pass "Production", it will be
   * treated as legacy and ignored in favor of the new logic.
   */
  eyebrow?: string;
}

const FALLBACK_POSTER_URL = "/posters/fallback-16x9.jpg";

/**
 * Normalize static poster paths into something Next can safely use.
 * Handles:
 * - undefined / empty → fallback
 * - "public/posters/foo.jpg" → "/posters/foo.jpg"
 * - "posters/foo.jpg" → "/posters/foo.jpg"
 */
function normalizePosterSrc(raw?: string | null): string {
  if (!raw) return FALLBACK_POSTER_URL;

  let src = raw.trim();

  // Strip accidental "public/" prefix
  if (src.startsWith("public/")) {
    src = src.slice("public/".length);
  }

  // Ensure root-relative for local assets
  if (!src.startsWith("/") && !src.startsWith("http")) {
    src = `/${src}`;
  }

  return src || FALLBACK_POSTER_URL;
}

/**
 * Decide what the little label above the title should say.
 *
 * Rules:
 * - If eyebrow is provided and not literally "production" → use it.
 * - If href starts with /film/ → "Film".
 * - If href starts with /cause/ → "Cause".
 * - If href starts with /theme/ or /themes/ → "Theme".
 * - If title contains `--`, use the suffix after it:
 *     "A Girl Without Wings -- Staged Reading" → "Staged Reading"
 *     "… -- Workshop Production" → "Workshop Production"
 * - Otherwise → "Theatre".
 */
function deriveMediumLabel({
  href,
  title,
  eyebrow,
}: Pick<PosterCardProps, "href" | "title" | "eyebrow">): string {
  const override = eyebrow?.trim();

  // Respect explicit override, except legacy "Production"
  if (override && override.toLowerCase() !== "production") {
    return override;
  }

  const path = href ?? "";

  // Route-based inference
  if (path.startsWith("/film/")) return "Film";
  if (path.startsWith("/cause/")) return "Cause";
  if (path.startsWith("/theme/") || path.startsWith("/themes/")) return "Theme";

  // Title suffix after `--` for readings/workshops/etc.
  const raw = title ?? "";
  const idx = raw.indexOf("--");
  if (idx !== -1) {
    const suffix = raw.slice(idx + 2).trim();
    if (suffix) return suffix;
  }

  // Default for anything theatre-ish
  return "Theatre";
}

export default function PosterCard({
  href,
  title,
  subtitle,
  imageSrc,
  imageAlt,
  eyebrow,
}: PosterCardProps) {
  const mediumLabel = deriveMediumLabel({ href, title, eyebrow });

  // Normalize once, then allow runtime fallback if the image 404s
  const [resolvedSrc, setResolvedSrc] = useState(
    normalizePosterSrc(imageSrc || FALLBACK_POSTER_URL),
  );

  return (
    <Link href={href} className="poster-card no-underline">
      <div className="poster-image-shell">
        <Image
          src={resolvedSrc}
          alt={imageAlt || title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
          onError={() => {
            if (resolvedSrc !== FALLBACK_POSTER_URL) {
              setResolvedSrc(FALLBACK_POSTER_URL);
            }
          }}
        />
      </div>

      <div className="poster-meta">
        {mediumLabel && (
          <div className="poster-eyebrow">{mediumLabel}</div>
        )}
        <h3 className="poster-title">{title}</h3>
        {subtitle && <p className="poster-subtitle">{subtitle}</p>}
      </div>
    </Link>
  );
}
