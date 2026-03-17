"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { getLocationHrefForToken, normalizeLocation } from "@/lib/locations";
import ScaledName from "@/components/shared/NameStack";
import ShareButton from "@/components/ui/ShareButton";
import Lightbox from "@/components/shared/Lightbox";
import ContactOverlay from "@/components/shared/ContactOverlay";
import StatusFlags from "@/components/alumni/StatusFlags";
import { splitTitles, slugifyTitle, bucketsForTitleToken } from "@/lib/titles";

interface DesktopProfileHeaderProps {
  alumniId: string;
  slug?: string;
  name: string;
  role: string;
  roles?: string[];
  location?: string;
  headshotUrl?: string;
  statusFlags?: string[];
  publicEmail?: string;
  website?: string;
  socials?: string[];
  currentTitle?: string;
  secondLocation?: string;
  isBiCoastal?: boolean;
}

export default function DesktopProfileHeader({
  alumniId,
  slug,
  name,
  role,
  roles = [],
  location,
  headshotUrl,
  statusFlags = [],
  publicEmail,
  website,
  socials,
  currentTitle,
  secondLocation,
  isBiCoastal,
}: DesktopProfileHeaderProps) {

  const router = useRouter();
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [currentHeadshotIndex, setCurrentHeadshotIndex] = useState(0);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const fallbackImage = "/images/default-headshot.png";

  const [imageSrc, setImageSrc] = useState(
    () => headshotUrl ? headshotUrl.replace(/^http:\/\//i, "https://") : fallbackImage
  );

  useEffect(() => {
    let alive = true;

    const toUrl = (it: any): string => {
      const fid = String(it?.fileId || "").trim();
      if (fid) return `/api/img?fileId=${encodeURIComponent(fid)}`;
      const ext = String(it?.externalUrl || "").trim();
      if (ext) return `/api/img?url=${encodeURIComponent(ext)}`;
      return "";
    };

    const toTime = (it: any): number => {
      const raw = it?.uploadedAt ?? it?.createdAt ?? it?.updatedAt ?? it?.ts ?? it?.timestamp ?? "";
      const n = typeof raw === "number" ? raw : Date.parse(String(raw));
      return Number.isFinite(n) ? n : 0;
    };

    async function run() {
      fetchAbortRef.current?.abort();
      const controller = new AbortController();
      fetchAbortRef.current = controller;

      try {
        const qs = new URLSearchParams({ alumniId, kind: "headshot" });
        const r = await fetch(`/api/alumni/media/list?${qs}`, { signal: controller.signal });
        const j = await r.json();
        const rawItems = (j?.items || []) as any[];

        const ordered = [...rawItems].sort((a, b) => {
          const td = toTime(b) - toTime(a);
          if (td !== 0) return td;
          const sa = Number.isFinite(Number(a?.sortIndex)) ? Number(a.sortIndex) : Infinity;
          const sb = Number.isFinite(Number(b?.sortIndex)) ? Number(b.sortIndex) : Infinity;
          return sa - sb;
        });

        const unique = Array.from(new Set(ordered.map(toUrl).filter(Boolean)));
        if (!alive || controller.signal.aborted) return;

        const currentItem = rawItems.find((it: any) => it?.isCurrent === true);
        const currentUrl = currentItem ? toUrl(currentItem) : null;
        if (currentUrl) setImageSrc(currentUrl);

        if (unique.length) {
          setGalleryUrls(unique);
          const idx = currentUrl ? unique.indexOf(currentUrl) : -1;
          setCurrentHeadshotIndex(idx >= 0 ? idx : 0);
          unique.forEach(url => { try { new window.Image().src = url; } catch {} });
        }
      } catch {
        // AbortError on unmount, or network error — ignore silently.
      }
    }

    run();

    const onVisible = () => { if (document.visibilityState === "visible") run(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      fetchAbortRef.current?.abort();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [alumniId]);

  const nameParts = name.trim().split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || nameParts[0];
  const lastName = nameParts.slice(-1).join(" ") || "";

  function openHeadshotGallery() {
    if (!galleryUrls.length) {
      const current = imageSrc.trim();
      if (current) setGalleryUrls([current]);
    }
    setModalOpen(true);
  }

  const profileCardRef = useRef<HTMLDivElement>(null);
  const hasContactInfo = !!(publicEmail || website || (socials && socials.length > 0));

  useEffect(() => {
    if (typeof window !== "undefined") setCurrentUrl(window.location.href);
  }, []);

  const allRoles = (roles && roles.length > 0 ? roles : splitTitles(role))
    .map((r) => r.trim())
    .filter(Boolean);

  function hrefForTitleToken(token: string): string | null {
    const keys = bucketsForTitleToken(token);
    if (!keys.length) return null;

    const preference = [
      "playwrights", "travel-writers", "designers", "stage-managers",
      "teaching-artists", "special-event-hosts", "managers-community-partnerships",
      "partners", "executive-directors",
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

  // currentTitle can also be linked if it maps to a title bucket
  const currentTitleHref = currentTitle ? hrefForTitleToken(currentTitle) : null;

  const locationHref = location ? getLocationHrefForToken(location) : null;
  const secondLocationHref = secondLocation ? getLocationHrefForToken(secondLocation) : null;
  const displayLocation = location ? (normalizeLocation(location) ?? location) : null;
  const displaySecondLocation = secondLocation ? (normalizeLocation(secondLocation) ?? secondLocation) : null;

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

  // ─── shared style helpers ────────────────────────────────────────────────

  // Letter-spacing hover with paddingRight buffer so surrounding elements never shift.
  // City1 (left of pipe) and city2 (right of pipe) both use paddingRight so the pipe
  // stays fixed as letter-spacing expands into the pre-reserved space.
  const cityLinkStyle = (size: string): React.CSSProperties => ({
    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
    fontSize: size,
    color: "#241123",
    fontWeight: 700,
    letterSpacing: "1.5px",
    opacity: 0.5,
    textTransform: "uppercase",
    paddingRight: "0.4rem",
    transition: "letter-spacing 0.2s ease, padding-right 0.2s ease, color 0.2s ease, opacity 0.2s ease",
  });

  const cityLinkHover = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = "#6C00AF";
    e.currentTarget.style.opacity = "1";
    e.currentTarget.style.letterSpacing = "3px";
    e.currentTarget.style.paddingRight = "0";
  };
  const cityLinkLeave = (size: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = "#241123";
    e.currentTarget.style.opacity = "0.5";
    e.currentTarget.style.letterSpacing = "1.5px";
    e.currentTarget.style.paddingRight = "0.4rem";
  };

  // Location block — reused in both "with currentTitle" and standalone paths
  function LocationDisplay({ size, basedInSize }: { size: string; basedInSize?: string }) {
    if (!location) return null;
    const fs = size;
    const bfs = basedInSize ?? size;

    if (secondLocation) {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
          {locationHref ? (
            <Link href={locationHref} prefetch className="no-underline hover:no-underline inline-block"
              style={cityLinkStyle(fs)}
              aria-label={`View artists based in ${displayLocation}`}
              onMouseEnter={cityLinkHover}
              onMouseLeave={cityLinkLeave(fs)}
            >{displayLocation?.toUpperCase()}</Link>
          ) : (
            <span style={{ ...cityLinkStyle(fs), paddingRight: 0, transition: "none" }}>{displayLocation?.toUpperCase()}</span>
          )}
          <span style={{ color: "#241123", opacity: 0.3, fontSize: fs, fontWeight: 300 }}>|</span>
          {secondLocationHref ? (
            <Link href={secondLocationHref} prefetch className="no-underline hover:no-underline inline-block"
              style={cityLinkStyle(fs)}
              aria-label={`View artists based in ${displaySecondLocation}`}
              onMouseEnter={cityLinkHover}
              onMouseLeave={cityLinkLeave(fs)}
            >{displaySecondLocation?.toUpperCase()}</Link>
          ) : (
            <span style={{ ...cityLinkStyle(fs), paddingRight: 0, transition: "none" }}>{displaySecondLocation?.toUpperCase()}</span>
          )}
        </span>
      );
    }

    // Single city — show "Based in"
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
        <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: bfs, color: "#241123", fontWeight: 400, opacity: 0.4, letterSpacing: "0.5px" }}>
          Based in
        </span>
        {locationHref ? (
          <Link href={locationHref} prefetch className="no-underline hover:no-underline inline-block"
            style={cityLinkStyle(fs)}
            aria-label={`View artists based in ${displayLocation}`}
            onMouseEnter={cityLinkHover}
            onMouseLeave={cityLinkLeave(fs)}
          >{displayLocation?.toUpperCase()}</Link>
        ) : (
          <span style={{ ...cityLinkStyle(fs), paddingRight: 0, transition: "none" }}>{displayLocation?.toUpperCase()}</span>
        )}
      </span>
    );
  }

  return (
    <div ref={profileCardRef} style={{ position: "relative" }}>
      {hasContactInfo && (
        <ContactOverlay name={name} slug={slug} publicEmail={publicEmail} website={website} socials={socials} profileCardRef={profileCardRef} />
      )}

      {statusFlags?.length > 0 && (
        <div className="absolute z-40 flex items-center gap-2" style={{ top: "0rem", right: "4.5rem", position: "absolute", clipPath: "inset(0px -9999px -9999px -9999px)" }}>
          <StatusFlags flags={statusFlags} fontSize="1.75rem" fontFamily='var(--font-dm-sans), system-ui, sans-serif' textColor="#F6E4C1" borderRadius="33px" />
        </div>
      )}

      <div className="absolute z-40" style={{ top: "1rem", right: "1rem" }}>
        <ShareButton url={currentUrl} />
      </div>

      {/* Headshot */}
      <div
        className="absolute top-0 left-[1.5rem] sm:left-4 z-40 w-[360px] h-[450px] overflow-hidden bg-[#241123] shadow-[6px_8px_20px_rgba(0,0,0,0.25)] cursor-pointer"
        onClick={openHeadshotGallery}
        role="button"
        tabIndex={0}
        aria-label="Open headshot"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); openHeadshotGallery(); }
        }}
      >
        <Image src={imageSrc} alt={`${name}'s headshot`} fill placeholder="blur" blurDataURL={fallbackImage} priority style={{ objectFit: "cover", objectPosition: "top center" }} />
      </div>

      {/* Name + meta */}
      <div style={{ backgroundColor: "#C39B6C", color: "#F6E4C1", textAlign: "left", paddingLeft: "415px", paddingTop: "2rem", paddingBottom: "2rem" }}>
        <ScaledName firstName={firstName} lastName={lastName} containerWidth={360} gapRem={0.6} />

        {(titleLinks.length > 0 || currentTitle || location) && (
          <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>

            {currentTitle ? (
              /* ── Has currentTitle: title + DAT pill on one row, location on row below ── */
              <>
                {/* Row 1: currentTitle (optionally linked) + DAT pill inline to the right */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>

                  {/* currentTitle — linked if it maps to a browse page */}
                  {currentTitleHref ? (
                    <Link
                      href={currentTitleHref}
                      prefetch
                      className="no-underline hover:no-underline inline-block"
                      style={{
                        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                        fontSize: "1.7rem",
                        color: "#241123",
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        fontWeight: 700,
                        lineHeight: 1.15,
                        paddingRight: "1rem",
                        transition: "letter-spacing 0.2s ease, padding-right 0.2s ease, color 0.2s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.letterSpacing = "4.5px"; e.currentTarget.style.paddingRight = "0"; e.currentTarget.style.color = "#6C00AF"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.letterSpacing = "2px"; e.currentTarget.style.paddingRight = "1rem"; e.currentTarget.style.color = "#241123"; }}
                      aria-label={`View ${currentTitle}`}
                    >
                      {currentTitle}
                    </Link>
                  ) : (
                    <span style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontSize: "1.7rem", color: "#241123", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 700, lineHeight: 1.15 }}>
                      {currentTitle}
                    </span>
                  )}

                  {/* DAT pill: badge + role(s), inline to the right of currentTitle */}
                  {titleLinks.length > 0 && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.55rem", backgroundColor: "#241123", padding: "5px 13px 5px 11px", borderRadius: "4px", flexShrink: 0 }}>
                      <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "0.82rem", letterSpacing: "3.5px", fontWeight: 900, color: "#ffcc00", textTransform: "uppercase" }}>
                        DAT
                      </span>
                      {titleLinks.map(({ label, href }, idx) => (
                        <span key={`${href}-${label}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                          {idx > 0 && <span style={{ color: "#ffcc00", opacity: 0.35, fontSize: "0.7rem", fontWeight: 400 }} aria-hidden>–</span>}
                          <Link
                            href={href}
                            prefetch
                            className="no-underline hover:no-underline inline-block"
                            style={{
                              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                              fontSize: "0.9rem",
                              color: "#ffcc00",
                              opacity: 0.75,
                              textTransform: "uppercase",
                              letterSpacing: "2px",
                              fontWeight: 700,
                              paddingRight: "0.4rem",
                              transition: "letter-spacing 0.2s ease, padding-right 0.2s ease, color 0.2s ease, opacity 0.2s ease",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.letterSpacing = "3.5px"; e.currentTarget.style.paddingRight = "0"; e.currentTarget.style.color = "#f23359"; e.currentTarget.style.opacity = "1"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.letterSpacing = "2px"; e.currentTarget.style.paddingRight = "0.4rem"; e.currentTarget.style.color = "#ffcc00"; e.currentTarget.style.opacity = "0.75"; }}
                            aria-label={`View ${label}`}
                          >
                            {label}
                          </Link>
                        </span>
                      ))}
                    </span>
                  )}
                </div>

                {/* Row 2: location */}
                {location && (
                  <div style={{ marginTop: "0.45rem" }}>
                    <LocationDisplay size="1.05rem" />
                  </div>
                )}
              </>
            ) : (
              /* ── No currentTitle: big DAT role links, location below ── */
              <>
                {titleLinks.length > 0 && (
                  <div className="flex flex-row items-center flex-wrap gap-y-1">
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
                              paddingRight: "1rem",
                              transition: "letter-spacing 0.2s ease, padding-right 0.2s ease, color 0.2s ease",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.letterSpacing = "4.5px"; e.currentTarget.style.paddingRight = "0"; e.currentTarget.style.color = "#6C00AF"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.letterSpacing = "2px"; e.currentTarget.style.paddingRight = "1rem"; e.currentTarget.style.color = "#241123"; }}
                            aria-label={`View ${label}`}
                          >
                            {label}
                          </Link>
                          {idx < titleLinks.length - 1 && (
                            <span style={{ fontSize: "1.7rem", color: "#241123", opacity: 0.7, margin: "0 0.6rem", fontWeight: 400 }}>–</span>
                          )}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
                {location && (
                  <div style={{ marginTop: "0.4rem" }}>
                    <LocationDisplay size="1.2rem" />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <Lightbox
          images={(galleryUrls && galleryUrls.length ? galleryUrls : [imageSrc]).filter(Boolean)}
          startIndex={currentHeadshotIndex}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
