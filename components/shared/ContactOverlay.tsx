"use client";

import { useEffect, useRef, useState } from "react";

interface ContactOverlayProps {
  email?: string;
  website?: string;
  socials?: string[];
}

export default function ContactOverlay({ email, website, socials = [] }: ContactOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Open overlay if URL has #contact
  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkHash = () => setIsOpen(window.location.hash === "#contact");
      checkHash();
      window.addEventListener("hashchange", checkHash);
      return () => window.removeEventListener("hashchange", checkHash);
    }
  }, []);

  // Close overlay on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        window.history.replaceState(null, "", window.location.pathname);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Close when clicking outside modal content
  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      setIsOpen(false);
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleClickOutside}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
    >
      <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md w-full text-center">
        <h2 className="text-xl font-semibold mb-4">Contact</h2>

        {email && (
          <p className="mb-2">
            <a href={`mailto:${email}`} className="text-blue-600 underline">
              {email}
            </a>
          </p>
        )}

        {website && (
          <p className="mb-2">
            <a href={website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              {website}
            </a>
          </p>
        )}

        {socials.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {socials.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 underline"
              >
                {url.replace(/^https?:\/\//, "")}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
