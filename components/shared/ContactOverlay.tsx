"use client";


import { useEffect, useRef, useState } from "react";
import ContactTab from "../alumni/ContactTab";
import ContactPanel from "../alumni/ContactPanel";

interface ContactOverlayProps {
  email?: string;
  website?: string;
  socials?: string[];
}

export default function ContactOverlay({
  email,
  website,
  socials = [],
}: ContactOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tabRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const justOpenedRef = useRef(false);

  const hasContactInfo = !!(email || website || socials.length > 0);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        justOpenedRef.current = true;
        setTimeout(() => {
          justOpenedRef.current = false;
        }, 200);
      }
      return next;
    });
  };

  // Escape and outside click
  useEffect(() => {
    const handleInteraction = (event: MouseEvent | KeyboardEvent) => {
      const target = event.target as Node;
      const clickedOutside =
        panelRef.current &&
        !panelRef.current.contains(target) &&
        tabRef.current &&
        !tabRef.current.contains(target);

      const pressedEscape = event instanceof KeyboardEvent && event.key === "Escape";

      if ((pressedEscape || clickedOutside) && !justOpenedRef.current) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleInteraction);
    document.addEventListener("keydown", handleInteraction);
    return () => {
      document.removeEventListener("mousedown", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };
  }, []);

  if (!hasContactInfo) return null;

  return (
    <>
      {/* Floating Tab */}
      <div
        ref={tabRef}
        className="absolute"
        style={{
          top: "120px",
          right: -48,
          zIndex: 80,
          pointerEvents: "auto",
        }}
      >
        <ContactTab
          email={email}
          website={website}
          socials={socials}
          isOpen={isOpen}
          onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  e.stopPropagation();

  setIsOpen((prev) => {
    const next = !prev;

    if (next) {
      justOpenedRef.current = true;
      setTimeout(() => {
        justOpenedRef.current = false;
      }, 200);
    }

    return next;
  });
}}

        />
      </div>

      {/* Floating Panel */}
      <div
        ref={panelRef}
        className="absolute"
        style={{
          top: "120px",
          right: "48px",
          width: "272px",
          zIndex: 70,
          display: isOpen ? "block" : "none",
        }}
      >
        <ContactPanel
          email={email}
          website={website}
          socials={socials}
          onClose={() => setIsOpen(false)}
        />
      </div>
    </>
  );
}
