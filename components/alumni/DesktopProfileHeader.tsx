"use client";

import { useState, useEffect, useRef, useMemo } from "react"; // useMemo still used for titleLinks/locationHref
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { getLocationHrefForToken, normalizeLocation } from "@/lib/locations";
import ScaledName from "@/components/shared/NameStack"; // default export; alias name is fine
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
  // AbortController so any in-flight gallery fetch is cancelled when this
  // component unmounts. ProfileCard passes key={alumniId} so a full remount
  // (and therefore a fresh fetch) happens on every profile navigation.
  const fetchAbortRef = useRef<AbortController | null>(null);

  const fallbackImage = "/images/default-headshot.png";

  // imageSrc starts as the server-provided headshot (Squarespace URL or
  // currentHeadshotId-derived URL). The mount effect may update it to the
  // isCurrent item from Profile-Media once that fetch resolves.
  const [imageSrc, setImageSrc] = useState(
    () => headshotUrl ? headshotUrl.replace(/^http:\/\//i, "https://") : fallbackImage
  );

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

  const nameParts = name.trim().split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || nameParts[0];
  const lastName = nameParts.slice(-1).join(" ") || "";

  function openHeadshotGallery() {
    // Gallery is pre-populated by the mount fetch; fall back to current
    // headshot only if the fetch hasn't resolved yet.
    if (!galleryUrls.length) {
      const current = imageSrc.trim();
      if (current) setGalleryUrls([current]);
    }
    setModalOpen(true);
  }


  const profileCardRef = useRef<HTMLDivElement>(null);
  const hasContactInfo = !!(publicEmail || website || (socials && socials.length > 0));

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
  const secondLocationHref = secondLocation ? getLocationHrefForToken(secondLocation) : null;
  const displayLocation = location ? (normalizeLocation(location) ?? location) : null;
  const displaySecondLocation = secondLocation ? (normalizeLocation(secondLocation) ?? secondLocation) : null;

  // Extra prefetching: when the header is visible, prefetch all target pages.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      // Fallback: just prefetch immediately
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

  return (
    <div ref={profileCardRef} style={{ position: "relative" }}>
      {hasContactInfo && (
        <ContactOverlay
          name={name}
          slug={slug}
          publicEmail={publicEmail}
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
            fontFamily='var(--font-dm-sans), system-ui, sans-serif'
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
        className="absolute top-0 left-[1.5rem] sm:left-4 z-40 w-[360px] h-[450px] overflow-hidden bg-[#241123] shadow-[6px_8px_20px_rgba(0,0,0,0.25)] cursor-pointer"
        onClick={openHeadshotGallery}
        role="button"
        tabIndex={0}
        aria-label="Open headshot"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            openHeadshotGallery();
          }
        }}

      >
        <Image
          src={imageSrc}
          alt={`${name}'s headshot`}
          fill
          placeholder="blur"
          blurDataURL={fallbackImage}
          priority
          style={{
            objectFit: "cover",
            objectPosition: "top center",
          }}
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

        {(titleLinks.length > 0 || currentTitle || location) && (
          <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>

            {/* ── Row 1 ──────────────────────────────────────────────────────────
                When currentTitle exists: show it BIG — this is their primary identity.
                When no currentTitle: show DAT role links big (unchanged behavior).
            ─────────────────────────────────────────────────────────────────── */}
            {currentTitle ? (
              <div
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "1.7rem",
                  color: "#241123",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  fontWeight: 700,
                  lineHeight: 1.15,
                }}
              >
                {currentTitle}
              </div>
            ) : (
              titleLinks.length > 0 && (
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
                          onMouseEnter={(e) => {
                            e.currentTarget.style.letterSpacing = "4.5px";
                            e.currentTarget.style.paddingRight = "0";
                            e.currentTarget.style.color = "#6C00AF";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.letterSpacing = "2px";
                            e.currentTarget.style.paddingRight = "1rem";
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
                </div>
              )
            )}

            {/* ── Row 2 ──────────────────────────────────────────────────────────
                When currentTitle is present: ONE compact line merging the DAT
                container (badge + role) and location. Keeps the header clean.
                When no currentTitle: show location the standard way below the
                big DAT role links (unchanged behavior).
            ─────────────────────────────────────────────────────────────────── */}
            {currentTitle ? (
              (titleLinks.length > 0 || location) && (
                <div
                  className="flex flex-row items-center flex-wrap"
                  style={{ gap: "0.55rem", marginTop: "0.55rem" }}
                >
                  {/* DAT container: badge + role(s) as one connected unit, no dot separator */}
                  {titleLinks.length > 0 && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        backgroundColor: "#241123",
                        padding: "3px 10px 3px 9px",
                        borderRadius: "4px",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                          fontSize: "0.7rem",
                          letterSpacing: "3px",
                          fontWeight: 900,
                          color: "#ffcc00",
                          textTransform: "uppercase",
                        }}
                      >
                        DAT
                      </span>
                      {titleLinks.map(({ label, href }, idx) => (
                        <span key={`${href}-${label}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                          {idx > 0 && (
                            <span style={{ color: "#ffcc00", opacity: 0.35, fontSize: "0.65rem", fontWeight: 400 }} aria-hidden>–</span>
                          )}
                          <Link
                            href={href}
                            prefetch
                            className="no-underline hover:no-underline inline-block"
                            style={{
                              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                              fontSize: "0.8rem",
                              color: "#ffcc00",
                              opacity: 0.75,
                              textTransform: "uppercase",
                              letterSpacing: "2px",
                              fontWeight: 700,
                              paddingRight: "0.4rem",
                              transition: "letter-spacing 0.2s ease, padding-right 0.2s ease, color 0.2s ease, opacity 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.letterSpacing = "3.5px";
                              e.currentTarget.style.paddingRight = "0";
                              e.currentTarget.style.color = "#6C00AF";
                              e.currentTarget.style.opacity = "1";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.letterSpacing = "2px";
                              e.currentTarget.style.paddingRight = "0.4rem";
                              e.currentTarget.style.color = "#ffcc00";
                              e.currentTarget.style.opacity = "0.75";
                            }}
                            aria-label={`View ${label}`}
                          >
                            {label}
                          </Link>
                        </span>
                      ))}
                    </span>
                  )}

                  {/* Dot separator between DAT container and location */}
                  {titleLinks.length > 0 && location && (
                    <span style={{ color: "#241123", opacity: 0.35, fontSize: "1rem", flexShrink: 0 }} aria-hidden>·</span>
                  )}

                  {/* Location — no prefix text, pipe separator for multi-city */}
                  {location && (
                    secondLocation ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                        {locationHref ? (
                          <Link href={locationHref} prefetch className="no-underline hover:no-underline inline-block"
                            style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "1.05rem", color: "#241123", fontWeight: 700, letterSpacing: "1.5px", opacity: 0.5, textTransform: "uppercase", paddingRight: "0.3rem", transition: "letter-spacing 0.2s ease, padding-right 0.2s ease, color 0.2s ease, opacity 0.2s ease" }}
                            aria-label={`View artists based in ${displayLocation}`}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; e.currentTarget.style.opacity = "1"; e.currentTarget.style.letterSpacing = "2.5px"; e.currentTarget.style.paddingRight = "0"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; e.currentTarget.style.opacity = "0.5"; e.currentTarget.style.letterSpacing = "1.5px"; e.currentTarget.style.paddingRight = "0.3rem"; }}
                          >{displayLocation?.toUpperCase()}</Link>
                        ) : (
                          <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "1.05rem", color: "#241123", fontWeight: 700, letterSpacing: "1.5px", opacity: 0.5, textTransform: "uppercase" }}>{displayLocation?.toUpperCase()}</span>
                        )}
                        <span style={{ color: "#241123", opacity: 0.3, fontSize: "1rem", fontWeight: 300 }}>|</span>
                        {secondLocationHref ? (
                          <Link href={secondLocationHref} prefetch className="no-underline hover:no-underline inline-block"
                            style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "1.05rem", color: "#241123", fontWeight: 700, letterSpacing: "1.5px", opacity: 0.5, textTransform: "uppercase", paddingRight: "0.3rem", transition: "letter-spacing 0.2s ease, padding-right 0.2s ease, color 0.2s ease, opacity 0.2s ease" }}
                            aria-label={`View artists based in ${displaySecondLocation}`}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; e.currentTarget.style.opacity = "1"; e.currentTarget.style.letterSpacing = "2.5px"; e.currentTarget.style.paddingRight = "0"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; e.currentTarget.style.opacity = "0.5"; e.currentTarget.style.letterSpacing = "1.5px"; e.currentTarget.style.paddingRight = "0.3rem"; }}
                          >{displaySecondLocation?.toUpperCase()}</Link>
                        ) : (
                          <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "1.05rem", color: "#241123", fontWeight: 700, letterSpacing: "1.5px", opacity: 0.5, textTransform: "uppercase" }}>{displaySecondLocation?.toUpperCase()}</span>
                        )}
                      </span>
                    ) : (
                      locationHref ? (
                        <Link href={locationHref} prefetch className="no-underline hover:no-underline inline-block"
                          style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "1.05rem", color: "#241123", fontWeight: 700, letterSpacing: "1.5px", opacity: 0.5, textTransform: "uppercase", paddingRight: "0.3rem", transition: "letter-spacing 0.2s ease, padding-right 0.2s ease, color 0.2s ease, opacity 0.2s ease" }}
                          aria-label={`View artists based in ${displayLocation}`}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; e.currentTarget.style.opacity = "1"; e.currentTarget.style.letterSpacing = "2.5px"; e.currentTarget.style.paddingRight = "0"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; e.currentTarget.style.opacity = "0.5"; e.currentTarget.style.letterSpacing = "1.5px"; e.currentTarget.style.paddingRight = "0.3rem"; }}
                        >{displayLocation?.toUpperCase()}</Link>
                      ) : (
                        <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "1.05rem", color: "#241123", fontWeight: 700, letterSpacing: "1.5px", opacity: 0.5, textTransform: "uppercase" }}>{displayLocation?.toUpperCase()}</span>
                      )
                    )
                  )}
                </div>
              )
            ) : (
              /* ── No currentTitle: location below the big DAT role links ── */
              location && (
                <div style={{ marginTop: "0.4rem", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.4rem" }}>
                  {secondLocation ? (
                    <>
                      {locationHref ? (
                        <Link href={locationHref} prefetch className="no-underline hover:no-underline inline-block"
                          style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "1.2rem", color: "#241123", fontWeight: 700, letterSpacing: "2px", opacity: 0.5, textTransform: "uppercase", paddingRight: "0.5rem", transition: "letter-spacing 0.2s ease, padding-right 0.2s ease, color 0.2s ease, opacity 0.2s ease" }}
                          aria-label={`View artists based in ${displayLocation}`}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; e.currentTarget.style.opacity = "1"; e.currentTarget.style.letterSpacing = "3.5px"; e.currentTarget.style.paddingRight = "0"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; e.currentTarget.style.opacity = "0.5"; e.currentTarget.style.letterSpacing = "2px"; e.currentTarget.style.paddingRight = "0.5rem"; }}
                        >{displayLocation?.toUpperCase()}</Link>
                      ) : (
                        <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "1.2rem", color: "#241123", fontWeight: 700, letterSpacing: "2px", opacity: 0.5, textTransform: "uppercase" }}>{displayLocation?.toUpperCase()}</span>
                      )}
                      <span style={{ color: "#241123", opacity: 0.3, fontSize: "1.1rem", fontWeight: 300 }}>|</span>
                      {secondLocationHref ? (
                        <Link href={secondLocationHref} prefetch className="no-underline hover:no-underline inline-block"
                          style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "1.2rem", color: "#241123", fontWeight: 700, letterSpacing: "2px", opacity: 0.5, textTransform: "uppercase", paddingRight: "0.5rem", transition: "letter-spacing 0.2s ease, padding-right 0.2s ease, color 0.2s ease, opacity 0.2s ease" }}
                          aria-label={`View artists based in ${displaySecondLocation}`}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; e.currentTarget.style.opacity = "1"; e.currentTarget.style.letterSpacing = "3.5px"; e.currentTarget.style.paddingRight = "0"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; e.currentTarget.style.opacity = "0.5"; e.currentTarget.style.letterSpacing = "2px"; e.currentTarget.style.paddingRight = "0.5rem"; }}
                        >{displaySecondLocation?.toUpperCase()}</Link>
                      ) : (
                        <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "1.2rem", color: "#241123", fontWeight: 700, letterSpacing: "2px", opacity: 0.5, textTransform: "uppercase" }}>{displaySecondLocation?.toUpperCase()}</span>
                      )}
                    </>
                  ) : (
                    locationHref ? (
                      <Link href={locationHref} prefetch className="no-underline hover:no-underline inline-block"
                        style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "1.2rem", color: "#241123", fontWeight: 700, letterSpacing: "2px", opacity: 0.5, textTransform: "uppercase", paddingRight: "0.5rem", transition: "letter-spacing 0.2s ease, padding-right 0.2s ease, color 0.2s ease, opacity 0.2s ease" }}
                        aria-label={`View artists based in ${displayLocation}`}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; e.currentTarget.style.opacity = "1"; e.currentTarget.style.letterSpacing = "3.5px"; e.currentTarget.style.paddingRight = "0"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#241123"; e.currentTarget.style.opacity = "0.5"; e.currentTarget.style.letterSpacing = "2px"; e.currentTarget.style.paddingRight = "0.5rem"; }}
                      >{displayLocation?.toUpperCase()}</Link>
                    ) : (
                      <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "1.2rem", color: "#241123", fontWeight: 700, letterSpacing: "2px", opacity: 0.5, textTransform: "uppercase" }}>{displayLocation?.toUpperCase()}</span>
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
          images={(
            galleryUrls && galleryUrls.length
              ? galleryUrls
              : [imageSrc]
          ).filter(Boolean)}
          startIndex={currentHeadshotIndex}
          onClose={() => {
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
