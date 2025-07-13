"use client";

import { useState, useRef, RefObject } from "react";
import type { CSSProperties } from "react";
import ContactTab from "@/components/alumni/ContactTab";
import ContactPanel from "@/components/alumni/ContactPanel";

interface ContactOverlayProps {
  email?: string;
  website?: string;
  socials?: string[];
  profileCardRef: RefObject<HTMLDivElement | null>;
}

export default function ContactOverlay({
  email,
  website,
  socials = [],
  profileCardRef,
}: ContactOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tabRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const hasContactInfo = !!(email || website || socials.length > 0);
  if (!hasContactInfo) return null;

  const panelWidth = 240; // approximate panel width
  const tabWidth = 48; // actual width of your tab

const tabStyle: CSSProperties = {
  position: "absolute",
  top: "120px",
  right: `-${tabWidth}px`, // sticks out beyond the container
  zIndex: 1000,
};

const panelStyle: CSSProperties = {
  position: "absolute",
  top: "120px",
  right: "0px", // aligns perfectly with the edge
  height: "160px",
  display: "flex",
  alignItems: "center",
  backgroundColor: "#E2725B",
  borderRadius: "16px 0 0 16px",
  boxShadow: "6px 6px 10px rgba(0, 0, 0, 0.35)",
  padding: "0 1rem",
  whiteSpace: "nowrap",
  zIndex: 999,
};


  return (
    <>
      {/* 📌 Contact Tab */}
      <div ref={tabRef} style={tabStyle}>
        <ContactTab
          email={email}
          website={website}
          socials={socials}
          isOpen={isOpen}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
        />
      </div>

      {/* 📭 Contact Panel */}
      {isOpen && (
        <div ref={panelRef} style={panelStyle}>
          <ContactPanel
            email={email}
            website={website}
            socials={socials}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </>
  );
}
