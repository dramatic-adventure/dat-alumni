// lib/journeyOgImage.tsx
//
// Shared OG-image builder for the journeys routes (review/audio build §5 —
// "OG shareability"): the card's hero full-bleed, the program label + title,
// and the DAT wordmark. Used by /journeys/[slug]/opengraph-image.tsx (newest
// card) and /journeys/[slug]/[cardId]/opengraph-image.tsx (that card).
//
// Scope guard: journeys only — project pages / profiles OG is a separate
// effort (spec §5).

import "server-only";
import { ImageResponse } from "next/og";
import type { JourneyCard } from "@/lib/journeyCard";

export const OG_SIZE = { width: 1200, height: 630 };

/** Absolutize a card media URL against the deploy origin. */
export function absoluteMediaUrl(url: string, base: string): string {
  const u = String(url ?? "").trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  return `${base.replace(/\/$/, "")}${u.startsWith("/") ? "" : "/"}${u}`;
}

/** The deploy origin, from Netlify env (mirrors app/story's getBaseUrl envs). */
export function ogBaseUrl(): string {
  const envUrl =
    process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && /^https?:\/\//i.test(envUrl)) return envUrl;
  return "http://localhost:3000";
}

/**
 * Fetch the hero and hand satori a JPEG data URI: satori's own <img> fetch is
 * unreliable here and can't decode webp, and Journey heroes are arbitrary
 * artist media. sharp normalizes anything to a bounded JPEG; any failure just
 * drops the hero — the dark editorial layout stands on its own.
 */
async function heroDataUri(url: string): Promise<string> {
  if (!url) return "";
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return "";
    const buf = Buffer.from(await res.arrayBuffer());
    const { default: sharp } = await import("sharp");
    const jpeg = await sharp(buf).resize(OG_SIZE.width, OG_SIZE.height, { fit: "cover" }).jpeg({ quality: 78 }).toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return "";
  }
}

export async function journeyOgImage(card: JourneyCard, base: string): Promise<ImageResponse> {
  const hero = await heroDataUri(absoluteMediaUrl(card.heroUrl || card.mediaUrls[0] || "", base));
  const title = card.title || card.programLabel;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          backgroundColor: "#241123",
          position: "relative",
        }}
      >
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero}
            alt=""
            width={OG_SIZE.width}
            height={OG_SIZE.height}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
        {/* satori quirks: no `inset` shorthand, no `background` shorthand —
            explicit offsets + backgroundImage or the overlay renders zero-size. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage:
              "linear-gradient(180deg, rgba(36,17,35,0.05) 35%, rgba(36,17,35,0.92) 82%)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", padding: "0 64px 56px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
            <div style={{ width: 46, height: 6, backgroundColor: "#F23359", marginRight: 18 }} />
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "#f5c842",
              }}
            >
              {card.programLabel}
            </div>
          </div>
          {title && (
            <div
              style={{
                fontSize: 74,
                fontWeight: 700,
                color: "#f9f4ea",
                lineHeight: 1.04,
                maxWidth: 1020,
                textWrap: "balance",
              }}
            >
              {title}
            </div>
          )}
          <div
            style={{
              marginTop: 22,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(249,244,234,0.85)",
            }}
          >
            Dramatic Adventure Theatre · A Journey Card
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
