"use client";

import { useState, useLayoutEffect, useEffect, useRef } from "react";
import Link from "next/link";
import NameStack from "@/components/shared/NameStack";
import LocationBadge from "@/components/shared/LocationBadge";
import ShareButton from "@/components/ui/ShareButton";
import Lightbox from "@/components/shared/Lightbox";
import ContactOverlay from "@/components/shared/ContactOverlay";
import StatusFlags from "@/components/alumni/StatusFlags";

interface DesktopProfileHeaderProps {
  name: string;
  role: string;
  location?: string;
  headshotUrl?: string;
  statusFlags?: string[];
  email?: string;
  website?: string;
  socials?: string[];
}

const scaleCache = new Map<string, { first: number; last: number }>();

export default function DesktopProfileHeader({
  name,
  role,
  location,
  headshotUrl,
  statusFlags = [],
  email,
  website,
  socials,
}: DesktopProfileHeaderProps) {
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

  const fallbackImage = "/images/default-headshot.png";
  const profileCardRef = useRef<HTMLDivElement>(null);
  const hasContactInfo = !!(email || website || (socials && socials.length > 0));

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
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
    clipPath: "inset(0px -9999px -9999px -9999px)", // ✅ Top clipped only
  }}
>
  <StatusFlags
    flags={statusFlags}
    fontSize="1.75rem"
    fontFamily='"DM Sans", sans-serif'
    textColor="#F6E4C1"
    borderRadius="33px"
  />
</div>

      )}

      <div className="absolute z-40" style={{ top: "1rem", right: "1rem" }}>
        <ShareButton url={currentUrl} />
      </div>

      <div
        className="absolute top-0 left-[1.5rem] sm:left-4 z-40"
        style={{
          width: "360px",
          height: "450px",
          boxShadow: "6px 8px 20px rgba(0,0,0,0.25)",
          backgroundColor: "#241123",
          cursor: "pointer",
        }}
        onClick={() => setModalOpen(true)}
      >
        <img
          src={headshotUrl || fallbackImage}
          alt={`${name}'s headshot`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      </div>

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
        <NameStack
          firstName={firstName}
          lastName={lastName}
          firstNameRef={firstNameRef}
          lastNameRef={lastNameRef}
          firstScale={firstScale}
          lastScale={lastScale}
          hasMeasured={hasMeasured}
          nameFontFamily="Anton, sans-serif"
          nameFontSize="4.5rem"
          nameColor="#F6E4C1"
          letterSpacing="5px"
          textTransform="uppercase"
          textAlign="left"
        />

       {(role || location) && (
  <div
    className="flex flex-row items-center flex-wrap gap-x-6 gap-y-2"
    style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}
  >
    {/* Role (Original Behavior) */}
    {role && (
      <Link
        href={`/role/${role.toLowerCase().replace(/\s+/g, "-")}`}
        className="no-underline hover:no-underline transition-all duration-200"
        style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: "1.7rem",
          color: "#241123",
          textTransform: "uppercase",
          letterSpacing: "2px",
          fontWeight: 700,
          opacity: 0.9, // ✅ Original look
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scaleX(1.05)";
          e.currentTarget.style.color = "#6C00AF"; // ✅ Purple
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scaleX(1)";
          e.currentTarget.style.color = "#241123"; // ✅ Back to original
        }}
      >
        {role}
      </Link>
    )}

    {/* Divider */}
    {role && location && (
      <span
        style={{
          fontSize: "1.2rem",
          color: "#241123",
          padding: "0 14px",
          opacity: 0.5,
        }}
      >
        •
      </span>
    )}

    {/* Location (Fixed + Original Colors + Hover Purple) */}
    {location && (
      <Link
        href={`/location/${location.toLowerCase().replace(/\s+/g, "-")}`}
        className="no-underline hover:no-underline transition-all duration-200"
        style={{
          fontFamily: "DM Sans, sans serif",
          fontSize: "1.2rem",
          color: "#241123", // ✅ Base color
          fontWeight: 900,
          letterSpacing: "2px",
          opacity: 0.5, // ✅ Original muted look
          display: "inline-block",
          paddingRight: "2rem", // ✅ Prevent overflow on hover scale
        }}
      >
        <span
          className="inline-block transition-transform duration-200"
          style={{ transformOrigin: "left" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scaleX(1.05)";
            e.currentTarget.parentElement!.style.color = "#6C00AF"; // ✅ Purple
            e.currentTarget.parentElement!.style.opacity = "1"; // ✅ Full opacity on hover
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scaleX(1)";
            e.currentTarget.parentElement!.style.color = "#241123"; // ✅ Back to original
            e.currentTarget.parentElement!.style.opacity = "0.5"; // ✅ Muted again
          }}
        >
          Based in <span style={{ textTransform: "uppercase" }}>{location}</span>
        </span>
      </Link>
    )}
  </div>
)}
  </div>

      {isModalOpen && (
        <Lightbox
          images={[headshotUrl || fallbackImage]}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
