"use client";

import { useEffect, useRef } from "react";

interface ContactPanelProps {
  email?: string;
  website?: string;
  socials?: string[];
  onClose: () => void;
}

export default function ContactPanel({
  email,
  website,
  socials = [],
  onClose,
}: ContactPanelProps) {
  const linkClasses =
    "flex items-center text-sm font-normal text-black transition-all duration-200 hover:tracking-[0.025em] hover:text-[#6C00AF] visited:text-black";

  const hasLinks = email || website || socials.length > 0;
  const panelRef = useRef<HTMLDivElement>(null);

  const Arrow = () => (
    <span style={{ fontSize: "0.85rem", paddingRight: "0.5rem" }}>➤</span>
  );

  // Escape key closes
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Click outside closes
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="flex flex-col justify-center"
      style={{
        height: "100%",
        padding: "1rem 1.5rem",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        backgroundColor: "#E2725B",
        borderTopLeftRadius: "12px",
        borderBottomLeftRadius: "12px",
        color: "#21223",
        wordBreak: "break-word",
      }}
    >
      {hasLinks && (
        <>
          <div
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 700,
              fontSize: "1.8rem",
              lineHeight: "2.2rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#241123",
              marginBottom: "0.5rem",
            }}
          >
            Let’s Connect
          </div>

          <div className="flex flex-col gap-1">
            {email && (
              <a
                href={`mailto:${email}`}
                className={linkClasses}
                style={{ textDecoration: "none" }}
              >
                <Arrow />
                <span>{email}</span>
              </a>
            )}

            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClasses}
                style={{ textDecoration: "none" }}
              >
                <Arrow />
                <span>{website}</span>
              </a>
            )}

            {socials.map((social, i) => (
              <a
                key={i}
                href={social}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClasses}
                style={{ textDecoration: "none" }}
              >
                <Arrow />
                <span>{social}</span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
