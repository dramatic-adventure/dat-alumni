"use client";

/**
 * PublicProfilePreview — the encouraging "Your public profile" onboarding block
 * that sits ABOVE the Profile Studio (its own translucent gold section, not inside
 * the plum studio container). Two warm kraft cards, each independently collapsible:
 *   1. the at-a-glance public-profile preview + completeness meter (with an
 *      expandable "what's missing" accordion)
 *   2. the dynamic "Take it further" upgrade tiles
 *
 * Deliberately a friendly NUDGE block, not a faithful clone of the real profile
 * hero. Fully driven by props derived from live form state via deriveProfileState
 * — it does no data loading of its own.
 */

import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { StudioTab } from "@/components/alumni/update/ProfileStudio";
import type { DerivedProfileState } from "@/app/alumni/update/helpers/deriveProfileState";

const COLOR = {
  ink: "#241123",
  brand: "#6C00AF",
  gold: "#D9A919",
  green: "#5f7d3b",
  kraft: "#dac9a6",
  goldBg: "rgba(217, 169, 25, 0.25)",
  snow: "#F2F2F2",
};

const FF_GROTESK = "var(--font-space-grotesk), system-ui, sans-serif";
const FF_SANS = "var(--font-dm-sans), system-ui, sans-serif";

type FlagKey =
  | "hasMedia"
  | "hasStoryMapStory"
  | "hasJourneyCard"
  | "hasHighlight"
  | "hasUpcomingEvent";

type IconName = "image" | "pin" | "route" | "star" | "calendar";

type Tile = {
  key: string;
  tab: StudioTab;
  flag: FlagKey;
  icon: IconName;
  title: string;
  body: string;
  /** Journey is the wide explainer tile — it spans both columns. */
  wide?: boolean;
};

// Canonical order. "Next up" is the first incomplete one.
const TILES: Tile[] = [
  {
    key: "media",
    tab: "media",
    flag: "hasMedia",
    icon: "image",
    title: "Share photos or video",
    body: "Feature a reel, trailer, production photos, or a collection from your travels and projects.",
  },
  {
    key: "story",
    tab: "story",
    flag: "hasStoryMapStory",
    icon: "pin",
    title: "Pin your story on the map",
    body: "Map one special moment from your DAT journey on the global Story Map.",
  },
  {
    key: "journey",
    tab: "journey",
    flag: "hasJourneyCard",
    icon: "route",
    title: "Trace your journey with DAT",
    body: "Create a Journey Card for a past program, reflecting on where you went, what you made, and what stayed with you.",
    wide: true,
  },
  {
    key: "highlight",
    tab: "highlight",
    flag: "hasHighlight",
    icon: "star",
    title: "Add a recent highlight",
    body: "Celebrate your work by sharing a project, award, press mention, or creative milestone.",
  },
  {
    key: "event",
    tab: "event",
    flag: "hasUpcomingEvent",
    icon: "calendar",
    title: "Share an upcoming event",
    body: "Add your next performance, screening, workshop, exhibition, opening, or other public event.",
  },
];

// Completeness keys (from deriveProfileState) → label + where to edit it.
const ESSENTIAL_META: Record<string, { label: string; tab: StudioTab }> = {
  headshot: { label: "Headshot", tab: "basics" },
  title: { label: "Current title", tab: "basics" },
  location: { label: "Location", tab: "basics" },
  bio: { label: "Bio", tab: "basics" },
  identityTags: { label: "Identity tags", tab: "identity" },
  practiceTags: { label: "Practice tags", tab: "identity" },
  exploreCareTags: { label: "Explore & Care tags", tab: "identity" },
  languages: { label: "Languages", tab: "identity" },
  connect: { label: "A way to connect", tab: "contact" },
};

/* ── Icons (inline SVG, stroke = currentColor) ──────────────────── */

const svgBase: CSSProperties = { display: "block", flex: "none" };

function Chevron({ open, size = 18 }: { open: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ ...svgBase, transform: open ? "rotate(180deg)" : "none", transition: "transform 180ms ease" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function TileIcon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    style: svgBase,
  };
  switch (name) {
    case "image":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M12 21s-7-6.4-7-11a7 7 0 0 1 14 0c0 4.6-7 11-7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "route":
      return (
        <svg {...common}>
          <circle cx="6" cy="19" r="2.5" />
          <circle cx="18" cy="5" r="2.5" />
          <path d="M8.5 19H15a3 3 0 0 0 3-3V7.5" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <polygon points="12 3 14.8 8.6 21 9.5 16.5 13.9 17.6 20 12 17.1 6.4 20 7.5 13.9 3 9.5 9.2 8.6 12 3" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="4.5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 2.5v4M16 2.5v4" />
        </svg>
      );
  }
}

const eyebrowStyle: CSSProperties = {
  fontFamily: FF_GROTESK,
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: ".16em",
  textTransform: "uppercase",
  color: COLOR.ink,
  opacity: 0.6,
};

/** Clickable card header that toggles collapse. */
function CardHeader({
  label,
  collapsed,
  onToggle,
  right,
}: {
  label: string;
  collapsed: boolean;
  onToggle: () => void;
  right?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      className="ppp-card-header"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        width: "100%",
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={eyebrowStyle}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 10, color: COLOR.ink, opacity: 0.85 }}>
        {right}
        <Chevron open={!collapsed} />
      </span>
    </button>
  );
}

export default function PublicProfilePreview({
  state,
  publicHref,
  onOpenTab,
  onShareUpdate,
  onEditHeadshot,
}: {
  state: DerivedProfileState;
  /** Relative href to the public profile (e.g. "/alumni/jane-doe"), or null pre-publish. */
  publicHref: string | null;
  /** Open a Profile Studio tab AND scroll the panel into view. */
  onOpenTab: (tab: StudioTab) => void;
  /** Scroll to the community composer and focus its textarea. */
  onShareUpdate: () => void;
  /** Open Basics and scroll/focus the headshot uploader. */
  onEditHeadshot: () => void;
}) {
  const { preview, completeness, featureFlags } = state;
  const published = Boolean(publicHref && preview.slug);

  // Established profiles (all essentials filled) collapse by default so the
  // Profile Studio surfaces; new/incomplete profiles stay open for guidance.
  const essentialsComplete = completeness.missing.length === 0;

  const [collapsedPreview, setCollapsedPreview] = useState(essentialsComplete);
  const [collapsedFurther, setCollapsedFurther] = useState(true);
  const [showMissing, setShowMissing] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    if (!publicHref) return;
    try {
      await navigator.clipboard.writeText(`https://${host}${publicHref}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  // Show the real public host once mounted; sensible default for SSR/first paint.
  const [host, setHost] = useState("stories.dramaticadventure.com");
  useEffect(() => {
    if (typeof window !== "undefined" && window.location?.host) {
      setHost(window.location.host);
    }
  }, []);

  const isDone = (flag: FlagKey) => Boolean(featureFlags[flag]);
  const nextUpKey = TILES.find((t) => !isDone(t.flag))?.key ?? null;

  const cardStyle = (collapsed: boolean): CSSProperties => ({
    // Translucent kraft so the two blocks read as lighter/secondary.
    background: "rgba(218, 201, 166, 0.55)",
    borderRadius: 18,
    padding: collapsed ? "16px 26px" : "22px 26px 26px",
    color: COLOR.ink,
  });

  const goMissing = (key: string) => {
    const meta = ESSENTIAL_META[key];
    if (!meta) return;
    if (key === "headshot") onEditHeadshot();
    else onOpenTab(meta.tab);
  };

  return (
    <div style={{ background: COLOR.goldBg, borderRadius: 20, padding: 16 }}>
      <style jsx global>{`
        /* Card headers (Your public profile, Take it further): no lift/shadow on hover */
        .ppp-card-header:hover {
          box-shadow: none !important;
          transform: none !important;
          filter: none !important;
        }

        /* "Share your latest": no lift/shadow; color shifts to DAT pink */
        .ppp-share-latest:hover {
          box-shadow: none !important;
          transform: none !important;
          filter: none !important;
          color: #f23359 !important;
        }

        /* Public-profile URL: working link, color change on hover, no lift/shadow */
        .ppp-url-link {
          transition: color 150ms ease;
        }
        .ppp-url-link:hover {
          color: #6c00af !important;
          opacity: 1 !important;
          box-shadow: none !important;
          transform: none !important;
          filter: none !important;
        }

        /* "Take it further" tiles (the ads): colored border + glow on hover */
        .ppp-tile:hover {
          border-color: rgba(108, 0, 175, 0.85) !important;
          box-shadow: 0 0 0 1px rgba(108, 0, 175, 0.45),
            0 12px 30px rgba(108, 0, 175, 0.28) !important;
          transform: translateY(-2px) !important;
          background: rgba(255, 255, 255, 0.62) !important;
        }
        /* "Next up" tile keeps its gold identity — glow in DAT gold instead */
        .ppp-tile--nextup:hover {
          border-color: rgba(217, 169, 25, 0.95) !important;
          box-shadow: 0 0 0 1px rgba(217, 169, 25, 0.5),
            0 12px 30px rgba(217, 169, 25, 0.3) !important;
        }
      `}</style>
      <div className="mx-auto w-full max-w-6xl" style={{ display: "grid", gap: 16 }}>
        {/* ── Card 1: public-profile preview ───────────────────────── */}
        <section aria-label="Your public profile" style={cardStyle(collapsedPreview)}>
          <CardHeader
            label="Your public profile"
            collapsed={collapsedPreview}
            onToggle={() => setCollapsedPreview((v) => !v)}
            right={
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#ffcc00",
                  color: COLOR.ink,
                  border: "1px solid rgba(36,17,35,0.12)",
                  borderRadius: 999,
                  padding: "4px 12px",
                  fontFamily: FF_GROTESK,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{ display: "block" }}
                >
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Public
              </span>
            }
          />

          {!collapsedPreview && (
            <div style={{ marginTop: 16 }}>
              {/* Identity row: 4:5 headshot + details */}
              <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                {preview.headshotUrl ? (
                  <button
                    type="button"
                    onClick={onEditHeadshot}
                    title="Change your headshot"
                    style={{
                      width: 112,
                      height: 140,
                      borderRadius: 14,
                      flex: "none",
                      padding: 0,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview.headshotUrl}
                      alt={preview.name ? `${preview.name} headshot` : "Headshot"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        borderRadius: 14,
                        background: "rgba(36,17,35,0.08)",
                      }}
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onEditHeadshot}
                    style={{
                      width: 112,
                      height: 140,
                      borderRadius: 14,
                      flex: "none",
                      border: "2px dashed rgba(36,17,35,0.35)",
                      background: "rgba(255,255,255,0.4)",
                      color: COLOR.ink,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 10,
                      fontFamily: FF_GROTESK,
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: "center",
                      opacity: 0.7,
                    }}
                  >
                    Add your headshot
                  </button>
                )}

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontFamily: FF_GROTESK,
                      fontSize: 27,
                      fontWeight: 800,
                      lineHeight: 1.1,
                      color: COLOR.ink,
                    }}
                  >
                    {preview.name || "Your name"}
                  </div>

                  {preview.title ? (
                    <div style={{ fontFamily: FF_SANS, fontSize: 16, marginTop: 6, opacity: 0.9 }}>
                      {preview.title}
                    </div>
                  ) : null}

                  {preview.location ? (
                    <div style={{ fontFamily: FF_SANS, fontSize: 15, marginTop: 5, opacity: 0.65 }}>
                      {preview.location}
                    </div>
                  ) : null}

                  {/* Headline line = latest current update */}
                  <div style={{ marginTop: 10 }}>
                    {preview.headline ? (
                      <p
                        style={{
                          fontFamily: FF_SANS,
                          fontSize: 15,
                          lineHeight: 1.45,
                          margin: 0,
                          color: COLOR.ink,
                          opacity: 0.9,
                        }}
                      >
                        {preview.headline}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={onShareUpdate}
                        className="ppp-share-latest"
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          fontFamily: FF_SANS,
                          fontStyle: "italic",
                          fontSize: 16,
                          fontWeight: 500,
                          color: COLOR.brand,
                        }}
                      >
                        Share your latest
                      </button>
                    )}
                  </div>

                  {/* Public URL + actions — right of the headshot, above the divider */}
                  {published ? (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 10,
                        marginTop: 16,
                      }}
                    >
                      <a
                        href={publicHref ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ppp-url-link"
                        title={`${host}${publicHref}`}
                        style={{
                          flex: "1 1 200px",
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontFamily: FF_SANS,
                          fontSize: 15,
                          color: COLOR.ink,
                          opacity: 0.8,
                          textDecoration: "none",
                        }}
                      >
                        {host}
                        {publicHref}
                      </a>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
                        <button
                          type="button"
                          onClick={copyLink}
                          className="ppp-copy-btn"
                          style={{
                            borderRadius: 999,
                            padding: "9px 16px",
                            fontFamily: FF_GROTESK,
                            fontSize: 14,
                            fontWeight: 700,
                            background: "transparent",
                            color: copied ? COLOR.green : COLOR.ink,
                            border: copied
                              ? "1px solid rgba(95,125,59,0.8)"
                              : "1px solid rgba(36,17,35,0.4)",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            transition: "border-color 150ms ease, color 150ms ease",
                          }}
                        >
                          {copied ? "Copied!" : "Copy link"}
                        </button>
                        <a
                          href={publicHref ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            textDecoration: "none",
                            borderRadius: 999,
                            padding: "9px 18px",
                            fontFamily: FF_GROTESK,
                            fontSize: 14,
                            fontWeight: 700,
                            background: COLOR.brand,
                            color: COLOR.snow,
                            whiteSpace: "nowrap",
                          }}
                        >
                          View public profile
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 10,
                        marginTop: 16,
                      }}
                    >
                      <span
                        style={{
                          flex: "1 1 200px",
                          minWidth: 0,
                          fontFamily: FF_SANS,
                          fontSize: 15,
                          color: COLOR.ink,
                          opacity: 0.65,
                        }}
                      >
                        Save changes to update your live profile.
                      </span>
                      <span
                        aria-disabled="true"
                        style={{
                          flex: "none",
                          borderRadius: 999,
                          padding: "9px 18px",
                          fontFamily: FF_GROTESK,
                          fontSize: 14,
                          fontWeight: 700,
                          background: "rgba(36,17,35,0.12)",
                          color: "rgba(36,17,35,0.5)",
                          whiteSpace: "nowrap",
                          cursor: "not-allowed",
                        }}
                      >
                        View public profile
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider (line break) below the identity row */}
              <div style={{ marginTop: 20, borderTop: "1px solid rgba(36,17,35,0.15)" }} />

              {/* Encouragement + progress — click to reveal what's missing */}
              <button
                type="button"
                onClick={() => setShowMissing((v) => !v)}
                aria-expanded={showMissing}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  width: "100%",
                  textAlign: "left",
                  cursor: "pointer",
                  marginTop: 16,
                  background: "rgba(255,255,255,0.82)",
                  border: "none",
                  borderRadius: 14,
                  padding: "14px 20px",
                }}
              >
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontFamily: FF_SANS,
                    fontSize: 15,
                    lineHeight: 1.4,
                    color: COLOR.ink,
                    opacity: 0.85,
                  }}
                >
                  Add your headshot and a few details to help visitors recognize you, follow your
                  work, and connect.
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 12, flex: "none", color: COLOR.ink }}>
                  <span
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={completeness.total}
                    aria-valuenow={completeness.filled}
                    aria-label="Profile completeness"
                    style={{
                      display: "block",
                      width: 120,
                      height: 8,
                      borderRadius: 999,
                      background: "rgba(36,17,35,0.18)",
                      overflow: "hidden",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        width: `${completeness.pct}%`,
                        height: "100%",
                        borderRadius: 999,
                        background: COLOR.brand,
                        transition: "width 320ms ease",
                      }}
                    />
                  </span>
                  <span
                    style={{
                      fontFamily: FF_GROTESK,
                      fontSize: 15,
                      fontWeight: 700,
                      opacity: 0.7,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {completeness.filled} / {completeness.total}
                  </span>
                  <Chevron open={showMissing} size={16} />
                </span>
              </button>

              {showMissing && (
                <div style={{ marginTop: 10, padding: "0 2px" }}>
                  {completeness.missing.length === 0 ? (
                    <p style={{ fontFamily: FF_SANS, fontSize: 14, margin: 0, color: COLOR.ink, opacity: 0.8 }}>
                      You&rsquo;ve added all the essentials — nice work.
                    </p>
                  ) : (
                    <>
                      <p
                        style={{
                          fontFamily: FF_SANS,
                          fontSize: 13,
                          margin: "0 0 8px",
                          color: COLOR.ink,
                          opacity: 0.7,
                        }}
                      >
                        Still to add — tap one to jump there:
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {completeness.missing.map((key) => {
                          const meta = ESSENTIAL_META[key];
                          if (!meta) return null;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => goMissing(key)}
                              style={{
                                cursor: "pointer",
                                fontFamily: FF_GROTESK,
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#f2f2f2",
                                background: "#2493A9",
                                border: "1px solid rgba(36,17,35,0.15)",
                                borderRadius: 999,
                                padding: "6px 13px",
                              }}
                            >
                              + {meta.label}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Card 2: Take it further ──────────────────────────────── */}
        <section aria-label="Take it further" style={cardStyle(collapsedFurther)}>
          <CardHeader
            label="Take it further"
            collapsed={collapsedFurther}
            onToggle={() => setCollapsedFurther((v) => !v)}
          />

          {!collapsedFurther && (
            <div
              style={{
                marginTop: 16,
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 14,
              }}
            >
              {TILES.map((tile) => {
                const done = isDone(tile.flag);
                const isNextUp = !done && tile.key === nextUpKey;
                return (
                  <button
                    key={tile.key}
                    type="button"
                    onClick={() => onOpenTab(tile.tab)}
                    className={`ppp-tile ${isNextUp ? "ppp-tile--nextup" : ""}`}
                    style={{
                      gridColumn: tile.wide ? "1 / -1" : "auto",
                      textAlign: "left",
                      cursor: "pointer",
                      borderRadius: 14,
                      padding: "16px 18px",
                      border: isNextUp
                        ? "1px solid rgba(217,169,25,0.75)"
                        : "1px solid rgba(36,17,35,0.10)",
                      background: "rgba(255,255,255,0.82)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span style={{ color: COLOR.brand, opacity: 0.8 }}>
                        <TileIcon name={tile.icon} />
                      </span>
                      <span
                        style={{
                          fontFamily: FF_GROTESK,
                          fontSize: 17,
                          fontWeight: 800,
                          color: COLOR.ink,
                        }}
                      >
                        {tile.title}
                      </span>
                      {isNextUp ? (
                        <span
                          style={{
                            marginLeft: "auto",
                            flex: "none",
                            fontFamily: FF_GROTESK,
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: ".1em",
                            textTransform: "uppercase",
                            color: COLOR.ink,
                            background: COLOR.gold,
                            borderRadius: 999,
                            padding: "3px 10px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Next up
                        </span>
                      ) : null}
                    </div>
                    <p
                      style={{
                        fontFamily: FF_SANS,
                        fontSize: 14,
                        lineHeight: 1.45,
                        margin: "6px 0 0",
                        color: COLOR.ink,
                        opacity: 0.7,
                      }}
                    >
                      {tile.body}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
