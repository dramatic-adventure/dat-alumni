"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import ShareButton from "@/components/ui/ShareButton";
import ContactOverlay from "@/components/shared/ContactOverlay";
import Lightbox from "@/components/shared/Lightbox";
import StatusFlags from "@/components/alumni/StatusFlags";

import NameStack from "@/components/shared/NameStack"; // a.k.a. ScaledName
import { splitTitles, slugifyTitle, bucketsForTitleToken } from "@/lib/titles";
import { getLocationHrefForToken } from "@/lib/locations";

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

  // imageSrc starts as the server-provided headshot (Squarespace URL or
  // currentHeadshotId-derived URL). The mount effect may update it to the
  // isCurrent item from Profile-Media once that fetch resolves.
  const [imageSrc, setImageSrc] = useState(
    () => headshotUrl ? headshotUrl.replace(/^http:\/\//i, "https://") : fallbackImage
  );

  const headerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [currentHeadshotIndex, setCurrentHeadshotIndex] = useState(0);
  const fetchAbortRef = useRef<AbortController | null>(null);

  // Fetch Profile-Media: update displayed headshot to isCurrent item,
  // pre-populate gallery, warm browser image cache, track isCurrent index.
  // Re-runs on tab-focus so changes to isCurrent in the sheet are reflected
  // immediately when you switch back to the browser — no navigation needed.
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

        // Update displayed headshot to the isCurrent item from Profile-Media.
        const currentItem = rawItems.find((it: any) => it?.isCurrent === true);
        const currentUrl = currentItem ? toUrl(currentItem) : null;
        if (currentUrl) setImageSrc(currentUrl);

        // Pre-populate gallery, track isCurrent index, warm browser image cache.
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

    // Re-fetch on tab focus so isCurrent changes in the sheet show up
    // the moment you switch back to the browser without a page reload.
    const onVisible = () => { if (document.visibilityState === "visible") run(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      fetchAbortRef.current?.abort();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [alumniId]);

  function openHeadshotGallery() {
    // Gallery is pre-populated by the mount fetch; fall back to current
    // headshot only if the fetch hasn't resolved yet.
    if (!galleryUrls.length) {
      const current = imageSrc.trim();
      if (current) setGalleryUrls([current]);
    }
    setModalOpen(true);
  }


  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const nameParts = name.trim().split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || nameParts[0];
  const lastName = nameParts.slice(-1).join(" ") || "";

  const hasContactInfo = !!(publicEmail || website || (socials && socials.length > 0));

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
  const secondLocationHref = secondLocation ? getLocationHrefForToken(secondLocation) : null;

  return (
    <div ref={headerRef} style={{ backgroundColor: "#C39B6C", position: "relative" }}>
      {hasContactInfo && (
        <ContactOverlay
          name={name}
          slug={slug}
          publicEmail={publicEmail}
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
            fontFamily='var(--font-dm-sans), system-ui, sans-serif'
            textColor="#F6E4C1"
            borderRadius="20px"
            className="gap-1"
            padding="1.6rem 0.5rem 0.5rem"
          />
        </div>
      )}

      <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 70, pointerEvents: "none" }}>
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
        <Image
          src={imageSrc}
          alt={`${name}'s headshot`}
          fill
          placeholder="blur"
          blurDataURL={fallbackImage}
          priority
          fetchPriority="high"
          style={{ objectFit: "cover", objectPosition: "top center" }}
        />
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

        {(allRoles.length > 0 || currentTitle || location) && (
          <div style={{ marginBottom: "2rem", textAlign: "center", wordBreak: "break-word" }}>

            {/* ── Row 1 ──────────────────────────────────────────────────────────
                When currentTitle exists: show it BIG — this is their primary identity.
                When no currentTitle: show DAT role links big (unchanged behavior).
            ─────────────────────────────────────────────────────────────────── */}
            {currentTitle ? (
              <div
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "clamp(1rem, 4vw, 1.35rem)",
                  color: "#241123",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  fontWeight: 800,
                  lineHeight: 1.2,
                  marginTop: "0.5rem",
                }}
              >
                {currentTitle}
              </div>
            ) : (
              titleLinks.length > 0 && (
                <div className="flex flex-wrap justify-center items-center gap-x-3 mt-2">
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
                </div>
              )
            )}

            {/* ── Row 2 ──────────────────────────────────────────────────────────
                When currentTitle is present: ONE compact line merging the DAT
                badge, DAT role links, and location. Clean — just name, title,
                context. When no currentTitle: location below big DAT roles.
            ─────────────────────────────────────────────────────────────────── */}
            {currentTitle ? (
              (titleLinks.length > 0 || location) && (
                <div
                  className="flex flex-wrap justify-center items-center"
                  style={{ gap: "0.5rem", marginTop: "0.55rem" }}
                >
                  {/* DAT badge — #ffcc00 text */}
                  {titleLinks.length > 0 && (
                    <span
                      style={{
                        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                        fontSize: "0.65rem",
                        letterSpacing: "3px",
                        fontWeight: 900,
                        color: "#ffcc00",
                        backgroundColor: "#241123",
                        textTransform: "uppercase",
                        padding: "3px 9px 2px",
                        borderRadius: "4px",
                        flexShrink: 0,
                      }}
                    >
                      DAT
                    </span>
                  )}

                  {/* DAT role links */}
                  {titleLinks.length > 0 && (
                    <>
                      <span style={{ color: "#241123", opacity: 0.35, fontSize: "0.9rem", flexShrink: 0 }} aria-hidden>·</span>
                      {titleLinks.map(({ label, href }, idx) => (
                        <span key={`${href}-${label}`} className="flex items-center" style={{ gap: "0.5rem" }}>
                          <Link
                            href={href}
                            prefetch
                            className="no-underline hover:no-underline transition-all duration-200 inline-block"
                            style={{
                              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                              fontSize: "clamp(0.75rem, 3vw, 0.9rem)",
                              color: "#241123",
                              textTransform: "uppercase",
                              letterSpacing: "1.5px",
                              fontWeight: 700,
                              opacity: 0.55,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.color = "#6C00AF"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.55"; e.currentTarget.style.color = "#241123"; }}
                            aria-label={`View ${label}`}
                          >
                            {label}
                          </Link>
                          {idx < titleLinks.length - 1 && (
                            <span style={{ fontSize: "clamp(0.75rem, 3vw, 0.9rem)", color: "#241123", opacity: 0.4, fontWeight: 400 }} aria-hidden>–</span>
                          )}
                        </span>
                      ))}
                    </>
                  )}

                  {/* Dot separator between roles and location */}
                  {titleLinks.length > 0 && location && (
                    <span style={{ color: "#241123", opacity: 0.35, fontSize: "0.9rem", flexShrink: 0 }} aria-hidden>·</span>
                  )}

                  {/* Location inline */}
                  {location && (
                    secondLocation ? (
                      /* Between CITY & CITY2 */
                      <>
                        <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "clamp(0.75rem, 3vw, 0.9rem)", color: "#241123", fontWeight: 700, letterSpacing: "1.5px", opacity: 0.5 }}>Between&nbsp;</span>
                        {locationHref ? (
                          <Link href={locationHref} prefetch className="no-underline hover:no-underline"
                            style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "clamp(0.75rem, 3vw, 0.9rem)", color: "#241123", fontWeight: 900, letterSpacing: "1.5px", opacity: 0.5, textTransform: "uppercase", transition: "color 0.2s, opacity 0.2s" }}
                            aria-label={`View artists based in ${location}`}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; e.currentTarget.style.opacity = "1"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; e.currentTarget.style.opacity = "0.5"; }}
                          >{location.toUpperCase()}</Link>
                        ) : (
                          <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "clamp(0.75rem, 3vw, 0.9rem)", color: "#241123", fontWeight: 900, letterSpacing: "1.5px", opacity: 0.5, textTransform: "uppercase" }}>{location.toUpperCase()}</span>
                        )}
                        <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "clamp(0.75rem, 3vw, 0.9rem)", color: "#241123", fontWeight: 700, letterSpacing: "1.5px", opacity: 0.5 }}>&nbsp;&amp;&nbsp;</span>
                        {secondLocationHref ? (
                          <Link href={secondLocationHref} prefetch className="no-underline hover:no-underline"
                            style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "clamp(0.75rem, 3vw, 0.9rem)", color: "#241123", fontWeight: 900, letterSpacing: "1.5px", opacity: 0.5, textTransform: "uppercase", transition: "color 0.2s, opacity 0.2s" }}
                            aria-label={`View artists based in ${secondLocation}`}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; e.currentTarget.style.opacity = "1"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; e.currentTarget.style.opacity = "0.5"; }}
                          >{secondLocation.toUpperCase()}</Link>
                        ) : (
                          <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "clamp(0.75rem, 3vw, 0.9rem)", color: "#241123", fontWeight: 900, letterSpacing: "1.5px", opacity: 0.5, textTransform: "uppercase" }}>{secondLocation.toUpperCase()}</span>
                        )}
                      </>
                    ) : (
                      /* Based in CITY */
                      locationHref ? (
                        <Link href={locationHref} prefetch className="no-underline hover:no-underline"
                          style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "clamp(0.75rem, 3vw, 0.9rem)", color: "#241123", fontWeight: 700, letterSpacing: "1.5px", opacity: 0.5, transition: "color 0.2s, opacity 0.2s" }}
                          aria-label={`View artists based in ${location}`}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; e.currentTarget.style.opacity = "1"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; e.currentTarget.style.opacity = "0.5"; }}
                        >Based in {location.toUpperCase()}</Link>
                      ) : (
                        <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "clamp(0.75rem, 3vw, 0.9rem)", color: "#241123", fontWeight: 700, letterSpacing: "1.5px", opacity: 0.5 }}>Based in {location.toUpperCase()}</span>
                      )
                    )
                  )}
                </div>
              )
            ) : (
              /* ── No currentTitle: location below the big DAT role links (unchanged) ── */
              location && (
                <div className="flex justify-center items-center flex-wrap mt-2" style={{ gap: 0 }}>
                  {secondLocation ? (
                    <>
                      {locationHref ? (
                        <Link href={locationHref} prefetch className="no-underline hover:no-underline"
                          style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "clamp(0.8rem, 3vw, 0.95rem)", fontWeight: 900, letterSpacing: "2px", opacity: 0.5, textTransform: "uppercase", color: "#241123", transition: "color 0.2s, opacity 0.2s" }}
                          aria-label={`View artists based in ${location}`}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; e.currentTarget.style.opacity = "1"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; e.currentTarget.style.opacity = "0.5"; }}
                        >{location.toUpperCase()}</Link>
                      ) : (
                        <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "clamp(0.8rem, 3vw, 0.95rem)", fontWeight: 900, letterSpacing: "2px", opacity: 0.5, textTransform: "uppercase", color: "#241123" }}>{location.toUpperCase()}</span>
                      )}
                      <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "clamp(0.8rem, 3vw, 0.95rem)", fontWeight: 700, letterSpacing: "2px", opacity: 0.5, color: "#241123", margin: "0 0.35rem" }}>&amp;</span>
                      {secondLocationHref ? (
                        <Link href={secondLocationHref} prefetch className="no-underline hover:no-underline"
                          style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "clamp(0.8rem, 3vw, 0.95rem)", fontWeight: 900, letterSpacing: "2px", opacity: 0.5, textTransform: "uppercase", color: "#241123", transition: "color 0.2s, opacity 0.2s" }}
                          aria-label={`View artists based in ${secondLocation}`}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; e.currentTarget.style.opacity = "1"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; e.currentTarget.style.opacity = "0.5"; }}
                        >{secondLocation.toUpperCase()}</Link>
                      ) : (
                        <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "clamp(0.8rem, 3vw, 0.95rem)", fontWeight: 900, letterSpacing: "2px", opacity: 0.5, textTransform: "uppercase", color: "#241123" }}>{secondLocation.toUpperCase()}</span>
                      )}
                    </>
                  ) : (
                    locationHref ? (
                      <Link href={locationHref} prefetch className="no-underline hover:no-underline transition-all duration-200"
                        style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "clamp(0.8rem, 3vw, 0.95rem)", fontWeight: 900, letterSpacing: "2px", opacity: 0.5, display: "inline-block", color: "#241123", transition: "color 0.2s, opacity 0.2s" }}
                        aria-label={`View artists based in ${location}`}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; e.currentTarget.style.opacity = "1"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; e.currentTarget.style.opacity = "0.5"; }}
                      >Based in {location.toUpperCase()}</Link>
                    ) : (
                      <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "clamp(0.8rem, 3vw, 0.95rem)", fontWeight: 900, letterSpacing: "2px", opacity: 0.5, textTransform: "uppercase", color: "#241123" }}>Based in {location.toUpperCase()}</span>
                    )
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <Lightbox
          images={(galleryUrls && galleryUrls.length ? galleryUrls : [imageSrc]).filter(Boolean)}
          startIndex={currentHeadshotIndex}
          onClose={() => {
            setModalOpen(false);
            // Uncomment if you want fresh media on every open
            // setGalleryUrls([]);
          }}

        />
      )}
    </div>
  );
}
