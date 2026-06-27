"use client";

/**
 * PublicProfilePreview — the encouraging "Your public profile" card that sits at
 * the top of the Profile Studio, plus the dynamic "Take it further" upgrade tiles.
 *
 * Deliberately a friendly NUDGE card on the warm kraft surface (not a faithful
 * clone of the real profile hero). Fully driven by props derived from live form
 * state via deriveProfileState — it does no data loading of its own.
 */

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { StudioTab } from "@/components/alumni/update/ProfileStudio";
import type { DerivedProfileState } from "@/app/alumni/update/helpers/deriveProfileState";

const COLOR = {
  ink: "#241123",
  brand: "#6C00AF",
  gold: "#D9A919",
  snow: "#F2F2F2",
  kraft: "#dac9a6",
};

const FF_GROTESK = "var(--font-space-grotesk), system-ui, sans-serif";
const FF_SANS = "var(--font-dm-sans), system-ui, sans-serif";

type FlagKey =
  | "hasMedia"
  | "hasStoryMapStory"
  | "hasJourneyCard"
  | "hasHighlight"
  | "hasUpcomingEvent";

type Tile = {
  key: string;
  tab: StudioTab;
  flag: FlagKey;
  title: string;
  body: string;
};

// Canonical order = priority order. "Next up" is the first incomplete tile here.
const TILES: Tile[] = [
  {
    key: "media",
    tab: "media",
    flag: "hasMedia",
    title: "Share photos or video",
    body: "Feature a reel, trailer, production photos, or a collection from your travels and projects.",
  },
  {
    key: "story",
    tab: "story",
    flag: "hasStoryMapStory",
    title: "Pin your story on the map",
    body: "Map one special moment from your DAT journey on the global Story Map.",
  },
  {
    key: "journey",
    tab: "journey",
    flag: "hasJourneyCard",
    title: "Trace your journey with DAT",
    body: "Create a Journey Card for a past program, reflecting on where you went, what you made, and what stayed with you.",
  },
  {
    key: "highlight",
    tab: "highlight",
    flag: "hasHighlight",
    title: "Add a recent highlight",
    body: "Celebrate your work by sharing a project, award, press mention, or creative milestone.",
  },
  {
    key: "event",
    tab: "event",
    flag: "hasUpcomingEvent",
    title: "Share an upcoming event",
    body: "Add your next performance, screening, workshop, exhibition, opening, or other public event.",
  },
];

function EyeIcon() {
  return (
    <svg
      width="13"
      height="13"
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
  );
}

function ChevronRight({ color }: { color: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: "block", flex: "none" }}
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

const eyebrowStyle: CSSProperties = {
  fontFamily: FF_GROTESK,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  color: COLOR.ink,
  opacity: 0.7,
};

export default function PublicProfilePreview({
  state,
  publicHref,
  onOpenTab,
  onShareUpdate,
}: {
  state: DerivedProfileState;
  /** Relative href to the public profile (e.g. "/alumni/jane-doe"), or null pre-publish. */
  publicHref: string | null;
  /** Open a Profile Studio tab AND scroll the panel into view. */
  onOpenTab: (tab: StudioTab) => void;
  /** Scroll to the community composer and focus its textarea. */
  onShareUpdate: () => void;
}) {
  const { preview, completeness, featureFlags } = state;
  const published = Boolean(publicHref && preview.slug);

  // Show the real public host once mounted; sensible default for SSR/first paint.
  const [host, setHost] = useState("stories.dramaticadventure.com");
  useEffect(() => {
    if (typeof window !== "undefined" && window.location?.host) {
      setHost(window.location.host);
    }
  }, []);

  const isDone = (flag: FlagKey) => Boolean(featureFlags[flag]);
  const nextUpKey = TILES.find((t) => !isDone(t.flag))?.key ?? null;
  // Incomplete tiles first; stable sort preserves canonical order within each group.
  const orderedTiles = [...TILES].sort(
    (a, b) => (isDone(a.flag) ? 1 : 0) - (isDone(b.flag) ? 1 : 0)
  );

  return (
    <section
      aria-label="Your public profile"
      style={{
        background: COLOR.kraft,
        borderRadius: 16,
        padding: "18px 18px 20px",
        marginBottom: 18,
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        color: COLOR.ink,
      }}
    >
      {/* Eyebrow + Public pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <span style={eyebrowStyle}>Your public profile</span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: "rgba(36,17,35,0.10)",
            color: COLOR.ink,
            borderRadius: 999,
            padding: "3px 10px",
            fontFamily: FF_GROTESK,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".06em",
            opacity: 0.85,
          }}
        >
          <EyeIcon />
          Public
        </span>
      </div>

      {/* Identity row: 4:5 headshot + details */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {preview.headshotUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview.headshotUrl}
            alt={preview.name ? `${preview.name} headshot` : "Headshot"}
            style={{
              width: 92,
              height: 115,
              borderRadius: 12,
              objectFit: "cover",
              flex: "none",
              background: "rgba(36,17,35,0.08)",
              boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => onOpenTab("basics")}
            style={{
              width: 92,
              height: 115,
              borderRadius: 12,
              flex: "none",
              border: "2px dashed rgba(36,17,35,0.35)",
              background: "rgba(255,255,255,0.35)",
              color: COLOR.ink,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: 8,
              fontFamily: FF_GROTESK,
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1.25,
              textAlign: "center",
              opacity: 0.85,
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
            Add your headshot
          </button>
        )}

        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontFamily: FF_GROTESK,
              fontSize: 20,
              fontWeight: 800,
              lineHeight: 1.15,
              color: COLOR.ink,
            }}
          >
            {preview.name || "Your name"}
          </div>

          {preview.title ? (
            <div style={{ fontFamily: FF_SANS, fontSize: 14, marginTop: 3, opacity: 0.9 }}>
              {preview.title}
            </div>
          ) : null}

          {preview.location ? (
            <div style={{ fontFamily: FF_SANS, fontSize: 13, marginTop: 2, opacity: 0.7 }}>
              {preview.location}
            </div>
          ) : null}

          {/* Headline line = latest current update */}
          <div style={{ marginTop: 8 }}>
            {preview.headline ? (
              <p
                style={{
                  fontFamily: FF_SANS,
                  fontSize: 14,
                  lineHeight: 1.45,
                  margin: 0,
                  color: COLOR.ink,
                }}
              >
                <span aria-hidden="true" style={{ opacity: 0.45, marginRight: 4 }}>
                  “
                </span>
                {preview.headline}
                <span aria-hidden="true" style={{ opacity: 0.45, marginLeft: 2 }}>
                  ”
                </span>
              </p>
            ) : (
              <button
                type="button"
                onClick={onShareUpdate}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: FF_GROTESK,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: ".02em",
                  color: COLOR.brand,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Share your latest
                <ChevronRight color={COLOR.brand} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* URL + button on their own row (flex siblings, never overlapping) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 16,
          paddingTop: 14,
          borderTop: "1px solid rgba(36,17,35,0.14)",
        }}
      >
        {published ? (
          <>
            <span
              title={`${host}${publicHref}`}
              style={{
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: FF_SANS,
                fontSize: 13,
                color: COLOR.ink,
                opacity: 0.7,
              }}
            >
              {host}
              {publicHref}
            </span>
            <a
              href={publicHref ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: "none",
                textDecoration: "none",
                borderRadius: 999,
                padding: "8px 14px",
                fontFamily: FF_GROTESK,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                background: COLOR.brand,
                color: COLOR.snow,
                whiteSpace: "nowrap",
              }}
            >
              View public profile
            </a>
          </>
        ) : (
          <>
            <span
              style={{
                flex: 1,
                minWidth: 0,
                fontFamily: FF_SANS,
                fontSize: 13,
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
                padding: "8px 14px",
                fontFamily: FF_GROTESK,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                background: "rgba(36,17,35,0.12)",
                color: "rgba(36,17,35,0.5)",
                whiteSpace: "nowrap",
                cursor: "not-allowed",
              }}
            >
              View public profile
            </span>
          </>
        )}
      </div>

      {/* Progress + encouragement */}
      <div style={{ marginTop: 14 }}>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={completeness.total}
          aria-valuenow={completeness.filled}
          aria-label="Profile completeness"
          style={{
            height: 8,
            borderRadius: 999,
            background: "rgba(36,17,35,0.14)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${completeness.pct}%`,
              height: "100%",
              borderRadius: 999,
              background: COLOR.gold,
              transition: "width 320ms ease",
            }}
          />
        </div>
        <p
          style={{
            fontFamily: FF_SANS,
            fontSize: 12.5,
            lineHeight: 1.5,
            margin: "8px 0 0",
            color: COLOR.ink,
            opacity: 0.75,
          }}
        >
          Add your headshot and a few details to help visitors recognize you, follow your work,
          and connect.
        </p>
      </div>

      {/* Take it further */}
      <div style={{ marginTop: 18 }}>
        <div style={{ ...eyebrowStyle, marginBottom: 10 }}>Take it further</div>
        <div style={{ display: "grid", gap: 8 }}>
          {orderedTiles.map((tile) => {
            const done = isDone(tile.flag);
            const isNextUp = !done && tile.key === nextUpKey;
            return (
              <button
                key={tile.key}
                type="button"
                onClick={() => onOpenTab(tile.tab)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  textAlign: "left",
                  cursor: "pointer",
                  borderRadius: 12,
                  padding: "12px 14px",
                  border: isNextUp
                    ? "1px solid rgba(217,169,25,0.7)"
                    : "1px solid rgba(36,17,35,0.12)",
                  background: done ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.55)",
                  opacity: done ? 0.72 : 1,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: FF_GROTESK,
                        fontSize: 14,
                        fontWeight: 800,
                        color: COLOR.ink,
                      }}
                    >
                      {tile.title}
                    </span>
                    {done ? (
                      <span
                        style={{
                          fontFamily: FF_GROTESK,
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: ".06em",
                          textTransform: "uppercase",
                          color: COLOR.ink,
                          opacity: 0.6,
                        }}
                      >
                        Added ✓
                      </span>
                    ) : isNextUp ? (
                      <span
                        style={{
                          fontFamily: FF_GROTESK,
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: COLOR.ink,
                          background: COLOR.gold,
                          borderRadius: 999,
                          padding: "2px 8px",
                        }}
                      >
                        Next up
                      </span>
                    ) : null}
                  </div>
                  <p
                    style={{
                      fontFamily: FF_SANS,
                      fontSize: 12.5,
                      lineHeight: 1.45,
                      margin: "3px 0 0",
                      color: COLOR.ink,
                      opacity: 0.75,
                    }}
                  >
                    {tile.body}
                  </p>
                </div>
                <ChevronRight color="rgba(108,0,175,0.55)" />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
