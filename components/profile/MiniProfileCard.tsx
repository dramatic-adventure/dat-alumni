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

  /**
   * ✅ If provided, MiniProfileCard can self-hydrate
   * the selected/current headshot from /api/alumni/media/list
   * (useful on pages that don't mount HeadshotProvider).
   */
  alumniId?: string;

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

  const ck =
    cacheKey === undefined || cacheKey === null ? "" : String(cacheKey).trim();
  if (!ck) return raw;

  try {
    // Only touch our proxy URLs
    if (!raw.startsWith("/api/img?") && !raw.startsWith("/api/media/thumb?")) return raw;

    const u = new URL(raw, "http://local"); // base required for relative URLs
    u.searchParams.set("v", ck);
    return u.pathname + "?" + u.searchParams.toString();
  } catch {
    return raw;
  }
}

/**
 * If /api/img is in "redirect fallback" mode (302), Next/Image can behave inconsistently.
 * So we HEAD with redirect:manual and if we see Location, we bypass the proxy and use that src directly.
 */
async function resolveImgProxyRedirect(src: string): Promise<string> {
  const raw = String(src || "").trim();
  if (!raw.startsWith("/api/img?")) return raw;

  try {
    const res = await fetch(raw, {
      method: "HEAD",
      cache: "no-store",
      redirect: "manual",
    });

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (loc) return loc;
    }

    return raw;
  } catch {
    return raw;
  }
}

// ---- mini hydrator (for pages without HeadshotProvider) ----
function isTrueFlag(v: any): boolean {
  if (v === true) return true;
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "t" || s === "1" || s === "yes" || s === "y";
}

function toTime(it: any): number {
  const raw =
    it?.uploadedAt ??
    it?.createdAt ??
    it?.updatedAt ??
    it?.ts ??
    it?.timestamp ??
    "";
  const n = typeof raw === "number" ? raw : Date.parse(String(raw));
  return Number.isFinite(n) ? n : 0;
}

function toCacheKey(it: any): string {
  const t = toTime(it);
  return t ? String(t) : "";
}

function toApiImgUrl(it: any): string {
  const fid = String(it?.fileId || "").trim();
  const ext = String(it?.externalUrl || "").trim();

  // Small + fast for minis
  if (fid) {
    return `/api/media/thumb?fileId=${encodeURIComponent(fid)}&w=480`;
  }

  // If it's an external URL, just use it directly (it must be allowed in next.config remotePatterns)
  if (ext) return ext;

  return "";
}

function orderMostRecent(items: any[]) {
  return [...(items || [])].sort((a, b) => {
    const ta = toTime(a);
    const tb = toTime(b);
    if (tb !== ta) return tb - ta;

    const sa = Number.isFinite(Number(a?.sortIndex))
      ? Number(a.sortIndex)
      : Number.POSITIVE_INFINITY;
    const sb = Number.isFinite(Number(b?.sortIndex))
      ? Number(b.sortIndex)
      : Number.POSITIVE_INFINITY;
    if (sa !== sb) return sa - sb;

    return String(b?.fileId || b?.externalUrl || "").localeCompare(
      String(a?.fileId || a?.externalUrl || "")
    );
  });
}

function pickCurrentOrMostRecent(items: any[]) {
  const headshots = (items || []).filter((x) => {
    const k = String(x?.kind || "headshot").trim().toLowerCase();
    return k === "headshot";
  });

  const current = headshots.filter((x) => isTrueFlag(x?.isCurrent));
  if (current.length) return orderMostRecent(current)[0];

  return orderMostRecent(headshots)[0] || null;
}

export default function MiniProfileCard({
  name,
  role,
  slug,
  headshotUrl,
  alumniId,

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
  // ✅ Your real fallback (public/images/default-headshot.png)
  const defaultImage = "/images/default-headshot.png";

  const hs = useHeadshot(slug);

  // ✅ Local override when HeadshotProvider isn't available on this route
  const [hydratedHeadshotUrl, setHydratedHeadshotUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

  async function hydrate() {
    const id = String(alumniId || "").trim();
    if (!id) return;

    // ✅ If provider already has it, or we were given a headshotUrl prop,
    // do NOT do per-card network calls (directory must be instant).
    const hasProvider = !!String(hs?.url || "").trim();
    const hasProp = !!String(headshotUrl || "").trim();
    if (hasProvider || hasProp) return;

    try {
      const qs = new URLSearchParams({ alumniId: id, kind: "headshot" });
      const r = await fetch(`/api/alumni/media/list?${qs.toString()}`, {
        cache: "no-store",
      });
      const j = await r.json();
      const rawItems = (j?.items || []) as any[];

      const chosen = pickCurrentOrMostRecent(rawItems);
      const chosenUrl = chosen ? toApiImgUrl(chosen) : "";

      if (!cancelled && chosenUrl) setHydratedHeadshotUrl(chosenUrl);
    } catch {
      // non-fatal
    }
  }

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [alumniId, hs?.url, headshotUrl]);

  const baseSrc = useMemo(() => {
    // 1) ✅ Provider (authoritative when mounted)
    const ctx = String(hs?.url || "").trim();
    if (ctx) return ctx;

    // 2) ✅ Local hydrator (for routes without provider)
    const hyd = String(hydratedHeadshotUrl || "").trim();
    if (hyd) return hyd;

    // 3) Prop fallback (legacy)
    const prop = String(headshotUrl ?? "").trim().replace(/\s+/g, "");
    if (prop) return prop;

    return defaultImage;
  }, [hs?.url, hydratedHeadshotUrl, headshotUrl, defaultImage]);

  const effectiveCacheKey = cacheKey ?? hs?.cacheKey;

  const srcWithBust = useMemo(() => {
    if (!baseSrc || baseSrc === defaultImage) return defaultImage;
    return addCacheBust(baseSrc, effectiveCacheKey);
  }, [baseSrc, defaultImage, effectiveCacheKey]);

// ✅ Instant render: show the real src immediately.
// If it fails, fall back once.
const [imgSrc, setImgSrc] = useState<string>(srcWithBust || defaultImage);

useEffect(() => {
  setImgSrc(srcWithBust || defaultImage);
}, [srcWithBust, defaultImage]);

const handleError = useCallback(() => {
  setImgSrc(defaultImage);
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
      <div
        className="flex flex-col items-start"
        style={{ width: "144px", ...customStyle }}
      >
        {/* Headshot */}
        <div
          className="relative w-full transition-all duration-300 group-hover:scale-[1.11] group-hover:brightness-105"
          style={{
            aspectRatio: "4 / 5",
            overflow: "hidden",
            boxShadow: "2px 3px 4px rgba(36,17,35,0.5)",
            transformOrigin: "center center",
            borderRadius: 0,
            outline: highlightFrame
              ? "3px solid rgba(255, 204, 0, 0.95)"
              : undefined,
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
            key={imgSrc} // remount only when src changes
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
