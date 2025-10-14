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

  const nameParts = name.trim().split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || nameParts[0];
  const lastName = nameParts.slice(-1).join(" ") || "";

  const fallbackImage = "/images/default-headshot.png";
  const imageSrc = useMemo(
    () => (headshotUrl ? headshotUrl.replace(/^http:\/\//i, "https://") : fallbackImage),
    [headshotUrl]
  );

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
        onClick={() => setModalOpen(true)}
        role="button"
        tabIndex={0}
        aria-label="Open headshot"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setModalOpen(true);
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
          images={[imageSrc]}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
