"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import ShareButton from "@/components/ui/ShareButton";
import ContactOverlay from "@/components/shared/ContactOverlay";
import Lightbox from "@/components/shared/Lightbox";
import StatusFlags from "@/components/alumni/StatusFlags";

import NameStack from "@/components/shared/NameStack";
import { splitTitles, slugifyTitle, bucketsForTitleToken } from "@/lib/titles";
import { getLocationHrefForToken } from "@/lib/locations";

interface MobileProfileHeaderProps {
  alumniId: string;
  name: string;
  role: string;
  location?: string;
  headshotUrl?: string;
  statusFlags?: string[];
  email?: string;
  website?: string;
  socials?: string[];
}

export default function MobileProfileHeader({
  alumniId,
  name,
  role,
  location,
  headshotUrl,
  statusFlags = [],
  email,
  website,
  socials,
}: MobileProfileHeaderProps) {
  const fallbackImage = "/images/default-headshot.png";

  // IMPORTANT:
  // Do NOT show fallback during normal load — only on actual image failure.
  const imageSrc = useMemo(() => {
    const raw = headshotUrl ? headshotUrl.replace(/^http:\/\//i, "https://") : "";
    return raw.trim(); // ✅ may be ""
  }, [headshotUrl]);

  const [targetHeadshotSrc, setTargetHeadshotSrc] = useState<string>("");
  const [shownHeadshotSrc, setShownHeadshotSrc] = useState<string>("");
  const [isHeadshotLoading, setIsHeadshotLoading] = useState<boolean>(true);

  const handleHeadshotError = useCallback(() => {
    setShownHeadshotSrc((prev) => (prev === fallbackImage ? prev : fallbackImage));
    setIsHeadshotLoading(false);
  }, [fallbackImage]);

  // ---------- de-dupe + startIndex helpers ----------
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
      const raw = it?.uploadedAt ?? it?.createdAt ?? it?.updatedAt ?? "";
      const s = String(raw || "").trim();
      if (s) return s;
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

      const current = headshots.filter((x) => {
        const v = x?.isCurrent;
        return v === true || String(v || "").trim().toLowerCase() === "true";
      });
      if (current.length) {
        // If multiple are marked current, pick the most recent among them (deterministic)
        return orderMostRecent(current)[0];
      }

      return orderMostRecent(headshots)[0] || null;
    },
    [orderMostRecent]
  );

  // ✅ Hydrate "current headshot" (isCurrent first, else most recent)
  // ✅ Seed the lightbox cache in deterministic order
  useEffect(() => {
    let cancelled = false;

    async function hydrateHeadshotAndCache() {
      try {
        const qs = new URLSearchParams({ alumniId, kind: "headshot" });
        const r = await fetch(`/api/media/list?${qs.toString()}`, { cache: "no-store" });
        const j = await r.json();
        const rawItems = (j?.items || []) as any[];

        const chosen = pickCurrentOrMostRecent(rawItems);
        const chosenUrl = chosen ? toApiImgUrl(chosen) : "";

        // Fallback to legacy headshotUrl if present
        const legacy = imageSrc ? `/api/img?${new URLSearchParams({ url: imageSrc }).toString()}` : "";

        const finalChosen = chosenUrl || legacy;

        if (!cancelled) {
          if (finalChosen) {
            setTargetHeadshotSrc(finalChosen);
          } else {
            setIsHeadshotLoading(false);
          }
        }

        const ordered = orderMostRecent(rawItems);
        const urls = ordered.map(toApiImgUrl).filter(Boolean);

        const merged = legacy ? [...urls, legacy] : urls;

        if (!cancelled && merged.length) {
          galleryCacheRef.current = uniqueByMediaKey(merged);
        }
      } catch {
        // non-fatal
      }
    }

    if (alumniId) hydrateHeadshotAndCache();

    return () => {
      cancelled = true;
    };
  }, [
    alumniId,
    pickCurrentOrMostRecent,
    orderMostRecent,
    toApiImgUrl,
    imageSrc,
    uniqueByMediaKey,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const src = String(targetHeadshotSrc || "").trim();
    if (!src) return;

    let cancelled = false;
    setIsHeadshotLoading(true);

    const img = new window.Image();
    img.onload = () => {
      if (cancelled) return;
      setShownHeadshotSrc(src);
      setIsHeadshotLoading(false);
    };
    img.onerror = () => {
      if (cancelled) return;
      setShownHeadshotSrc(fallbackImage);
      setIsHeadshotLoading(false);
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [targetHeadshotSrc, fallbackImage]);

  // ---------- lightbox plumbing ----------
  const headerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [lightboxStartIndex, setLightboxStartIndex] = useState(0);
  const [currentUrl, setCurrentUrl] = useState("");

  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const galleryCacheRef = useRef<string[] | null>(null);
  const openingRef = useRef(false);

  async function openHeadshotGallery() {
    const current = String(shownHeadshotSrc || targetHeadshotSrc || "").trim();
    if (!current) return;

    // Seed immediately so Lightbox has something
    setGalleryUrls([current]);
    setLightboxStartIndex(0);
    setModalOpen(true);

    // Use cache immediately (already most-recent-first + de-duped)
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
      const r = await fetch(`/api/media/list?${qs.toString()}`, { cache: "no-store" });
      const j = await r.json();
      const rawItems = (j?.items || []) as any[];

      // ✅ Deterministic ordering for gallery
      const ordered = orderMostRecent(rawItems);
      const urls = ordered.map(toApiImgUrl).filter(Boolean);

      const baseRaw = urls.length ? urls : [current];

      // Include legacy headshotUrl as last resort, but de-dupe against api/img fileId/url matches
      const legacy = imageSrc ? `/api/img?${new URLSearchParams({ url: imageSrc }).toString()}` : "";
      const merged = legacy ? [...baseRaw, legacy] : baseRaw;

      const { urls: next, startIndex } = buildGalleryAndIndex(merged, current);

      if (!next.length) return;

      galleryCacheRef.current = next;
      setGalleryUrls(next);
      setLightboxStartIndex(startIndex);
    } catch {
      const fallback = [current].filter(Boolean);
      galleryCacheRef.current = fallback;
      setGalleryUrls(fallback);
      setLightboxStartIndex(0);
    } finally {
      openingRef.current = false;
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const nameParts = name.trim().split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || nameParts[0];
  const lastName = nameParts.slice(-1).join(" ") || "";

  const hasContactInfo = !!(email || website || (socials && socials.length > 0));

  // Build title links
  const allRoles = splitTitles(role).map((r) => r.trim()).filter(Boolean);

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

  const titleLinks = Array.from(
    new Map(
      allRoles
        .map((label) => {
          const href = hrefForTitleToken(label);
          return href ? [href, { label, href }] : null;
        })
        .filter(Boolean) as Array<[string, { label: string; href: string }]>
    ).values()
  );

  const locationHref = location ? getLocationHrefForToken(location) : null;

  // Lightbox images: de-duped, with a safe fallback
  const lightboxImages = useMemo(() => {
    const raw = (galleryUrls?.length
      ? galleryUrls
      : [String(shownHeadshotSrc || targetHeadshotSrc || "").trim()]
    ).filter(Boolean);

    const uniq = uniqueByMediaKey(raw);
    return uniq.length ? uniq : [fallbackImage].filter(Boolean);
  }, [galleryUrls, shownHeadshotSrc, targetHeadshotSrc, uniqueByMediaKey, fallbackImage]);

  return (
    <div ref={headerRef} style={{ backgroundColor: "#C39B6C", position: "relative" }}>
      {hasContactInfo && (
        <ContactOverlay
          email={email}
          website={website}
          socials={socials}
          profileCardRef={headerRef}
        />
      )}

      {statusFlags.length > 0 && (
        <div
          className="absolute top-1 right-[4rem] z-50"
          style={{ clipPath: "inset(0px -9999px -9999px -9999px)" }}
        >
          <StatusFlags
            flags={statusFlags}
            fontSize="1.15rem"
            fontFamily="var(--font-dm-sans), system-ui, sans-serif"
            textColor="#F6E4C1"
            borderRadius="20px"
            className="gap-1"
            padding="1.6rem 0.5rem 0.5rem"
          />
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          zIndex: 70,
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <div
            role="share-button-wrapper"
            style={{
              padding: "4px",
              minWidth: "44px",
              minHeight: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShareButton url={currentUrl} />
          </div>
        </div>
      </div>

      {/* Headshot */}
      <div
        className="relative cursor-pointer"
        style={{
          aspectRatio: "4 / 5",
          boxShadow: "6px 8px 20px rgba(0,0,0,0.25)",
          backgroundColor: "#241123",
          margin: "0 auto",
          width: "90%",
          maxWidth: "360px",
        }}
        onClick={openHeadshotGallery}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            openHeadshotGallery();
          }
        }}
        aria-label="Open headshot"
      >
        {shownHeadshotSrc ? (
          <Image
            src={shownHeadshotSrc}
            alt={`${name}'s headshot`}
            fill
            priority
            placeholder="empty"
            onError={handleHeadshotError}
            style={{
              objectFit: "cover",
              objectPosition: "top center",
            }}
          />
        ) : (
          <div
            aria-label="Loading headshot"
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#241123",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: isHeadshotLoading ? 1 : 0.9,
            }}
          />
        )}
      </div>

      {/* Name + meta */}
      <div
        style={{
          width: "90%",
          maxWidth: "360px",
          margin: "1.5rem auto 0",
          overflow: "hidden",
        }}
      >
        <NameStack firstName={firstName} lastName={lastName} containerWidth={320} gapRem={0.6} />

        {(allRoles.length > 0 || location) && (
          <div
            className="flex flex-wrap justify-center items-center gap-x-3 mt-2"
            style={{ marginBottom: "2rem", textAlign: "center", wordBreak: "break-word" }}
          >
            {/* Titles */}
            {titleLinks.length > 0 && (
              <span className="flex items-center flex-wrap justify-center">
                {titleLinks.map(({ label, href }, idx) => (
                  <span key={`${href}-${label}`} className="flex items-center">
                    <Link
                      href={href}
                      prefetch
                      className="no-underline hover:no-underline transition-all duration-200 inline-block"
                      style={{
                        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                        fontSize: "clamp(1rem, 4vw, 1.35rem)",
                        color: "#241123",
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        fontWeight: 800,
                        opacity: 0.95,
                        whiteSpace: "nowrap",
                        transformOrigin: "left center",
                        transition: "transform 0.2s ease, color 0.2s ease",
                        cursor: "pointer",
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
                          fontSize: "clamp(1rem, 4vw, 1.35rem)",
                          color: "#241123",
                          opacity: 0.7,
                          margin: "0 0.5rem",
                          fontWeight: 400,
                        }}
                        aria-hidden="true"
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
                  fontSize: "1rem",
                  color: "#241123",
                  padding: "0 10px",
                  opacity: 0.5,
                }}
                aria-hidden="true"
              >
                •
              </span>
            )}

            {/* Location */}
            {location &&
              (locationHref ? (
                <Link
                  href={locationHref}
                  prefetch
                  className="no-underline hover:no-underline transition-all duration-200"
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "clamp(0.8rem, 3vw, 0.95rem)",
                    fontWeight: 900,
                    letterSpacing: "2px",
                    opacity: 0.5,
                    display: "inline-block",
                    cursor: "pointer",
                    transformOrigin: "left center",
                    transition: "transform 0.2s ease, color 0.2s ease, opacity 0.2s ease",
                    color: "#241123",
                  }}
                  aria-label={`View artists based in ${location}`}
                >
                  <span
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
                    style={{ display: "inline-block" }}
                  >
                    Based in {location.toUpperCase()}
                  </span>
                </Link>
              ) : (
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "clamp(0.8rem, 3vw, 0.95rem)",
                    fontWeight: 900,
                    letterSpacing: "2px",
                    opacity: 0.5,
                    display: "inline-block",
                    cursor: "pointer",
                    transformOrigin: "left center",
                    transition: "transform 0.2s ease, color 0.2s ease, opacity 0.2s ease",
                    color: "#241123",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scaleX(1.05)";
                    e.currentTarget.style.color = "#6C00AF";
                    e.currentTarget.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scaleX(1)";
                    e.currentTarget.style.color = "#241123";
                    e.currentTarget.style.opacity = "0.5";
                  }}
                >
                  Based in {location.toUpperCase()}
                </span>
              ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <Lightbox
          images={lightboxImages}
          startIndex={lightboxStartIndex}
          onClose={() => {
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
