"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  const imageSrc = useMemo(
    () => (headshotUrl ? headshotUrl.replace(/^http:\/\//i, "https://") : fallbackImage),
    [headshotUrl]
  );

  const [displayHeadshotSrc, setDisplayHeadshotSrc] = useState<string>(imageSrc);

  useEffect(() => {
    setDisplayHeadshotSrc(imageSrc);
  }, [imageSrc]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateMostRecentHeadshot() {
      try {
        const qs = new URLSearchParams({ alumniId, kind: "headshot", limit: "1" });
        const r = await fetch(`/api/alumni/media/list?${qs.toString()}`, { cache: "no-store" });
        const j = await r.json();
        const it = (j?.items || [])[0];
        if (!it) return;

        const fid = String(it?.fileId || "").trim();
        const ext = String(it?.externalUrl || "").trim();

        // Prefer externalUrl if present; otherwise Drive.
        const top = ext || (fid ? `https://drive.google.com/uc?export=view&id=${fid}` : "");
        if (!top) return;
        if (cancelled) return;

        setDisplayHeadshotSrc(top);
      } catch {
        // non-fatal
      }
    }

    if (alumniId) hydrateMostRecentHeadshot();

    return () => {
      cancelled = true;
    };
  }, [alumniId]);


  const headerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const galleryCacheRef = useRef<string[] | null>(null);
  const openingRef = useRef(false);

  useEffect(() => {
    // If the profile headshot changes, the lightbox cache is stale
    galleryCacheRef.current = null;
    setGalleryUrls([]);
  }, [displayHeadshotSrc]);

  async function openHeadshotGallery() {
    const current = (displayHeadshotSrc ?? imageSrc) as string;

    // open instantly with whatever the profile is currently displaying
    setGalleryUrls((prev) => (prev?.length ? prev : [current].filter(Boolean) as string[]));
    setModalOpen(true);

    // If we already have urls AND they include the currently displayed headshot,
    // just open with the cached gallery (no refetch).
    if (galleryCacheRef.current && galleryCacheRef.current.length > 0 && galleryCacheRef.current.includes(current)) {
      setGalleryUrls(galleryCacheRef.current);
      return;
    }


    if (openingRef.current) return;
    openingRef.current = true;

    try {
      const qs = new URLSearchParams({ alumniId, kind: "headshot" });
      const r = await fetch(`/api/alumni/media/list?${qs.toString()}`, { cache: "no-store" });
      const j = await r.json();
      
const rawItems = (j?.items || []) as any[];

// Prioritize MOST RECENT (regardless of source)
const ordered = [...rawItems].sort((a, b) => {
  const ta = Date.parse(String(a?.uploadedAt || "")) || 0;
  const tb = Date.parse(String(b?.uploadedAt || "")) || 0;
  if (tb !== ta) return tb - ta;

  const sa = Number.isFinite(Number(a?.sortIndex)) ? Number(a.sortIndex) : Number.POSITIVE_INFINITY;
  const sb = Number.isFinite(Number(b?.sortIndex)) ? Number(b.sortIndex) : Number.POSITIVE_INFINITY;
  if (sa !== sb) return sa - sb;

  return String(b?.fileId || "").localeCompare(String(a?.fileId || ""));
});

const urls =
  ordered
    .map((it: any) => {
      const fid = String(it?.fileId || "").trim();
      if (fid) return `https://drive.google.com/uc?export=view&id=${fid}`;

      const ext = String(it?.externalUrl || "").trim();
      if (ext) return ext;

      return "";
    })
    .filter(Boolean);


      const fallback = ([displayHeadshotSrc ?? imageSrc].filter(Boolean)) as string[];
      const next = (urls.length ? urls : fallback).filter(Boolean);

      if (!next.length) return;

      galleryCacheRef.current = next;
      setGalleryUrls(next);
      setModalOpen(true);

    } catch {
      const fallback = ([displayHeadshotSrc ?? imageSrc].filter(Boolean)) as string[];
      if (!fallback.length) return;

      galleryCacheRef.current = fallback;
      setGalleryUrls(fallback);
      setModalOpen(true);
    } finally {
      openingRef.current = false;
    }
  }


  useEffect(() => {
    setCurrentUrl(window.location.href);
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
          src={displayHeadshotSrc}
          alt={`${name}'s headshot`}
          fill
          placeholder="blur"
          blurDataURL={fallbackImage}
          loading="lazy"
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
          images={(galleryUrls && galleryUrls.length ? galleryUrls : [imageSrc]).filter(Boolean)}
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
