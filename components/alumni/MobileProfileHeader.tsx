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

// Priority order for DAT role display (lower number = shown first).
// Tier 1: actual DAT staff/company roles (from dramaticadventure.com/company)
// Tier 2: general DAT participation roles (actor, playwright, etc.)
const ROLE_DISPLAY_PRIORITY: Record<string, number> = {
  // ── Tier 1: DAT Company / Staff roles ───────────────────
  "co-founder": 1,
  "executive director": 2,
  "artistic director": 3,
  "director of creative learning": 4,
  "director of global community partnerships": 5,
  "general counsel": 6,
  "manager of community partnerships": 7,
  "engagement manager": 8,
  "board president": 9,
  "president": 10,
  "board secretary": 11,
  "secretary": 12,
  "board treasurer": 13,
  "treasurer": 14,
  "board member": 15,
  // ── Tier 2: DAT Artistic / Program participation roles ───
  "resident playwright": 16,
  "playwright": 17,
  "travel writer": 18,
  "designer": 19,
  "stage manager": 20,
  "teaching artist": 21,
  "special event host": 22,
  "actor": 23,
  "actress": 23,
  "performer": 24,
  "partner": 25,
  "manager": 26,
};

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
  const [rolesExpanded, setRolesExpanded] = useState(false);
  const [currentTitlesExpanded, setCurrentTitlesExpanded] = useState(false);
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

  const titleLinksUnsorted = Array.from(
    new Map(
      allRoles
        .map((label) => {
          const href = hrefForTitleToken(label);
          return href ? [href, { label, href }] : null;
        })
        .filter(Boolean) as Array<[string, { label: string; href: string }]>
    ).values()
  );
  // Sort by DAT role prominence (Artistic Director before Actor, etc.)
  const titleLinks = [...titleLinksUnsorted].sort((a, b) => {
    const pa = ROLE_DISPLAY_PRIORITY[a.label.toLowerCase()] ?? 50;
    const pb = ROLE_DISPLAY_PRIORITY[b.label.toLowerCase()] ?? 50;
    return pa - pb;
  });

  // Multi-value currentTitle support: "Social Worker, Teacher" → ["Social Worker", "Teacher"]
  const currentTitles = currentTitle
    ? splitTitles(currentTitle).map((t) => t.trim()).filter(Boolean)
    : [];
  const primaryCurrentTitle = currentTitles[0] ?? null;
  const extraCurrentTitles = currentTitles.slice(1).map((label) => ({
    label,
    href: hrefForTitleToken(label),
  }));
  const currentTitleHref = primaryCurrentTitle ? hrefForTitleToken(primaryCurrentTitle) : null;

  const locationHref = location ? getLocationHrefForToken(location) : null;
  const secondLocationHref = secondLocation ? getLocationHrefForToken(secondLocation) : null;
  const displayLocation = location ? (normalizeLocation(location) ?? location) : null;
  const displaySecondLocation = secondLocation ? (normalizeLocation(secondLocation) ?? secondLocation) : null;

  // ─── Location sub-component ─────────────────────────────────────────────
  // Shared style for both interactive (Link) and plain (span) city display.
  // .ls-hover on the Link handles the scaleX animation; span uses same style statically.
  function LocationDisplay({ size, textSize }: { size: string; textSize?: string }) {
    if (!location) return null;
    const ts = textSize ?? size;

    const cityStyle: React.CSSProperties = {
      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
      fontSize: size,
      color: "#241123",
      fontWeight: 700,
      opacity: 0.5,
      textTransform: "uppercase",
    };

    const onEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.currentTarget.style.color = "#6C00AF";
      e.currentTarget.style.opacity = "1";
    };
    const onLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.currentTarget.style.color = "#241123";
      e.currentTarget.style.opacity = "0.5";
    };

    if (secondLocation) {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
          {locationHref ? (
            <Link href={locationHref} prefetch
              className="ls-hover no-underline hover:no-underline"
              style={cityStyle}
              aria-label={`View artists based in ${displayLocation}`}
              onMouseEnter={onEnter}
              onMouseLeave={onLeave}
            >{displayLocation?.toUpperCase()}</Link>
          ) : (
            <span style={cityStyle}>{displayLocation?.toUpperCase()}</span>
          )}
          <span style={{ color: "#241123", opacity: 0.3, fontSize: size, fontWeight: 200, lineHeight: 1 }}>|</span>
          {secondLocationHref ? (
            <Link href={secondLocationHref} prefetch
              className="ls-hover no-underline hover:no-underline"
              style={cityStyle}
              aria-label={`View artists based in ${displaySecondLocation}`}
              onMouseEnter={onEnter}
              onMouseLeave={onLeave}
            >{displaySecondLocation?.toUpperCase()}</Link>
          ) : (
            <span style={cityStyle}>{displaySecondLocation?.toUpperCase()}</span>
          )}
        </span>
      );
    }

    // Single city — "Based in CITY"
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
        <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: ts, color: "#241123", fontWeight: 400, opacity: 0.4, letterSpacing: "0.5px" }}>
          Based in
        </span>
        {locationHref ? (
          <Link href={locationHref} prefetch
            className="ls-hover no-underline hover:no-underline"
            style={cityStyle}
            aria-label={`View artists based in ${displayLocation}`}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >{displayLocation?.toUpperCase()}</Link>
        ) : (
          <span style={cityStyle}>{displayLocation?.toUpperCase()}</span>
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

            {primaryCurrentTitle ? (
              /* ── Has currentTitle ── */
              <>
                {/* Row 1: primary currentTitle + expand toggle */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", marginTop: "0.5rem" }}>
                  {/* Balancing spacer — mirrors the circle button so text stays optically centered */}
                  {extraCurrentTitles.length > 0 && (
                    <span aria-hidden="true" style={{ width: "1.1em", height: "1.1em", fontSize: "1.2rem", flexShrink: 0, visibility: "hidden" }} />
                  )}
                  {currentTitleHref ? (
                    <Link
                      href={currentTitleHref}
                      prefetch
                      className="ls-hover no-underline hover:no-underline"
                      style={{
                        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                        fontSize: "clamp(1rem, 4vw, 1.35rem)",
                        color: "#241123",
                        textTransform: "uppercase",
                        fontWeight: 800,
                        lineHeight: 1.2,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; }}
                      aria-label={`View ${primaryCurrentTitle}`}
                    >
                      {primaryCurrentTitle}
                    </Link>
                  ) : (
                    <span style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontSize: "clamp(1rem, 4vw, 1.35rem)", color: "#241123", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800, lineHeight: 1.2 }}>
                      {primaryCurrentTitle}
                    </span>
                  )}
                  {extraCurrentTitles.length > 0 && (
                    <button
                      onClick={(e) => { e.preventDefault(); setCurrentTitlesExpanded((r) => !r); }}
                      style={{ background: "none", border: "1px solid currentColor", borderRadius: "50%", cursor: "pointer", color: "#241123", opacity: currentTitlesExpanded ? 0.3 : 0.16, fontSize: "1.2rem", fontWeight: 700, padding: 0, width: "1.1em", height: "1.1em", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "var(--font-dm-sans), system-ui, sans-serif", transition: "color 0.2s ease, opacity 0.2s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; e.currentTarget.style.opacity = "1"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; e.currentTarget.style.opacity = currentTitlesExpanded ? "0.3" : "0.16"; }}
                      aria-label={currentTitlesExpanded ? "Collapse titles" : "Show more titles"}
                    >{currentTitlesExpanded ? "−" : "+"}</button>
                  )}
                </div>

                {/* Extra currentTitles — revealed when expanded (before DAT pill) */}
                {currentTitlesExpanded && extraCurrentTitles.map(({ label, href }) => (
                  <div key={label} style={{ marginTop: "0.2rem", display: "flex", justifyContent: "center" }}>
                    {href ? (
                      <Link
                        href={href}
                        prefetch
                        className="ls-hover no-underline hover:no-underline"
                        style={{
                          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                          fontSize: "clamp(1rem, 4vw, 1.35rem)",
                          color: "#241123",
                          textTransform: "uppercase",
                          fontWeight: 800,
                          lineHeight: 1.2,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; }}
                        aria-label={`View ${label}`}
                      >{label}</Link>
                    ) : (
                      <span style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontSize: "clamp(1rem, 4vw, 1.35rem)", color: "#241123", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800, lineHeight: 1.2 }}>
                        {label}
                      </span>
                    )}
                  </div>
                ))}

                {/* Location row — sits between titles and DAT pill */}
                {location && (
                  <div style={{ marginTop: "0.6rem", display: "flex", justifyContent: "center" }}>
                    <LocationDisplay size="clamp(0.7rem, 2.5vw, 0.85rem)" textSize="clamp(0.65rem, 2.5vw, 0.8rem)" />
                  </div>
                )}

                {/* DAT pill — closing tag, always last */}
                {titleLinks.length > 0 && (
                  <div style={{ marginTop: "0.6rem", display: "flex", justifyContent: "center" }}>
                    <span style={{
                      display: "inline-flex",
                      flexDirection: rolesExpanded ? "column" : "row",
                      alignItems: rolesExpanded ? "flex-start" : "center",
                      gap: rolesExpanded ? "0.25rem" : "0.45rem",
                      backgroundColor: "rgba(36, 17, 35, 0.08)",
                      border: "1px solid rgba(36, 17, 35, 0.2)",
                      padding: "4px 11px 4px 9px",
                      borderRadius: "4px",
                    }}>
                      {/* Always-visible row: DAT + primary role + toggle */}
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                        <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "0.72rem", letterSpacing: "3.5px", fontWeight: 900, color: "#ffcc00", textTransform: "uppercase" }}>
                          DAT
                        </span>
                        <Link
                          href={titleLinks[0].href}
                          prefetch
                          className="ls-hover no-underline hover:no-underline"
                          style={{
                            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                            fontSize: "clamp(0.7rem, 2.5vw, 0.82rem)",
                            color: "#241123",
                            opacity: 0.75,
                            textTransform: "uppercase",
                            fontWeight: 700,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; e.currentTarget.style.opacity = "1"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; e.currentTarget.style.opacity = "0.75"; }}
                          aria-label={`View ${titleLinks[0].label}`}
                        >
                          {titleLinks[0].label}
                        </Link>
                        {titleLinks.length > 1 && (
                          <button
                            onClick={(e) => { e.preventDefault(); setRolesExpanded((r) => !r); }}
                            style={{ background: "none", border: "1px solid currentColor", borderRadius: "50%", cursor: "pointer", color: "#241123", opacity: rolesExpanded ? 0.3 : 0.16, fontSize: "0.95rem", fontWeight: 700, padding: 0, width: "1.1em", height: "1.1em", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "var(--font-dm-sans), system-ui, sans-serif", transition: "color 0.2s ease, opacity 0.2s ease" }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; e.currentTarget.style.opacity = "1"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; e.currentTarget.style.opacity = rolesExpanded ? "0.3" : "0.16"; }}
                            aria-label={rolesExpanded ? "Collapse roles" : "Show more roles"}
                          >{rolesExpanded ? "−" : "+"}</button>
                        )}
                      </span>
                      {/* Extra roles — revealed on expand */}
                      {rolesExpanded && titleLinks.slice(1).map(({ label, href }) => (
                        <span key={`${href}-${label}`} style={{ paddingLeft: "1.85rem" }}>
                          <Link
                            href={href}
                            prefetch
                            className="ls-hover no-underline hover:no-underline"
                            style={{
                              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                              fontSize: "clamp(0.7rem, 2.5vw, 0.82rem)",
                              color: "#241123",
                              opacity: 0.75,
                              textTransform: "uppercase",
                              fontWeight: 700,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; e.currentTarget.style.opacity = "1"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; e.currentTarget.style.opacity = "0.75"; }}
                            aria-label={`View ${label}`}
                          >
                            {label}
                          </Link>
                        </span>
                      ))}
                    </span>
                  </div>
                )}
              </>
            ) : (
              /* ── No currentTitle: big DAT role links, location below ── */
              <>
                {/* Big DAT role links (no currentTitle): primary + expand for extras */}
                {titleLinks.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.1rem", marginTop: "0.5rem" }}>
                    {/* Primary role row */}
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                      <Link
                        href={titleLinks[0].href}
                        prefetch
                        className="ls-hover no-underline hover:no-underline"
                        style={{
                          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                          fontSize: "clamp(1rem, 4vw, 1.35rem)",
                          color: "#241123",
                          textTransform: "uppercase",
                          fontWeight: 800,
                          opacity: 0.95,
                          whiteSpace: "nowrap",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; e.currentTarget.style.opacity = "1"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; e.currentTarget.style.opacity = "0.95"; }}
                        aria-label={`View ${titleLinks[0].label}`}
                      >
                        {titleLinks[0].label}
                      </Link>
                      {titleLinks.length > 1 && (
                        <button
                          onClick={(e) => { e.preventDefault(); setRolesExpanded((r) => !r); }}
                          style={{ background: "none", border: "1px solid currentColor", borderRadius: "50%", cursor: "pointer", color: "#241123", opacity: rolesExpanded ? 0.3 : 0.16, fontSize: "1.2rem", fontWeight: 700, padding: 0, width: "1.1em", height: "1.1em", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "var(--font-dm-sans), system-ui, sans-serif", transition: "color 0.2s ease, opacity 0.2s ease" }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; e.currentTarget.style.opacity = "1"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; e.currentTarget.style.opacity = rolesExpanded ? "0.3" : "0.16"; }}
                          aria-label={rolesExpanded ? "Collapse roles" : "Show more roles"}
                        >{rolesExpanded ? "−" : "+"}</button>
                      )}
                    </span>
                    {/* Extra roles revealed on expand */}
                    {rolesExpanded && titleLinks.slice(1).map(({ label, href }) => (
                      <Link
                        key={`${href}-${label}`}
                        href={href}
                        prefetch
                        className="ls-hover no-underline hover:no-underline"
                        style={{
                          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                          fontSize: "clamp(1rem, 4vw, 1.35rem)",
                          color: "#241123",
                          textTransform: "uppercase",
                          fontWeight: 800,
                          opacity: 0.95,
                          whiteSpace: "nowrap",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; e.currentTarget.style.opacity = "1"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; e.currentTarget.style.opacity = "0.95"; }}
                        aria-label={`View ${label}`}
                      >
                        {label}
                      </Link>
                    ))}
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
