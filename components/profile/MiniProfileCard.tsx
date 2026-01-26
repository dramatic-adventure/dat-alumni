"use client";

import Image from "next/image";
import Link from "next/link";
import { CSSProperties, useEffect, useMemo, useState, useCallback } from "react";
import { useHeadshot } from "@/components/profile/HeadshotProvider";

interface MiniProfileCardProps {
  name: string;
  role: string;
  slug: string;
  headshotUrl?: string;
  customStyle?: CSSProperties;
  nameFontSize?: number;
  roleFontSize?: number;
  priority?: boolean;

  variant?: "dark" | "light";
  href?: string;

  badgeLabel?: string;
  highlightFrame?: boolean;

  /**
   * ✅ Cache-bust key that changes when the headshot changes.
   * Pass EnrichedProfile.headshotCacheKey when available.
   */
  cacheKey?: string | number;
}

function addCacheBust(url: string, cacheKey?: string | number) {
  const raw = String(url || "").trim();
  if (!raw) return raw;
  if (cacheKey === undefined || cacheKey === null || cacheKey === "") return raw;

  try {
    // Only touch our proxy URLs
    if (!raw.startsWith("/api/img?")) return raw;

    const u = new URL(raw, "http://local"); // base required for relative URLs
    if (u.searchParams.has("v")) return raw;

    u.searchParams.set("v", String(cacheKey));
    return u.pathname + "?" + u.searchParams.toString();
  } catch {
    return raw;
  }
}

export default function MiniProfileCard({
  name,
  role,
  slug,
  headshotUrl,
  customStyle,
  nameFontSize,
  roleFontSize,
  priority = false,

  variant = "dark",
  href,

  badgeLabel,
  highlightFrame = false,

  cacheKey,
}: MiniProfileCardProps) {
  const defaultImage = "/images/default-headshot.png";  

  // Enrichment should already provide /api/img?url=... or default.
  // We still harden here: blank => default.
  const hs = useHeadshot(slug);

  const baseSrc = useMemo(() => {
    // Prefer explicit prop if provided
    const prop = String(headshotUrl ?? "").trim().replace(/\s+/g, "");
    if (prop) return prop;

    // Else, prefer authoritative enriched headshot from provider
    const ctx = String(hs?.url || "").trim();
    if (ctx) return ctx;

    // Else default
    return defaultImage;
  }, [headshotUrl, hs?.url, defaultImage]);

  const effectiveCacheKey = cacheKey ?? hs?.cacheKey;

  const srcWithBust = useMemo(() => {
    // Only bust cache for non-default images.
    if (baseSrc === defaultImage) return baseSrc;
    return addCacheBust(baseSrc, effectiveCacheKey);
  }, [baseSrc, defaultImage, effectiveCacheKey]);


  // ✅ One-way fallback to default
  const [imgSrc, setImgSrc] = useState<string>(srcWithBust);

  useEffect(() => {
    setImgSrc(srcWithBust);
  }, [srcWithBust]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("[MiniProfileCard]", { slug, srcWithBust, cacheKey });
    }
  }, [slug, srcWithBust, cacheKey]);

  const handleError = useCallback(() => {
    setImgSrc((prev) => (prev === defaultImage ? prev : defaultImage));
  }, [defaultImage]);

  const isLight = variant === "light";
  const nameColor = isLight ? "#241123" : "#f2f2f2";
  const nameHover = isLight ? "#6c00af" : "#FFCC00";
  const roleColor = isLight ? "#241123" : "#f2f2f2";
  const roleOpacity = isLight ? 0.72 : 0.6;

  const linkHref = href ?? `/alumni/${slug}`;

  return (
    <Link
      href={linkHref}
      prefetch
      className="block group"
      style={{ textDecoration: "none" }}
      aria-label={`${name} profile`}
    >
      <div className="flex flex-col items-start" style={{ width: "144px", ...customStyle }}>
        {/* Headshot */}
        <div
          className="relative w-full transition-all duration-300 group-hover:scale-[1.11] group-hover:brightness-105"
          style={{
            aspectRatio: "4 / 5",
            overflow: "hidden",
            boxShadow: "2px 3px 4px rgba(36,17,35,0.5)",
            transformOrigin: "center center",
            borderRadius: 0,
            outline: highlightFrame ? "3px solid rgba(255, 204, 0, 0.95)" : undefined,
            outlineOffset: highlightFrame ? "6px" : undefined,
          }}
        >
          {badgeLabel ? (
            <span
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                zIndex: 2,
                padding: "6px 8px",
                fontSize: 11,
                letterSpacing: "0.12em",
                fontWeight: 700,
                textTransform: "uppercase",
                background: "rgba(36,17,35,0.92)",
                color: "#FFCC00",
              }}
            >
              {badgeLabel}
            </span>
          ) : null}

          <Image
            key={imgSrc} // ✅ force remount when src changes
            src={imgSrc}
            alt={`${name}${role ? ` — ${role}` : ""}`}
            onError={handleError}
            fill
            className="object-cover transition-all duration-300"
            sizes="144px"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            draggable={false}
          />
        </div>

        {/* Name */}
        <h3
          className="uppercase leading-snug transition-colors duration-300"
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 600,
            letterSpacing: "0.05rem",
            fontSize: nameFontSize || 16,
            margin: "15px 0 0 0",
            textAlign: "left",
            color: nameColor,
          }}
        >
          <span className="mp-name">{name}</span>
        </h3>

        {/* Role */}
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontWeight: 400,
            opacity: roleOpacity,
            fontSize: roleFontSize || 14,
            margin: 0,
            textAlign: "left",
            color: roleColor,
          }}
        >
          {role}
        </p>
      </div>

      <style>{`
        .group:hover div.relative {
          box-shadow: 0 12px 28px rgba(36,17,35,0.6);
        }
        .group:hover .mp-name {
          color: ${nameHover};
        }
      `}</style>
    </Link>
  );
}
