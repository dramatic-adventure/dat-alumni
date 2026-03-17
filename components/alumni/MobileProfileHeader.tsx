"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import ShareButton from "@/components/ui/ShareButton";
import ContactOverlay from "@/components/shared/ContactOverlay";
import Lightbox from "@/components/shared/Lightbox";
import StatusFlags from "@/components/alumni/StatusFlags";

import NameStack from "@/components/shared/NameStack";
import { splitTitles, slugifyTitle, bucketsForTitleToken } from "@/lib/titles";
import { getLocationHrefForToken, normalizeLocation } from "@/lib/locations";

interface MobileProfileHeaderProps {
  alumniId: string;
  slug?: string;
  name: string;
  role: string;
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

export default function MobileProfileHeader({
  alumniId,
  slug,
  name,
  role,
  location,
  headshotUrl,
  statusFlags = [],
  publicEmail,
  website,
  socials,
  currentTitle,
  secondLocation,
  isBiCoastal,
}: MobileProfileHeaderProps) {

  const fallbackImage = "/images/default-headshot.png";

  const [imageSrc, setImageSrc] = useState(
    () => headshotUrl ? headshotUrl.replace(/^http:\/\//i, "https://") : fallbackImage
  );

  const headerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [currentHeadshotIndex, setCurrentHeadshotIndex] = useState(0);
  const fetchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let alive = true;

    const toUrl = (it: any): string => {
      const fid = String(it?.fileId || "").trim();
      if (fid) return `/api/img?fileId=${encodeURIComponent(fid)}`;
      const ext = String(it?.externalUrl || "").trim();
      if (ext) return `/api/img?url=${encodeURIComponent(ext)}`;
      return "";
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
          const ta = Date.parse(String(a?.uploadedAt || "")) || 0;
          const tb = Date.parse(String(b?.uploadedAt || "")) || 0;
          if (tb !== ta) return tb - ta;
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

  function openHeadshotGallery() {
    if (!galleryUrls.length) {
      const current = imageSrc.trim();
      if (current) setGalleryUrls([current]);
    }
    setModalOpen(true);
  }

  useEffect(() => { setCurrentUrl(window.location.href); }, []);

  const nameParts = name.trim().split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || nameParts[0];
  const lastName = nameParts.slice(-1).join(" ") || "";

  const hasContactInfo = !!(publicEmail || website || (socials && socials.length > 0));

  const allRoles = splitTitles(role).map((r) => r.trim()).filter(Boolean);

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

  const currentTitleHref = currentTitle ? hrefForTitleToken(currentTitle) : null;

  const locationHref = location ? getLocationHrefForToken(location) : null;
  const secondLocationHref = secondLocation ? getLocationHrefForToken(secondLocation) : null;
  const displayLocation = location ? (normalizeLocation(location) ?? location) : null;
  const displaySecondLocation = secondLocation ? (normalizeLocation(secondLocation) ?? secondLocation) : null;

  // ─── shared style helpers ────────────────────────────────────────────────

  const cityLinkStyle = (size: string): React.CSSProperties => ({
    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
    fontSize: size,
    color: "#241123",
    fontWeight: 700,
    letterSpacing: "1.5px",
    opacity: 0.5,
    textTransform: "uppercase",
    paddingRight: "0.35rem",
    transition: "letter-spacing 0.2s ease, padding-right 0.2s ease, color 0.2s ease, opacity 0.2s ease",
  });

  const cityLinkHover = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = "#6C00AF";
    e.currentTarget.style.opacity = "1";
    e.currentTarget.style.letterSpacing = "3px";
    e.currentTarget.style.paddingRight = "0";
  };
  const cityLinkLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = "#241123";
    e.currentTarget.style.opacity = "0.5";
    e.currentTarget.style.letterSpacing = "1.5px";
    e.currentTarget.style.paddingRight = "0.35rem";
  };

  function LocationDisplay({ size, textSize }: { size: string; textSize?: string }) {
    if (!location) return null;
    const fs = size;
    const ts = textSize ?? size;

    if (secondLocation) {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
          {locationHref ? (
            <Link href={locationHref} prefetch className="no-underline hover:no-underline inline-block"
              style={cityLinkStyle(fs)}
              aria-label={`View artists based in ${displayLocation}`}
              onMouseEnter={cityLinkHover}
              onMouseLeave={cityLinkLeave}
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
              onMouseLeave={cityLinkLeave}
            >{displaySecondLocation?.toUpperCase()}</Link>
          ) : (
            <span style={{ ...cityLinkStyle(fs), paddingRight: 0, transition: "none" }}>{displaySecondLocation?.toUpperCase()}</span>
          )}
        </span>
      );
    }

    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
        <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: ts, color: "#241123", fontWeight: 400, opacity: 0.4, letterSpacing: "0.5px" }}>
          Based in
        </span>
        {locationHref ? (
          <Link href={locationHref} prefetch className="no-underline hover:no-underline inline-block"
            style={cityLinkStyle(fs)}
            aria-label={`View artists based in ${displayLocation}`}
            onMouseEnter={cityLinkHover}
            onMouseLeave={cityLinkLeave}
          >{displayLocation?.toUpperCase()}</Link>
        ) : (
          <span style={{ ...cityLinkStyle(fs), paddingRight: 0, transition: "none" }}>{displayLocation?.toUpperCase()}</span>
        )}
      </span>
    );
  }

  return (
    <div ref={headerRef} style={{ backgroundColor: "#C39B6C", position: "relative" }}>
      {hasContactInfo && (
        <ContactOverlay name={name} slug={slug} publicEmail={publicEmail} website={website} socials={socials} profileCardRef={headerRef} />
      )}

      {statusFlags.length > 0 && (
        <div className="absolute top-1 right-[4rem] z-50" style={{ clipPath: "inset(0px -9999px -9999px -9999px)" }}>
          <StatusFlags flags={statusFlags} fontSize="1.15rem" fontFamily='var(--font-dm-sans), system-ui, sans-serif' textColor="#F6E4C1" borderRadius="20px" className="gap-1" padding="1.6rem 0.5rem 0.5rem" />
        </div>
      )}

      <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 70, pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto" }}>
          <div role="share-button-wrapper" style={{ padding: "4px", minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShareButton url={currentUrl} />
          </div>
        </div>
      </div>

      {/* Headshot */}
      <div
        className="relative cursor-pointer"
        style={{ aspectRatio: "4 / 5", boxShadow: "6px 8px 20px rgba(0,0,0,0.25)", backgroundColor: "#241123", margin: "0 auto", width: "90%", maxWidth: "360px" }}
        onClick={openHeadshotGallery}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); openHeadshotGallery(); } }}
        aria-label="Open headshot"
      >
        <Image src={imageSrc} alt={`${name}'s headshot`} fill placeholder="blur" blurDataURL={fallbackImage} priority fetchPriority="high" style={{ objectFit: "cover", objectPosition: "top center" }} />
      </div>

      {/* Name + meta */}
      <div style={{ width: "90%", maxWidth: "360px", margin: "1.5rem auto 0", overflow: "hidden" }}>
        <NameStack firstName={firstName} lastName={lastName} containerWidth={320} gapRem={0.6} />

        {(allRoles.length > 0 || currentTitle || location) && (
          <div style={{ marginBottom: "2rem", textAlign: "center", wordBreak: "break-word" }}>

            {currentTitle ? (
              /* ── Has currentTitle ── */
              <>
                {/* Row 1: currentTitle + DAT pill, centered, wrappable */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", flexWrap: "wrap", marginTop: "0.5rem" }}>

                  {/* currentTitle — linked if it maps to a browse page */}
                  {currentTitleHref ? (
                    <Link
                      href={currentTitleHref}
                      prefetch
                      className="no-underline hover:no-underline inline-block"
                      style={{
                        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                        fontSize: "clamp(1rem, 4vw, 1.35rem)",
                        color: "#241123",
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        fontWeight: 800,
                        lineHeight: 1.2,
                        paddingRight: "0.75rem",
                        transition: "letter-spacing 0.2s ease, padding-right 0.2s ease, color 0.2s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.letterSpacing = "4px"; e.currentTarget.style.paddingRight = "0"; e.currentTarget.style.color = "#6C00AF"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.letterSpacing = "2px"; e.currentTarget.style.paddingRight = "0.75rem"; e.currentTarget.style.color = "#241123"; }}
                      aria-label={`View ${currentTitle}`}
                    >
                      {currentTitle}
                    </Link>
                  ) : (
                    <span style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontSize: "clamp(1rem, 4vw, 1.35rem)", color: "#241123", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800, lineHeight: 1.2 }}>
                      {currentTitle}
                    </span>
                  )}

                  {/* DAT pill inline */}
                  {titleLinks.length > 0 && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", backgroundColor: "#241123", padding: "4px 11px 4px 9px", borderRadius: "4px", flexShrink: 0 }}>
                      <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "0.72rem", letterSpacing: "3.5px", fontWeight: 900, color: "#ffcc00", textTransform: "uppercase" }}>
                        DAT
                      </span>
                      {titleLinks.map(({ label, href }, idx) => (
                        <span key={`${href}-${label}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                          {idx > 0 && <span style={{ color: "#ffcc00", opacity: 0.35, fontSize: "0.62rem", fontWeight: 400 }} aria-hidden>–</span>}
                          <Link
                            href={href}
                            prefetch
                            className="no-underline hover:no-underline inline-block"
                            style={{
                              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                              fontSize: "clamp(0.7rem, 2.5vw, 0.82rem)",
                              color: "#ffcc00",
                              opacity: 0.75,
                              textTransform: "uppercase",
                              letterSpacing: "2px",
                              fontWeight: 700,
                              paddingRight: "0.35rem",
                              transition: "letter-spacing 0.2s ease, padding-right 0.2s ease, color 0.2s ease, opacity 0.2s ease",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.letterSpacing = "3px"; e.currentTarget.style.paddingRight = "0"; e.currentTarget.style.color = "#f23359"; e.currentTarget.style.opacity = "1"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.letterSpacing = "2px"; e.currentTarget.style.paddingRight = "0.35rem"; e.currentTarget.style.color = "#ffcc00"; e.currentTarget.style.opacity = "0.75"; }}
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
                  <div style={{ marginTop: "0.45rem", display: "flex", justifyContent: "center" }}>
                    <LocationDisplay size="clamp(0.7rem, 2.5vw, 0.85rem)" textSize="clamp(0.65rem, 2.5vw, 0.8rem)" />
                  </div>
                )}
              </>
            ) : (
              /* ── No currentTitle: big DAT role links, location below ── */
              <>
                {titleLinks.length > 0 && (
                  <div className="flex flex-wrap justify-center items-center gap-x-3 mt-2">
                    <span className="flex items-center flex-wrap justify-center">
                      {titleLinks.map(({ label, href }, idx) => (
                        <span key={`${href}-${label}`} className="flex items-center">
                          <Link
                            href={href}
                            prefetch
                            className="no-underline hover:no-underline inline-block"
                            style={{
                              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                              fontSize: "clamp(1rem, 4vw, 1.35rem)",
                              color: "#241123",
                              textTransform: "uppercase",
                              letterSpacing: "2px",
                              fontWeight: 800,
                              opacity: 0.95,
                              whiteSpace: "nowrap",
                              paddingRight: "0.75rem",
                              transition: "letter-spacing 0.2s ease, padding-right 0.2s ease, color 0.2s ease",
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.letterSpacing = "4px"; e.currentTarget.style.paddingRight = "0"; e.currentTarget.style.color = "#6C00AF"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.letterSpacing = "2px"; e.currentTarget.style.paddingRight = "0.75rem"; e.currentTarget.style.color = "#241123"; }}
                            aria-label={`View ${label}`}
                          >
                            {label}
                          </Link>
                          {idx < titleLinks.length - 1 && (
                            <span style={{ fontSize: "clamp(1rem, 4vw, 1.35rem)", color: "#241123", opacity: 0.7, margin: "0 0.5rem", fontWeight: 400 }} aria-hidden="true">–</span>
                          )}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
                {location && (
                  <div style={{ marginTop: "0.5rem", display: "flex", justifyContent: "center" }}>
                    <LocationDisplay size="clamp(0.8rem, 3vw, 0.95rem)" />
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
