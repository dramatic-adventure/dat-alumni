"use client";

import { useRef, useLayoutEffect, useState, useEffect } from "react";
import Link from "next/link";
import NameStack from "@/components/shared/NameStack";
import LocationBadge from "@/components/shared/LocationBadge";
import StatusFlags from "@/components/alumni/StatusFlags";
import ShareButton from "@/components/ui/ShareButton";
import ContactOverlay from "@/components/shared/ContactOverlay";
import Lightbox from "@/components/shared/Lightbox";

const scaleCache = new Map<string, { first: number; last: number }>();

interface MobileProfileHeaderProps {
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
  const headerRef = useRef<HTMLDivElement>(null);

  const nameParts = name.trim().split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || nameParts[0];
  const lastName = nameParts.slice(-1).join(" ") || "";

  const firstNameRef = useRef<HTMLDivElement>(null);
  const lastNameRef = useRef<HTMLDivElement>(null);

  const cached = scaleCache.get(name);
  const [firstScale, setFirstScale] = useState(cached?.first ?? 0.95);
  const [lastScale, setLastScale] = useState(cached?.last ?? 0.95);
  const [hasMeasured, setHasMeasured] = useState(!!cached);
  const [currentUrl, setCurrentUrl] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  useLayoutEffect(() => {
    if (hasMeasured) return;
    const first = firstNameRef.current;
    const last = lastNameRef.current;
    if (first && last) {
      const firstWidth = first.scrollWidth;
      const lastWidth = last.scrollWidth;
      const widest = Math.max(firstWidth, lastWidth);
      const targetWidth = widest > 360 ? 360 : widest;
      const newFirstScale = targetWidth / firstWidth;
      const newLastScale = targetWidth / lastWidth;
      scaleCache.set(name, { first: newFirstScale, last: newLastScale });
      setFirstScale(newFirstScale);
      setLastScale(newLastScale);
      setHasMeasured(true);
    }
  }, [name, hasMeasured]);

  const hasContactInfo = !!(email || website || (socials && socials.length > 0));

  return (
    <div
      ref={headerRef}
    >
      {/* Contact Overlay */}
      {hasContactInfo && (
        <ContactOverlay
          email={email}
          website={website}
          socials={socials}
          profileCardRef={headerRef}
        />
      )}

      {/* Mobile Status Flags */}
{statusFlags.length > 0 && (
  <div className="absolute top-1 right-[4rem] z-50">
    <StatusFlags
  flags={statusFlags}
  fontSize="1.15rem"
  fontFamily='"DM Sans", sans-serif'
  textColor="#F6E4C1"
  borderRadius="20px"
  className="gap-1"
  padding="1.6rem 0.5rem 0.5rem" // 👈 smaller height for mobile
/>
  </div>
)}


      {/* Share Button */}
      <div
  role="share-button-wrapper"
  className="absolute z-40"
  style={{
    top: "1rem",
    right: "1rem",
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






      <div className="w-full px-4">
        {/* Headshot with modal trigger */}
        {headshotUrl || fallbackImage ? (
        <div
  className="absolute top-0 left-1/2 transform -translate-x-1/2 z-40" // ⬅ centers headshot
  style={{
    width: "336px",
    height: "420px",
    boxShadow: "6px 8px 20px rgba(0,0,0,0.25)",
    backgroundColor: "#241123",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
  }}
  onClick={() => setModalOpen(true)}
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") setModalOpen(true);
  }}
>
  <img
    src={headshotUrl || fallbackImage}
    alt={`${name}'s headshot`}
    loading="lazy"
    style={{
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "center",
    }}
  />
</div>
      ) : null}

        {/* Lightbox modal */}
        {isModalOpen && (
          <Lightbox
            images={[headshotUrl || fallbackImage]}
            onClose={() => setModalOpen(false)}
          />
        )}

        {/* Name */}
        <div
                style={{
                  backgroundColor: "#C39B6C",
                  color: "#F6E4C1",
                  textAlign: "center",
                  paddingLeft: "15px",
                  paddingRight: "15px",
                  paddingTop: "420px",
                  paddingBottom: "2rem",
                }}
              >
                <NameStack
                  firstName={firstName}
                  lastName={lastName}
                  firstNameRef={firstNameRef}
                  lastNameRef={lastNameRef}
                  firstScale={firstScale}
                  lastScale={lastScale}
                  hasMeasured={hasMeasured}
                  nameFontFamily="Anton, sans-serif"
                  nameFontSize="5.125rem"
                  nameColor="#F6E4C1"
                  letterSpacing="5px"
                  textTransform="uppercase"
                  textAlign="left"
                />

{(role || location) && (
  <div
    className="w-full flex justify-center items-center"
    style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}
  >
    <div className="flex items-center gap-x-3">
      {/* ROLE as link */}
      {role && (
        <Link
          href={`/role/${role.toLowerCase().replace(/\s+/g, "-")}`}
          className="no-underline hover:no-underline transition-all duration-200"
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "1.35rem",
            lineHeight: "1",
            color: "#241123",
            textTransform: "uppercase",
            letterSpacing: "2px",
            fontWeight: 800,
            opacity: 0.95,
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scaleX(1.05)";
            e.currentTarget.style.color = "#6C00AF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scaleX(1)";
            e.currentTarget.style.color = "#241123";
          }}
        >
          {role}
        </Link>
      )}

      {/* DOT */}
      {role && location && (
        <span
          style={{
            fontSize: "1rem",
            lineHeight: "1",
            color: "#241123",
            padding: "0 10px",
            opacity: 0.5,
            flexShrink: 0,
          }}
        >
          •
        </span>
      )}

      {/* LOCATION */}
      {location && (
        <div
          style={{
            position: "relative",
            display: "inline-block",
            lineHeight: "1",
            top: "1.5px", // nudges it to visually align with role
          }}
        >
          {/* Invisible clone to preserve layout space */}
          <span
            style={{
              visibility: "hidden",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "0.95rem",
              fontWeight: 900,
              letterSpacing: "2px",
              opacity: 0.5,
            }}
          >
            Based in {location.toUpperCase()}
          </span>

          {/* Absolutely positioned visible location */}
          <span
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              fontFamily: "DM Sans, sans-serif",
              fontSize: "0.95rem",
              fontWeight: 900,
              letterSpacing: "2px",
              opacity: 0.5,
              transformOrigin: "left center",
              whiteSpace: "nowrap",
              transition: "transform 0.3s ease, color 0.3s ease, opacity 0.3s ease",
              color: "#241123",
              cursor: "default",
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
        </div>
      )}
    </div>
  </div>
)}




      </div>
    </div>
  </div>
);
}
