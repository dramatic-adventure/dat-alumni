"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { getLocationHrefForToken } from "@/lib/locations";
import ScaledName from "@/components/shared/NameStack"; // default export; alias name is fine
import LocationBadge from "@/components/shared/LocationBadge";
import ShareButton from "@/components/ui/ShareButton";
import Lightbox from "@/components/shared/Lightbox";
import ContactOverlay from "@/components/shared/ContactOverlay";
import StatusFlags from "@/components/alumni/StatusFlags";
import { splitTitles, slugifyTitle, bucketsForTitleToken } from "@/lib/titles";

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
  const [currentUrl, setCurrentUrl] = useState("");

  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const galleryCacheRef = useRef<string[] | null>(null);
  const openingRef = useRef(false);

  const fallbackImage = "/images/default-headshot.png";

  const imageSrc = useMemo(
    () => (headshotUrl ? headshotUrl.replace(/^http:\/\//i, "https://") : fallbackImage),
    [headshotUrl]
  );

  


  const nameParts = name.trim().split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || nameParts[0];
  const lastName = nameParts.slice(-1).join(" ") || "";

  const [displayHeadshotSrc, setDisplayHeadshotSrc] = useState<string>(imageSrc);

  useEffect(() => {
  if (typeof window === "undefined") return;
  const src = (displayHeadshotSrc || "").trim();
  if (!src) return;

  const img = new window.Image();
  img.decoding = "async";
  img.loading = "eager";
  img.src = src;
}, [displayHeadshotSrc]);

  // Keep displayed headshot aligned with prop fallback until hydration overrides it
  useEffect(() => {
    setDisplayHeadshotSrc(imageSrc);
  }, [imageSrc]);


    useEffect(() => {
    let cancelled = false;

    const toUrl = (it: any): string => {
      const fid = String(it?.fileId || "").trim();
      if (fid) return `/api/img?fileId=${encodeURIComponent(fid)}`;

      const ext = String(it?.externalUrl || "").trim();
      if (ext) return `/api/img?url=${encodeURIComponent(ext)}`;

      return "";
    };


    const toTime = (it: any): number => {
      // "uploadedAt" primary, then a few sensible fallbacks
      const raw =
        it?.uploadedAt ??
        it?.createdAt ??
        it?.updatedAt ??
        it?.ts ??
        it?.timestamp ??
        "";

      const n = typeof raw === "number" ? raw : Date.parse(String(raw));
      return Number.isFinite(n) ? n : 0;
    };

    const orderMostRecent = (items: any[]) =>
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

        // stable tie-breaker
        return String(b?.fileId || b?.externalUrl || "").localeCompare(
          String(a?.fileId || a?.externalUrl || "")
        );
      });

    async function hydrateHeadshots() {
      try {
        const qs = new URLSearchParams({ alumniId, kind: "headshot" });
        const r = await fetch(`/api/alumni/media/list?${qs.toString()}`)
        const j = await r.json();
        const rawItems = (j?.items || []) as any[];

        const ordered = orderMostRecent(rawItems);
        const urls = ordered.map(toUrl).filter(Boolean);

        // Pick THE single most recent headshot URL (regardless of source)
        const top = urls[0] || "";
        if (!cancelled && top) setDisplayHeadshotSrc(top);

        // Also seed the lightbox cache with the same ordering
        if (!cancelled && urls.length) {
          galleryCacheRef.current = Array.from(new Set(urls));
        }
      } catch {
        // non-fatal
      }
    }

    if (alumniId) hydrateHeadshots();

    return () => {
      cancelled = true;
    };
  }, [alumniId]);

  useEffect(() => {
    if (!isModalOpen) return;

    const current = (displayHeadshotSrc || imageSrc || "").trim();
    if (!current) return;

    setGalleryUrls((prev) => {
      const rest = (prev || []).filter((u) => u && u !== current);
      return [current, ...rest];
    });
  }, [isModalOpen, displayHeadshotSrc, imageSrc]);

  async function openHeadshotGallery() {
    const current = (displayHeadshotSrc || imageSrc || "").trim();

    // Open instantly with whatever we're currently displaying
    setGalleryUrls((prev) => {
      if (prev?.length) {
        const rest = prev.filter((u) => u && u !== current);
        return current ? [current, ...rest] : prev;
      }
      return current ? [current] : [];
    });
    setModalOpen(true);

    // If we have a cache, use it immediately, but always force current to index 0
    if (galleryCacheRef.current && galleryCacheRef.current.length > 0) {
      const cached = galleryCacheRef.current.filter(Boolean);
      const rest = cached.filter((u) => u !== current);
      const next = current ? [current, ...rest] : cached;

      setGalleryUrls(next);
      return;
    }

    if (openingRef.current) return;
    openingRef.current = true;

    try {
      const qs = new URLSearchParams({ alumniId, kind: "headshot" });
      const r = await fetch(`/api/alumni/media/list?${qs.toString()}`)
      const j = await r.json();
      const rawItems = (j?.items || []) as any[];

      const toUrl = (it: any): string => {
        const fid = String(it?.fileId || "").trim();
        if (fid) return `/api/img?fileId=${encodeURIComponent(fid)}`;

        const ext = String(it?.externalUrl || "").trim();
        if (ext) return `/api/img?url=${encodeURIComponent(ext)}`;

        return "";
      };

      const toTime = (it: any): number => {
        const raw =
          it?.uploadedAt ??
          it?.createdAt ??
          it?.updatedAt ??
          it?.ts ??
          it?.timestamp ??
          "";
        const n = typeof raw === "number" ? raw : Date.parse(String(raw));
        return Number.isFinite(n) ? n : 0;
      };

      const ordered = [...rawItems].sort((a, b) => {
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
      });

      const urls = ordered.map(toUrl).filter(Boolean);

      // Build final gallery, always with current first; fallback to current if list empty
      const base = urls.length ? urls : (current ? [current] : []);
      const unique = Array.from(new Set(base));
      const rest = unique.filter((u) => u !== current);
      const next = current ? [current, ...rest] : unique;

      if (!next.length) return;

      galleryCacheRef.current = next;
      setGalleryUrls(next);
    } catch {
      // fallback: at least show the current displayed headshot
      if (current) {
        const next = [current];
        galleryCacheRef.current = next;
        setGalleryUrls(next);
      }
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
          src={displayHeadshotSrc}
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
          images={(
            galleryUrls && galleryUrls.length
              ? galleryUrls
              : [(displayHeadshotSrc || imageSrc || "").trim()]
          ).filter(Boolean)}
          onClose={() => {
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
