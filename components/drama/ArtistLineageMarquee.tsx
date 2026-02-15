"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MiniProfileCard from "@/components/profile/MiniProfileCard";

export type LineageArtist = {
  name: string;
  slug?: string;
  headshotUrl?: string;
  avatarSrc?: string;
  href?: string;
  role?: string;
  roles?: string[];
  isLocalMaster?: boolean;

  // ✅ Optional: allow passing canonical id explicitly (best if you have it)
  alumniId?: string;
  headshotCacheKey?: string | number;
};

type Props = {
  title?: string;
  subtitle?: string;
  artists: LineageArtist[];
  pinLocalMastersCount?: number; // default: 2
  showHeader?: boolean; // default: true
};

function clean(s?: string | null) {
  const t = String(s ?? "").trim();
  return t ? t : "";
}

function normSlugKey(s: string) {
  return clean(s).toLowerCase();
}

function slugFromAlumniHref(href?: string) {
  const h = clean(href);
  if (!h) return "";
  const m = h.match(/\/alumni\/([^/?#]+)/i);
  return m?.[1] ? decodeURIComponent(m[1]) : "";
}

function fallbackKeyFromName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isLikelyRealAlumniSlug(slug: string) {
  const s = clean(slug);
  if (!s) return false;
  if (s.length < 3) return false;
  if (/\s/.test(s)) return false;
  if (!/^[a-z0-9-]+$/i.test(s)) return false;
  return s.includes("-");
}

export default function ArtistLineageMarquee({
  title = "VISITING ARTISTS",
  subtitle = "A living lineage of artists who’ve made work with this club.",
  artists,
  pinLocalMastersCount = 2,
  showHeader = true,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const interactTimeoutRef = useRef<number | null>(null);

  const markInteracting = useCallback(() => {
    setIsUserInteracting(true);

    if (interactTimeoutRef.current != null) {
      window.clearTimeout(interactTimeoutRef.current);
    }

    interactTimeoutRef.current = window.setTimeout(() => {
      setIsUserInteracting(false);
    }, 900);
  }, []);

  useEffect(() => {
    return () => {
      if (interactTimeoutRef.current != null) {
        window.clearTimeout(interactTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(!!mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  const ordered = useMemo(() => {
    const localMasters = (artists || []).filter((a) => a?.name && a.isLocalMaster);
    const others = (artists || []).filter((a) => a?.name && !a.isLocalMaster);

    const pinned = localMasters.slice(0, Math.max(0, pinLocalMastersCount));
    const remainderLocal = localMasters.slice(Math.max(0, pinLocalMastersCount));

    return [...pinned, ...remainderLocal, ...others];
  }, [artists, pinLocalMastersCount]);

  const looped = useMemo(() => {
    if (!ordered.length) return [];
    if (ordered.length < 2) return ordered;
    return [...ordered, ...ordered];
  }, [ordered]);

  const paused = reduceMotion || isHovered || isUserInteracting || ordered.length < 2;

  // ✅ DEV-SAFE: keep paused in a ref so the RAF loop doesn't restart constantly
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // ✅ Slow, smooth autoscroll (dev-safe + waits until scrollable)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    if (reduceMotion) return;
    if (ordered.length < 2) return;

    let rafId: number | null = null;
    let last = performance.now();
    const PX_PER_SEC = 18;

    const isScrollable = () => el.scrollWidth - el.clientWidth > 8;

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      if (!pausedRef.current && isScrollable()) {
        el.scrollLeft += PX_PER_SEC * dt;

        const halfway = el.scrollWidth / 2;
        if (halfway > 0 && el.scrollLeft >= halfway) {
          el.scrollLeft -= halfway;
        }
      } else {
        // prevent catch-up jump
        last = now;
      }

      rafId = requestAnimationFrame(tick);
    };

    // Wait until content/layout makes it scrollable (images/fonts can delay this in dev)
    const waitUntilScrollable = () => {
      if (isScrollable()) {
        last = performance.now();
        rafId = requestAnimationFrame(tick);
        return;
      }
      rafId = requestAnimationFrame(waitUntilScrollable);
    };

    rafId = requestAnimationFrame(waitUntilScrollable);

    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [reduceMotion, ordered.length]);

  const nudge = useCallback(
    (dir: -1 | 1) => {
      const el = scrollerRef.current;
      if (!el) return;

      markInteracting();

      const amount = Math.max(260, Math.round(el.clientWidth * 0.8));
      el.scrollTo({ left: el.scrollLeft + dir * amount, behavior: "smooth" });
    },
    [markInteracting]
  );

  if (!artists || artists.length === 0) return null;

  return (
    <section className="dc-lineage dc-lineage--artist-pathways" aria-label="Artist lineage">
      {showHeader && (
        <div className="dc-lineage-head">
          <p className="dc-mini-label font-sans dc-lineage-eyebrow">{title}</p>
          {subtitle ? <p className="dc-lineage-subtitle font-sans">{subtitle}</p> : null}
        </div>
      )}

      <div
        className="dc-lineage-viewport dc-lineage-viewport--bleed"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPointerDown={markInteracting}
        onTouchStart={markInteracting}
        onWheel={markInteracting}
      >
        {ordered.length > 1 && (
          <>
            <button
              type="button"
              className="dc-lineage-arrow dc-lineage-arrow--left"
              aria-label="Scroll left"
              // ✅ critical for dev: don't let parent pointerdown rerender cancel the click
              onPointerDown={(e) => {
                e.stopPropagation();
                markInteracting();
              }}
              onClick={(e) => {
                e.stopPropagation();
                nudge(-1);
              }}
            >
              ‹
            </button>

            <button
              type="button"
              className="dc-lineage-arrow dc-lineage-arrow--right"
              aria-label="Scroll right"
              onPointerDown={(e) => {
                e.stopPropagation();
                markInteracting();
              }}
              onClick={(e) => {
                e.stopPropagation();
                nudge(1);
              }}
            >
              ›
            </button>
          </>
        )}

        <div
          ref={scrollerRef}
          className="dc-lineage-scroller"
          onPointerDown={markInteracting}
          onTouchStart={markInteracting}
          onWheel={markInteracting}
        >
          <div className="dc-lineage-track" aria-hidden="true">
            {looped.map((a, idx) => {
              const hrefSlug = slugFromAlumniHref(a.href);
              const rawSlug = clean(a.slug) || hrefSlug;

              const fallback = fallbackKeyFromName(a.name) || `artist-${idx}`;
              const stableKey = rawSlug || fallback;

              // ✅ Always pass something safe. Never pass empty string.
              const headshot =
                clean(a.headshotUrl) ||
                clean(a.avatarSrc) ||
                "/images/default-headshot.png";

              const role =
                clean(a.role) ||
                (a.roles?.length ? a.roles.filter(Boolean).join(", ") : "") ||
                "";

              const hasRealSlug = !!hrefSlug || isLikelyRealAlumniSlug(rawSlug);

              const computedHref =
                clean(a.href) ||
                (hasRealSlug && rawSlug ? `/alumni/${encodeURIComponent(rawSlug)}` : undefined);

              // ✅ Prefer explicit alumniId, else use canonical-ish slug key
              const alumniId = clean(a.alumniId) || normSlugKey(rawSlug) || undefined;

              return (
                <div key={`${stableKey}-${idx}`} className="dc-lineage-item">
                  <MiniProfileCard
                    alumniId={alumniId}
                    name={a.name}
                    role={role}
                    slug={rawSlug || fallback}
                    headshotUrl={headshot}
                    cacheKey={a.headshotCacheKey}
                    href={computedHref}
                    variant="light"
                    badgeLabel={a.isLocalMaster ? "LOCAL MASTER" : undefined}
                    highlightFrame={!!a.isLocalMaster}
                    nameFontSize={14}
                    roleFontSize={12}
                    customStyle={{ width: 132 }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
