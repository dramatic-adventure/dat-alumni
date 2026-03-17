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

// CSS custom properties for .ls-hover — TypeScript needs the cast
type WithLSVars = React.CSSProperties & { "--ls-base"?: string; "--ls-hover"?: string };

// Priority order for DAT role display (lower number = shown first)
const ROLE_DISPLAY_PRIORITY: Record<string, number> = {
  "executive director": 1,
  "artistic director": 2,
  "director": 3,
  "partner": 4,
  "playwright": 5,
  "travel writer": 6,
  "designer": 7,
  "stage manager": 8,
  "teaching artist": 9,
  "actor": 10,
  "performer": 11,
  "special event host": 12,
  "manager": 13,
};

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
  const [rolesExpanded, setRolesExpanded] = useState(false);
  const [currentTitlesExpanded, setCurrentTitlesExpanded] = useState(false);
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
      } catch { /* AbortError or network — ignore */ }
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
    if (!galleryUrls.length) { const c = imageSrc.trim(); if (c) setGalleryUrls([c]); }
    setModalOpen(true);
  }

  const profileCardRef = useRef<HTMLDivElement>(null);
  const hasContactInfo = !!(publicEmail || website || (socials && socials.length > 0));

  useEffect(() => { if (typeof window !== "undefined") setCurrentUrl(window.location.href); }, []);

  const allRoles = (roles && roles.length > 0 ? roles : splitTitles(role))
    .map((r) => r.trim()).filter(Boolean);

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
    () => {
      const links = Array.from(
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
      return [...links].sort((a, b) => {
        const pa = ROLE_DISPLAY_PRIORITY[a.label.toLowerCase()] ?? 50;
        const pb = ROLE_DISPLAY_PRIORITY[b.label.toLowerCase()] ?? 50;
        return pa - pb;
      });
    },
    [allRoles]
  );

  // Multi-value currentTitle support: "Social Worker, Teacher" → ["Social Worker", "Teacher"]
  // First value = primary (user controls order); extras expandable via "+"
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

  // ─── Location sub-component ────────────────────────────────────────────
  function LocationDisplay({ size }: { size: string }) {
    if (!location) return null;

    // City link: .ls-hover handles letter-spacing with no layout shift.
    // Only color + opacity change in JS handlers.
    const cityStyle: WithLSVars = {
      "--ls-base": "1.5px",
      "--ls-hover": "3px",
      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
      fontSize: size,
      color: "#241123",
      fontWeight: 700,
      opacity: 0.5,
      textTransform: "uppercase",
    };

    // Plain version (no CSS custom props) for non-interactive spans
    const cityPlainStyle: React.CSSProperties = {
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
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
          {locationHref ? (
            <Link href={locationHref} prefetch
              className="ls-hover no-underline hover:no-underline"
              data-text={displayLocation ?? ""}
              style={cityStyle}
              aria-label={`View artists in ${displayLocation}`}
              onMouseEnter={onEnter} onMouseLeave={onLeave}
            >{displayLocation?.toUpperCase()}</Link>
          ) : (
            <span style={cityPlainStyle}>{displayLocation?.toUpperCase()}</span>
          )}
          <span style={{ color: "#241123", opacity: 0.25, fontSize: size, fontWeight: 200, lineHeight: 1 }}>|</span>
          {secondLocationHref ? (
            <Link href={secondLocationHref} prefetch
              className="ls-hover no-underline hover:no-underline"
              data-text={displaySecondLocation ?? ""}
              style={cityStyle}
              aria-label={`View artists in ${displaySecondLocation}`}
              onMouseEnter={onEnter} onMouseLeave={onLeave}
            >{displaySecondLocation?.toUpperCase()}</Link>
          ) : (
            <span style={cityPlainStyle}>{displaySecondLocation?.toUpperCase()}</span>
          )}
        </span>
      );
    }

    // Single city — "Based in CITY"
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
        <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: size, color: "#241123", fontWeight: 400, opacity: 0.38, letterSpacing: "0.5px" }}>
          Based in
        </span>
        {locationHref ? (
          <Link href={locationHref} prefetch
            className="ls-hover no-underline hover:no-underline"
            data-text={displayLocation ?? ""}
            style={cityStyle}
            aria-label={`View artists in ${displayLocation}`}
            onMouseEnter={onEnter} onMouseLeave={onLeave}
          >{displayLocation?.toUpperCase()}</Link>
        ) : (
          <span style={cityPlainStyle}>{displayLocation?.toUpperCase()}</span>
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
        onClick={openHeadshotGallery} role="button" tabIndex={0} aria-label="Open headshot"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); openHeadshotGallery(); } }}
      >
        <Image src={imageSrc} alt={`${name}'s headshot`} fill placeholder="blur" blurDataURL={fallbackImage} priority style={{ objectFit: "cover", objectPosition: "top center" }} />
      </div>

      {/* Name + meta */}
      <div style={{ backgroundColor: "#C39B6C", color: "#F6E4C1", textAlign: "left", paddingLeft: "415px", paddingTop: "2rem", paddingBottom: "2rem" }}>
        <ScaledName firstName={firstName} lastName={lastName} containerWidth={360} gapRem={0.6} />

        {(titleLinks.length > 0 || currentTitle || location) && (
          <div style={{ marginTop: "0.5rem" }}>

            {primaryCurrentTitle ? (
              <>
                {/* Row 1: primary currentTitle (+ toggle if extras) + DAT pill inline */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>

                  {/* Primary currentTitle + expand toggle */}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                    {currentTitleHref ? (
                      <Link href={currentTitleHref} prefetch
                        className="ls-hover no-underline hover:no-underline"
                        data-text={primaryCurrentTitle}
                        style={{
                          "--ls-base": "2px",
                          "--ls-hover": "4.5px",
                          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                          fontSize: "1.7rem",
                          color: "#241123",
                          textTransform: "uppercase",
                          fontWeight: 700,
                          lineHeight: 1.15,
                        } as WithLSVars}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; }}
                        aria-label={`View ${primaryCurrentTitle}`}
                      >{primaryCurrentTitle}</Link>
                    ) : (
                      <span style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontSize: "1.7rem", color: "#241123", textTransform: "uppercase", fontWeight: 700, lineHeight: 1.15, letterSpacing: "2px" }}>
                        {primaryCurrentTitle}
                      </span>
                    )}
                    {extraCurrentTitles.length > 0 && (
                      <button
                        onClick={(e) => { e.preventDefault(); setCurrentTitlesExpanded((r) => !r); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#241123", opacity: currentTitlesExpanded ? 0.5 : 0.3, fontSize: "1rem", fontWeight: 900, padding: 0, lineHeight: 1, fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
                        aria-label={currentTitlesExpanded ? "Collapse titles" : "Show more titles"}
                      >{currentTitlesExpanded ? "×" : "+"}</button>
                    )}
                  </span>

                  {/* DAT pill: primary role + expand/collapse for extras */}
                  {titleLinks.length > 0 && (
                    <span style={{
                      display: "inline-flex",
                      flexDirection: rolesExpanded ? "column" : "row",
                      alignItems: rolesExpanded ? "flex-start" : "center",
                      gap: rolesExpanded ? "0.28rem" : "0.55rem",
                      backgroundColor: "#241123",
                      padding: "5px 13px 5px 11px",
                      borderRadius: "4px",
                      flexShrink: 0,
                    }}>
                      {/* Always-visible row: DAT + primary role + toggle */}
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.55rem" }}>
                        <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "0.82rem", letterSpacing: "3.5px", fontWeight: 900, color: "#ffcc00", textTransform: "uppercase" }}>
                          DAT
                        </span>
                        <Link href={titleLinks[0].href} prefetch
                          className="ls-hover no-underline hover:no-underline"
                          data-text={titleLinks[0].label}
                          style={{
                            "--ls-base": "2px",
                            "--ls-hover": "3.5px",
                            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                            fontSize: "0.9rem",
                            color: "#ffcc00",
                            opacity: 0.75,
                            textTransform: "uppercase",
                            fontWeight: 700,
                          } as WithLSVars}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#f23359"; e.currentTarget.style.opacity = "1"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "#ffcc00"; e.currentTarget.style.opacity = "0.75"; }}
                          aria-label={`View ${titleLinks[0].label}`}
                        >{titleLinks[0].label}</Link>
                        {titleLinks.length > 1 && (
                          <button
                            onClick={(e) => { e.preventDefault(); setRolesExpanded((r) => !r); }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#ffcc00", opacity: rolesExpanded ? 0.65 : 0.4, fontSize: "0.78rem", fontWeight: 900, padding: 0, lineHeight: 1, fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
                            aria-label={rolesExpanded ? "Collapse roles" : "Show more roles"}
                          >{rolesExpanded ? "×" : "+"}</button>
                        )}
                      </span>
                      {/* Extra roles — revealed on expand */}
                      {rolesExpanded && titleLinks.slice(1).map(({ label, href }) => (
                        <span key={`${href}-${label}`} style={{ paddingLeft: "2.05rem" }}>
                          <Link href={href} prefetch
                            className="ls-hover no-underline hover:no-underline"
                            data-text={label}
                            style={{
                              "--ls-base": "2px",
                              "--ls-hover": "3.5px",
                              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                              fontSize: "0.9rem",
                              color: "#ffcc00",
                              opacity: 0.75,
                              textTransform: "uppercase",
                              fontWeight: 700,
                            } as WithLSVars}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#f23359"; e.currentTarget.style.opacity = "1"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "#ffcc00"; e.currentTarget.style.opacity = "0.75"; }}
                            aria-label={`View ${label}`}
                          >{label}</Link>
                        </span>
                      ))}
                    </span>
                  )}
                </div>

                {/* Extra currentTitles — revealed when expanded */}
                {currentTitlesExpanded && extraCurrentTitles.map(({ label, href }) => (
                  <div key={label} style={{ marginTop: "0.2rem" }}>
                    {href ? (
                      <Link href={href} prefetch
                        className="ls-hover no-underline hover:no-underline"
                        data-text={label}
                        style={{
                          "--ls-base": "2px",
                          "--ls-hover": "4.5px",
                          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                          fontSize: "1.7rem",
                          color: "#241123",
                          textTransform: "uppercase",
                          fontWeight: 700,
                          lineHeight: 1.15,
                        } as WithLSVars}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; }}
                        aria-label={`View ${label}`}
                      >{label}</Link>
                    ) : (
                      <span style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontSize: "1.7rem", color: "#241123", textTransform: "uppercase", fontWeight: 700, lineHeight: 1.15, letterSpacing: "2px" }}>
                        {label}
                      </span>
                    )}
                  </div>
                ))}

                {/* Location row */}
                {location && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <LocationDisplay size="1.05rem" />
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Big DAT role links (no currentTitle): primary + expand for extras */}
                {titleLinks.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.1rem" }}>
                    {/* Primary role row */}
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.55rem" }}>
                      <Link href={titleLinks[0].href} prefetch
                        className="ls-hover no-underline hover:no-underline"
                        data-text={titleLinks[0].label}
                        style={{
                          "--ls-base": "2px",
                          "--ls-hover": "4.5px",
                          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                          fontSize: "1.7rem",
                          color: "#241123",
                          textTransform: "uppercase",
                          fontWeight: 700,
                          opacity: 0.9,
                        } as WithLSVars}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; e.currentTarget.style.opacity = "1"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; e.currentTarget.style.opacity = "0.9"; }}
                        aria-label={`View ${titleLinks[0].label}`}
                      >{titleLinks[0].label}</Link>
                      {titleLinks.length > 1 && (
                        <button
                          onClick={(e) => { e.preventDefault(); setRolesExpanded((r) => !r); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#241123", opacity: rolesExpanded ? 0.5 : 0.3, fontSize: "1rem", fontWeight: 900, padding: 0, lineHeight: 1, fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
                          aria-label={rolesExpanded ? "Collapse roles" : "Show more roles"}
                        >{rolesExpanded ? "×" : "+"}</button>
                      )}
                    </span>
                    {/* Extra roles revealed on expand */}
                    {rolesExpanded && titleLinks.slice(1).map(({ label, href }) => (
                      <Link key={`${href}-${label}`} href={href} prefetch
                        className="ls-hover no-underline hover:no-underline"
                        data-text={label}
                        style={{
                          "--ls-base": "2px",
                          "--ls-hover": "4.5px",
                          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                          fontSize: "1.7rem",
                          color: "#241123",
                          textTransform: "uppercase",
                          fontWeight: 700,
                          opacity: 0.9,
                        } as WithLSVars}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; e.currentTarget.style.opacity = "1"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; e.currentTarget.style.opacity = "0.9"; }}
                        aria-label={`View ${label}`}
                      >{label}</Link>
                    ))}
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
