"use client";

import { useEffect, useRef, useState } from "react";
import ContactTab from "@/components/alumni/ContactTab";
import ContactPanel from "@/components/alumni/ContactPanel";

interface ContactWidgetProps {
  email?: string;
  website?: string;
  socials?: string[];
}

export default function ContactWidget({
  email,
  website,
  socials = [],
}: ContactWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hasContactInfo = !!(email || website || socials.length > 0);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!hasContactInfo) return null;

  return (
    <div
      ref={wrapperRef}
      style={{
        position: "fixed",
        top: "360px",
        right: 20,
        zIndex: 9999,
        display: "flex",
        alignItems: "stretch",
        pointerEvents: "auto",
      }}
    >
      {/* Contact panel */}
      {isOpen && (
  <div
    style={{
  backgroundColor: "#E2725B", // Coral
  padding: "0.75rem 1rem",
  fontFamily: "'Space Grotesk', sans-serif",
  color: "black",
  borderTopLeftRadius: "0.5rem",
  borderBottomLeftRadius: "0.5rem",
  maxHeight: "160px", // optional
  boxShadow: "1px 2px 4px rgba(0,0,0,0.15)", // ✅ Added shadow
}}
  >
    <ContactPanel email={email} website={website} socials={socials} />
  </div>
)}

      {/* Contact tab */}
      <div onClick={() => setIsOpen((prev) => !prev)}>
        <ContactTab email={email} website={website} socials={socials} />
      </div>
    </div>
  );
}
