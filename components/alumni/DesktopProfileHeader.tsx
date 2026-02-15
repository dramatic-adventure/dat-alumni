"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { getLocationHrefForToken } from "@/lib/locations";
import ScaledName from "@/components/shared/NameStack";
import LocationBadge from "@/components/shared/LocationBadge";
import ShareButton from "@/components/ui/ShareButton";
import Lightbox from "@/components/shared/Lightbox";
import ContactOverlay from "@/components/shared/ContactOverlay";
import StatusFlags from "@/components/alumni/StatusFlags";
import { splitTitles, slugifyTitle, bucketsForTitleToken } from "@/lib/titles";

const DEBUG_MEDIA = false;

interface DesktopProfileHeaderProps {
  alumniId: string;
  name: string;
  role: string;
  roles?: string[];
  location?: string;
  headshotUrl?: string;
  statusFlags?: string[];
  email?: string;
  website?: string;
  socials?: string[];
}

export default function DesktopProfileHeader({
  alumniId,
  name,
  role,
  roles = [],
  location,
  headshotUrl,
  statusFlags = [],
  email,
  website,
  socials,
}: DesktopProfileHeaderProps) {
  const router = useRouter();
  const [isModalOpen, setModalOpen] = useState(false);
  const [lightboxStartIndex, setLightboxStartIndex] = useState(0);
  const [currentUrl, setCurrentUrl] = useState("");

  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const galleryCacheRef = useRef<string[] | null>(null);
  const openingRef = useRef(false);

  const fallbackImage = "/images/default-headshot.png";

  const dbg = useCallback((...args: any[]) => {
    if (!DEBUG_MEDIA) return;
    // eslint-disable-next-line no-console
    console.log(...args);
  }, []);

  // ✅ Lightbox-safe URLs: always absolute.
  const toAbsUrl = useCallback((u: string): string => {
    const s = String(u || "").trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) return s;
    if (typeof window === "undefined") return s;
    try {
      return new URL(s, window.location.origin).toString();
    } catch {
      return s;
    }
  }, []);

  // Normalize media URLs so we can de-dupe and find the "current" item reliably.
  // - Treat /api/img?... as same asset if fileId matches OR url= matches (ignoring v=)
  // - Treat /_next/image?... as same asset if url= matches (ignoring w/q/etc.)
  // - Ignore origin differences (absolute vs relative)
  const mediaKey = useCallback((u: string): string => {
    const s = String(u || "").trim();
    if (!s) return "";

    const tryParse = (): URL | null => {
      try {
        if (typeof window !== "undefined") return new URL(s, window.location.origin);
        if (/^https?:\/\//i.test(s)) return new URL(s);
        return null;
      } catch {
        return null;
      }
    };

    const parsed = tryParse();
    if (!parsed) return s;

    const path = parsed.pathname;

    if (path === "/api/img") {
      const fileId = parsed.searchParams.get("fileId");
      if (fileId) return `apiimg:fileId:${fileId}`;

      const url = parsed.searchParams.get("url") || "";
      const normUrl = url.trim().replace(/^http:\/\//i, "https://");
      if (normUrl) return `apiimg:url:${normUrl}`;

      return "apiimg:unknown";
    }

    if (path === "/_next/image") {
      const inner = parsed.searchParams.get("url") || "";
      const normInner = inner.trim().replace(/^http:\/\//i, "https://");
      if (normInner) return `nextimg:url:${normInner}`;
      return "nextimg:unknown";
    }

    const originless = `${path}${parsed.search ? parsed.search : ""}${parsed.hash || ""}`;
    return originless;
  }, []);

  const uniqueByMediaKey = useCallback(
    (urls: string[]) => {
      const seen = new Set<string>();
      const out: string[] = [];
      for (const u of urls) {
        const s = String(u || "").trim();
        if (!s) continue;
        const k = mediaKey(s);
        if (!k) continue;
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(s);
      }
      return out;
    },
    [mediaKey]
  );

  const buildGalleryAndIndex = useCallback(
    (urls: string[], preferredUrl: string) => {
      const uniq = uniqueByMediaKey(urls);
      const prefKey = mediaKey(preferredUrl);
      const idx = prefKey ? uniq.findIndex((u) => mediaKey(u) === prefKey) : -1;
      return { urls: uniq, startIndex: idx >= 0 ? idx : 0 };
    },
    [mediaKey, uniqueByMediaKey]
  );

  const isTrueFlag = useCallback((v: any): boolean => {
    if (v === true) return true;
    const s = String(v ?? "").trim().toLowerCase();
    return s === "true" || s === "t" || s === "1" || s === "yes" || s === "y";
  }, []);

  const imageSrc = useMemo(() => {
    const raw = headshotUrl ? headshotUrl.replace(/^http:\/\//i, "https://") : "";
    return raw.trim();
  }, [headshotUrl]);

  const nameParts = name.trim().split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || nameParts[0];
  const lastName = nameParts.slice(-1).join(" ") || "";

  const [targetHeadshotSrc, setTargetHeadshotSrc] = useState<string>("");
  const [shownHeadshotSrc, setShownHeadshotSrc] = useState<string>(fallbackImage);
  const [isSwapping, setIsSwapping] = useState(false);

  const handleHeadshotError = useCallback(() => {
    setShownHeadshotSrc(fallbackImage);
  }, [fallbackImage]);

  // ---------- helpers ----------
  const toTime = useCallback((it: any): number => {
    const raw =
      it?.uploadedAt ??
      it?.createdAt ??
      it?.updatedAt ??
      it?.ts ??
      it?.timestamp ??
      "";
    const n = typeof raw === "number" ? raw : Date.parse(String(raw));
    return Number.isFinite(n) ? n : 0;
  }, []);

  const toCacheKey = useCallback(
    (it: any): string => {
      const t = toTime(it);
      return t ? String(t) : "";
    },
    [toTime]
  );

  const toApiImgUrl = useCallback(
    (it: any): string => {
      const fid = String(it?.fileId || "").trim();
      const ext = String(it?.externalUrl || "").trim();
      const v = toCacheKey(it);

      if (fid) {
        const qs = new URLSearchParams();
        qs.set("fileId", fid);
        if (v) qs.set("v", v);
        return `/api/img?${qs.toString()}`;
      }

      if (ext) {
        const qs = new URLSearchParams();
        qs.set("url", ext);
        if (v) qs.set("v", v);
        return `/api/img?${qs.toString()}`;
      }

      return "";
    },
    [toCacheKey]
  );

  const toProxyUrl = useCallback((raw: string): string => {
    const u = String(raw || "").trim();
    if (!u) return "";
    const qs = new URLSearchParams();
    qs.set("url", u.replace(/^http:\/\//i, "https://"));
    return `/api/img?${qs.toString()}`;
  }, []);

  const orderMostRecent = useCallback(
    (items: any[]) =>
      [...items].sort((a, b) => {
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
      }),
    [toTime]
  );

  const pickCurrentOrMostRecent = useCallback(
    (items: any[]) => {
      const headshots = (items || []).filter(
        (x) => String(x?.kind || "headshot") === "headshot"
      );

      const current = headshots.filter((x) => isTrueFlag(x?.isCurrent));

      if (current.length) return orderMostRecent(current)[0];
      return orderMostRecent(headshots)[0] || null;
    },
    [orderMostRecent, isTrueFlag]
  );

  // ---------- hydrate headshots + seed lightbox cache ----------
  useEffect(() => {
    let cancelled = false;

    async function hydrateHeadshots() {
      try {
        const qs = new URLSearchParams({ alumniId, kind: "headshot" });
        const r = await fetch(`/api/alumni/media/list?${qs.toString()}`);
        const j = await r.json();
        const rawItems = (j?.items || []) as any[];

        const chosen = pickCurrentOrMostRecent(rawItems);
        const chosenUrl = chosen ? toApiImgUrl(chosen) : "";

        const fallbackUrl = imageSrc ? toProxyUrl(imageSrc) : "";
        const finalChosenUrl = chosenUrl || fallbackUrl;

        if (!cancelled && finalChosenUrl) {
          setTargetHeadshotSrc(finalChosenUrl);
        }

        const ordered = orderMostRecent(rawItems);
        const urls = ordered.map(toApiImgUrl).filter(Boolean);

        const legacy = imageSrc ? toProxyUrl(imageSrc) : "";
        const merged = legacy ? [...urls, legacy] : urls;

        if (!cancelled && merged.length) {
          galleryCacheRef.current = uniqueByMediaKey(merged);
        }
      } catch (e) {
        dbg("hydrateHeadshots failed:", e);
      }
    }

    if (alumniId) hydrateHeadshots();

    return () => {
      cancelled = true;
    };
  }, [
    alumniId,
    dbg,
    imageSrc,
    orderMostRecent,
    pickCurrentOrMostRecent,
    toApiImgUrl,
    toProxyUrl,
    uniqueByMediaKey,
  ]);

  // ---------- preload + swap ----------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const src = String(targetHeadshotSrc || "").trim();
    if (!src) return;

    let cancelled = false;
    setIsSwapping(true);

    const img = new window.Image();
    img.onload = () => {
      if (cancelled) return;
      setShownHeadshotSrc(src);
      setIsSwapping(false);
    };
    img.onerror = () => {
      if (cancelled) return;
      setShownHeadshotSrc(fallbackImage);
      setIsSwapping(false);
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [targetHeadshotSrc, fallbackImage]);

  async function openHeadshotGallery() {
    const current = (shownHeadshotSrc || targetHeadshotSrc || fallbackImage || "").trim();
    if (!current) return;

    // Seed immediately so Lightbox has something
    setGalleryUrls([current]);
    setLightboxStartIndex(0);
    setModalOpen(true);

    // Use cache immediately
    if (galleryCacheRef.current && galleryCacheRef.current.length > 0) {
      const { urls: nextUrls, startIndex } = buildGalleryAndIndex(
        galleryCacheRef.current.filter(Boolean),
        current
      );
      setGalleryUrls(nextUrls);
      setLightboxStartIndex(startIndex);
      return;
    }

    if (openingRef.current) return;
    openingRef.current = true;

    try {
      const qs = new URLSearchParams({ alumniId, kind: "headshot" });
      const r = await fetch(`/api/alumni/media/list?${qs.toString()}`);
      const j = await r.json();
      const rawItems = (j?.items || []) as any[];

      const ordered = orderMostRecent(rawItems);
      const urls = ordered.map(toApiImgUrl).filter(Boolean);

      const legacy = imageSrc ? toProxyUrl(imageSrc) : "";
      const base = urls.length ? urls : current ? [current] : legacy ? [legacy] : [];
      const nextRaw = base.filter(Boolean);
      const { urls: next, startIndex } = buildGalleryAndIndex(nextRaw, current);

      if (!next.length) return;

      galleryCacheRef.current = next;
      dbg("[Lightbox URLs]", alumniId, next);
      setGalleryUrls(next);
      setLightboxStartIndex(startIndex);
    } catch (e) {
      dbg("openHeadshotGallery failed:", e);
      const next = [current].filter(Boolean);
      galleryCacheRef.current = next;
      setGalleryUrls(next);
      setLightboxStartIndex(0);
    } finally {
      openingRef.current = false;
    }
  }

  const profileCardRef = useRef<HTMLDivElement>(null);
  const hasContactInfo = !!(email || website || (socials && socials.length > 0));

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const allRoles = (roles && roles.length > 0 ? roles : splitTitles(role))
    .map((r) => r.trim())
    .filter(Boolean);

  function hrefForTitleToken(token: string): string | null {
    const keys = bucketsForTitleToken(token);
    if (!keys.length) return null;

    const preference = [
      "playwrights",
      "travel-writers",
      "designers",
      "stage-managers",
      "teaching-artists",
      "special-event-hosts",
      "managers-community-partnerships",
      "partners",
      "executive-directors",
    ];

    const asStrings = keys.map(String);
    let chosen = asStrings.find((k) => preference.includes(k));
    if (!chosen) chosen = asStrings.find((k) => k.startsWith("title:"));
    if (!chosen) chosen = asStrings[0];

    const slug = chosen.startsWith("title:")
      ? slugifyTitle(chosen.slice("title:".length))
      : chosen;

    return `/title/${slug}`;
  }

  const titleLinks = useMemo(
    () =>
      Array.from(
        new Map(
          allRoles
            .map((label) => {
              const href = hrefForTitleToken(label);
              return href ? [href, { label, href }] : null;
            })
            .filter(Boolean) as Array<[string, { label: string; href: string }]>
        ).values()
      ),
    [allRoles]
  );

  const locationHref = location ? getLocationHrefForToken(location) : null;

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      titleLinks.forEach(({ href }) => router.prefetch(href));
      if (locationHref) router.prefetch(locationHref);
      return;
    }
    const el = profileCardRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            titleLinks.forEach(({ href }) => router.prefetch(href));
            if (locationHref) router.prefetch(locationHref);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [titleLinks, locationHref, router]);

  const lightboxImages = useMemo(() => {
    const raw = (
      galleryUrls?.length
        ? galleryUrls
        : [(shownHeadshotSrc || targetHeadshotSrc || fallbackImage).trim()]
    )
      .filter(Boolean)
      .map(toAbsUrl)
      .filter(Boolean);

    const uniq = uniqueByMediaKey(raw);
    return uniq.length ? uniq : [toAbsUrl(fallbackImage)].filter(Boolean);
  }, [
    galleryUrls,
    shownHeadshotSrc,
    targetHeadshotSrc,
    fallbackImage,
    toAbsUrl,
    uniqueByMediaKey,
  ]);

  return (
    <div ref={profileCardRef} style={{ position: "relative" }}>
      {hasContactInfo && (
        <ContactOverlay
          email={email}
          website={website}
          socials={socials}
          profileCardRef={profileCardRef}
        />
      )}

      {statusFlags?.length > 0 && (
        <div
          className="absolute z-40 flex items-center gap-2"
          style={{
            top: "0rem",
            right: "4.5rem",
            position: "absolute",
            clipPath: "inset(0px -9999px -9999px -9999px)",
          }}
        >
          <StatusFlags
            flags={statusFlags}
            fontSize="1.75rem"
            fontFamily="var(--font-dm-sans), system-ui, sans-serif"
            textColor="#F6E4C1"
            borderRadius="33px"
          />
        </div>
      )}

      <div className="absolute z-40" style={{ top: "1rem", right: "1rem" }}>
        <ShareButton url={currentUrl} />
      </div>

      {/* Headshot */}
      <div
        className="absolute top-0 left-[1.5rem] sm:left-4 z-40 w-[360px] h-[450px] overflow-hidden shadow-[6px_8px_20px_rgba(0,0,0,0.25)] cursor-pointer"
        onClick={() => {
          if (galleryCacheRef.current?.length) openHeadshotGallery();
          else if (shownHeadshotSrc) openHeadshotGallery();
        }}
        role="button"
        tabIndex={0}
        aria-label="Open headshot"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            if (galleryCacheRef.current?.length || shownHeadshotSrc) openHeadshotGallery();
          }
        }}
      >
        <Image
          src={shownHeadshotSrc || fallbackImage}
          alt={`${name}'s headshot`}
          fill
          priority
          placeholder="empty"
          onError={handleHeadshotError}
          style={{ objectFit: "cover", objectPosition: "top center" }}
        />
      </div>

      {/* Name + meta */}
      <div
        style={{
          backgroundColor: "#C39B6C",
          color: "#F6E4C1",
          textAlign: "left",
          paddingLeft: "415px",
          paddingTop: "2rem",
          paddingBottom: "2rem",
        }}
      >
        <ScaledName
          firstName={firstName}
          lastName={lastName}
          containerWidth={360}
          gapRem={0.6}
        />

        {(titleLinks.length > 0 || location) && (
          <div
            className="flex flex-row items-center flex-wrap gap-y-2"
            style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}
          >
            {titleLinks.length > 0 && (
              <span className="flex items-center flex-wrap">
                {titleLinks.map(({ label, href }, idx) => (
                  <span key={`${href}-${label}`} className="flex items-center">
                    <Link
                      href={href}
                      prefetch
                      className="no-underline hover:no-underline transition-all duration-200 inline-block"
                      style={{
                        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                        fontSize: "1.7rem",
                        color: "#241123",
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        fontWeight: 700,
                        opacity: 0.9,
                        transformOrigin: "left",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scaleX(1.05)";
                        e.currentTarget.style.color = "#6C00AF";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scaleX(1)";
                        e.currentTarget.style.color = "#241123";
                      }}
                      aria-label={`View ${label}`}
                    >
                      {label}
                    </Link>
                    {idx < titleLinks.length - 1 && (
                      <span
                        style={{
                          fontSize: "1.7rem",
                          color: "#241123",
                          opacity: 0.7,
                          margin: "0 0.6rem",
                          fontWeight: 400,
                        }}
                      >
                        –
                      </span>
                    )}
                  </span>
                ))}
              </span>
            )}

            {titleLinks.length > 0 && location && (
              <span
                style={{
                  fontSize: "1.2rem",
                  color: "#241123",
                  padding: "0 14px",
                  opacity: 0.5,
                }}
                aria-hidden="true"
              >
                •
              </span>
            )}

            {location && (
              <>
                {locationHref ? (
                  <Link
                    href={locationHref}
                    prefetch
                    className="no-underline hover:no-underline transition-all duration-200"
                    style={{
                      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                      fontSize: "1.2rem",
                      color: "#241123",
                      fontWeight: 900,
                      letterSpacing: "2px",
                      opacity: 0.5,
                      display: "inline-block",
                      paddingRight: "2rem",
                    }}
                    aria-label={`View artists based in ${location}`}
                  >
                    <span
                      className="inline-block transition-transform duration-200"
                      style={{ transformOrigin: "left" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scaleX(1.05)";
                        (e.currentTarget.parentElement as HTMLElement).style.color = "#6C00AF";
                        (e.currentTarget.parentElement as HTMLElement).style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scaleX(1)";
                        (e.currentTarget.parentElement as HTMLElement).style.color = "#241123";
                        (e.currentTarget.parentElement as HTMLElement).style.opacity = "0.5";
                      }}
                    >
                      Based in <span style={{ textTransform: "uppercase" }}>{location}</span>
                    </span>
                  </Link>
                ) : (
                  <span
                    className="no-underline hover:no-underline transition-all duration-200"
                    style={{
                      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                      fontSize: "1.2rem",
                      color: "#241123",
                      fontWeight: 900,
                      letterSpacing: "2px",
                      opacity: 0.5,
                      display: "inline-block",
                      paddingRight: "2rem",
                    }}
                  >
                    <span
                      className="inline-block transition-transform duration-200"
                      style={{ transformOrigin: "left" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scaleX(1.05)";
                        (e.currentTarget.parentElement as HTMLElement).style.color = "#6C00AF";
                        (e.currentTarget.parentElement as HTMLElement).style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scaleX(1)";
                        (e.currentTarget.parentElement as HTMLElement).style.color = "#241123";
                        (e.currentTarget.parentElement as HTMLElement).style.opacity = "0.5";
                      }}
                    >
                      Based in <span style={{ textTransform: "uppercase" }}>{location}</span>
                    </span>
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <Lightbox
          images={lightboxImages}
          startIndex={lightboxStartIndex}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
