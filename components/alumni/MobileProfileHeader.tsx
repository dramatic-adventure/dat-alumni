"use client";

import { useRef, useLayoutEffect, useState, useEffect } from "react";
import Link from "next/link";
import NameStack from "@/components/shared/NameStack";
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
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  const nameParts = name.trim().split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || nameParts[0];
  const lastName = nameParts.slice(-1).join(" ") || "";

  const firstNameRef = useRef<HTMLDivElement>(null);
  const lastNameRef = useRef<HTMLDivElement>(null);

  const cached = scaleCache.get(name);
  const [firstScale, setFirstScale] = useState(cached?.first ?? 0.95);
  const [lastScale, setLastScale] = useState(cached?.last ?? 0.95);
  const [hasMeasured, setHasMeasured] = useState(!!cached);

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
    <div ref={headerRef} style={{ backgroundColor: "#C39B6C" }}>
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
  <div
    className="absolute top-1 right-[4rem] z-50"
    style={{
      clipPath: "inset(0px -9999px -9999px -9999px)", // ✅ Hide top overflow only
    }}
  >
    <StatusFlags
      flags={statusFlags}
      fontSize="1.15rem"
      fontFamily='"DM Sans", sans-serif'
      textColor="#F6E4C1"
      borderRadius="20px"
      className="gap-1"
      padding="1.6rem 0.5rem 0.5rem"
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

      {/* Profile Content */}
      <div
        style={{
          width: "90%",
          maxWidth: "360px", // ✅ Strict container
          margin: "0 auto",
          overflow: "hidden", // ✅ Prevents overflow
        }}
      >
        {/* Headshot */}
        <div
          className="cursor-pointer"
          style={{
            aspectRatio: "4 / 5",
            boxShadow: "6px 8px 20px rgba(0,0,0,0.25)",
            backgroundColor: "#241123",
            margin: "0 auto",
            width: "100%",
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
              display: "block",
            }}
          />
        </div>

        {/* NameStack */}
        <div
          style={{
            marginTop: "1.5rem",
            width: "100%",
            overflow: "hidden",
          }}
        >
          <NameStack
  firstName={firstName}
  lastName={lastName}
  containerWidth={320} // ✅ Ideal width for mobile
  gap="0.6rem"
/>
        </div>

        {/* Role & Location */}
{(role || location) && (
  <div
    className="flex flex-wrap justify-center items-center gap-x-3 mt-2"
    style={{
      marginBottom: "2rem",
      textAlign: "center",
      wordBreak: "break-word",
    }}
  >
    {/* ROLE */}
    {role && (
      <Link
        href={`/role/${role.toLowerCase().replace(/\s+/g, "-")}`}
        className="no-underline hover:no-underline transition-all duration-200"
        style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: "clamp(1rem, 4vw, 1.35rem)",
          color: "#241123",
          textTransform: "uppercase",
          letterSpacing: "2px",
          fontWeight: 800,
          opacity: 0.95,
          whiteSpace: "nowrap",
          display: "inline-block",
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
      >
        {role}
      </Link>
    )}

    {/* DOT */}
    {role && location && (
      <span
        style={{
          fontSize: "1rem",
          color: "#241123",
          padding: "0 10px",
          opacity: 0.5,
        }}
      >
        •
      </span>
    )}

    {/* LOCATION */}
    {location && (
      <span
        style={{
          fontFamily: "DM Sans, sans-serif",
          fontSize: "clamp(0.8rem, 3vw, 0.95rem)",
          fontWeight: 900,
          letterSpacing: "2px",
          opacity: 0.5,
          display: "inline-block",
          cursor: "pointer",
          transformOrigin: "left center", // ✅ Expands to the right
          transition:
            "transform 0.2s ease, color 0.2s ease, opacity 0.2s ease",
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
    )}
  </div>
)}
  </div>

      {/* Lightbox */}
      {isModalOpen && (
        <Lightbox
          images={[headshotUrl || fallbackImage]}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
