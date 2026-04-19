"use client";

import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";

interface ContactPanelProps {
  name?: string;
  slug?: string;
  email?: string;
  website?: string;
  socials?: string[];
  featuredLink?: { url: string; label: string };
  onClose: () => void;
}

// (intentionally no email-derived name helpers; we use name -> slug fallback only)

function firstNameFromSlugOrUnknown(slug?: string) {
  const s = String(slug || "").trim();
  if (!s) return "this alum";

  // "jesse-baxter" -> "Jesse", "lucia_siposova" -> "Lucia"
  const decoded = decodeURIComponent(s);
  const first = decoded
    .split(/[^\p{L}\p{N}]+/u) // split on non letters/numbers (unicode-safe)
    .filter(Boolean)[0];

  if (!first) return "this alum";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function EmailRow({
  email,
  name,
  slug,
  className,
  Arrow,
}: {
  email: string;
  name?: string;
  slug?: string;
  className: string;
  Arrow: () => ReactElement;
}) {
  const displayName = useMemo(() => {
    const n = String(name || "").trim();
    if (n) return n.split(/\s+/)[0] || "this alum";
    return firstNameFromSlugOrUnknown(slug);
  }, [name, slug]);

  return (
    <a
      href={`mailto:${email}`}
      className={className}
      style={{ textDecoration: "none" }}
      aria-label={`Email ${displayName}`}
    >
      <div className="flex items-center gap-1">
        <Arrow />
        <span>
          {`Email ${displayName}`}
        </span>
      </div>
    </a>
  );
}

function normalizeUrl(raw: string) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

function displayUrl(raw: string) {
  return String(raw || "").trim().replace(/^https?:\/\//i, "");
}

function normalizeSocialUrl(raw: string) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;

  // simple handle support: "@name" -> instagram profile
  if (s.startsWith("@")) return `https://instagram.com/${s.slice(1)}`;

  // if they paste "instagram.com/..." without scheme
  if (/^[a-z0-9.-]+\.[a-z]{2,}\//i.test(s)) return `https://${s}`;

  return s; // fall back (still clickable if it’s a valid scheme like "mailto:" etc.)
}

export default function ContactPanel({
  name,
  slug,
  email,
  website,
  socials = [],
  featuredLink,
  onClose,
}: ContactPanelProps) {
const linkClasses =
  "flex items-center text-sm font-normal text-black transition-all duration-200 hover:tracking-[0.08em] hover:text-[#6C00AF] visited:text-black";

  const emailSafe = String(email || "").trim();
  const websiteSafe = String(website || "").trim();
  const socialsSafe = (socials || []).map((s) => String(s || "").trim()).filter(Boolean);

  const hasLinks = !!emailSafe || !!websiteSafe || socialsSafe.length > 0 || !!featuredLink;
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

  if (!hasLinks) return null;

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
            {emailSafe && (
              <EmailRow
                email={emailSafe}
                name={name}
                slug={slug}
                className={linkClasses}
                Arrow={Arrow}
              />
            )}

            {websiteSafe && (
              <a
                href={normalizeUrl(websiteSafe)}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClasses}
                style={{ textDecoration: "none" }}
              >
                <Arrow />
                <span>{displayUrl(websiteSafe)}</span>
              </a>
            )}

            {featuredLink && (
              <a
                href={featuredLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClasses}
                style={{ textDecoration: "none" }}
              >
                <Arrow />
                <span>{featuredLink.label}</span>
              </a>
            )}

            {socialsSafe.map((social, i) => (
              <a
                key={i}
                href={normalizeSocialUrl(social)}
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
