"use client";

import { useState, useRef, RefObject, useEffect } from "react";
import type { CSSProperties } from "react";
import ContactTab from "@/components/alumni/ContactTab";
import ContactPanel from "@/components/alumni/ContactPanel";

interface ContactOverlayProps {
  name?: string;
  slug?: string;
  publicEmail?: string;
  website?: string;
  socials?: string[];
  profileCardRef: RefObject<HTMLDivElement | null>;
}

export default function ContactOverlay({
  name,
  slug,
  publicEmail,
  website,
  socials = [],
  profileCardRef,
}: ContactOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tabRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const emailSafe = String(publicEmail || "").trim();
  const websiteSafe = String(website || "").trim();
  const socialsSafe = (socials || []).map((s) => String(s || "").trim()).filter(Boolean);

  const hasContactInfo = !!emailSafe || !!websiteSafe || socialsSafe.length > 0;
  if (!hasContactInfo) return null;

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

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node | null;
      const panelEl = panelRef.current;
      const tabEl = tabRef.current;

      if (!target) return;
      if (panelEl && panelEl.contains(target)) return;
      if (tabEl && tabEl.contains(target)) return;

      setIsOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onDocMouseDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onDocMouseDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* 📌 Contact Tab */}
      <div ref={tabRef} style={tabStyle}>
        <ContactTab
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
            name={name}
            slug={slug}
            email={emailSafe}
            website={websiteSafe}
            socials={socialsSafe}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </>
  );
}