// components/field-kit/TracesList.tsx
//
// "My Traces" — Slice A read view. Renders the signed-in member's own captures
// (notes + quotes), newest first. Author-scoping is enforced by the caller +
// loader; this is a pure presentational list.

import Link from "next/link";
import type { FieldCapture } from "@/lib/loadFieldKitCaptures";
import { T, FONT } from "@/components/field-kit/tokens";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TracesList({ captures, asId }: { captures: FieldCapture[]; asId?: string }) {
  if (!captures.length) return <TracesEmpty />;

  const composerHref = asId
    ? `/field-kit/composer?asId=${encodeURIComponent(asId)}`
    : "/field-kit/composer";

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "40px clamp(18px, 5vw, 40px) 96px" }}>
      <p style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: T.teal, margin: "0 0 10px" }}>
        My Traces
      </p>
      <h1 style={{ fontFamily: FONT.anton, fontSize: "clamp(28px, 6.5vw, 44px)", lineHeight: 0.96, textTransform: "uppercase", color: T.ink, margin: "0 0 16px" }}>
        Everything you&apos;ve caught.
      </h1>

      {/* Slice 6 — the path from traces to a published Journey Card. */}
      <Link
        href={composerHref}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          background: T.black, border: `1px solid ${T.border}`, borderRadius: 12,
          padding: "12px 16px", marginBottom: 22, textDecoration: "none",
        }}
      >
        <span>
          <span style={{ display: "block", fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: T.yellow, marginBottom: 2 }}>
            Shape your card
          </span>
          <span style={{ fontFamily: FONT.dm, fontSize: 12.5, color: T.muted }}>
            Turn these traces into your Journey Card — private until you stamp it.
          </span>
        </span>
        <span aria-hidden style={{ fontFamily: FONT.anton, fontSize: 18, color: T.yellow }}>→</span>
      </Link>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {captures.map((c) => {
          const isQuote = c.kind === "quote";
          const isPhoto = c.kind === "photo";
          const isVoice = c.kind === "voice";
          const label = isVoice ? "Voice" : isPhoto ? "Photo" : isQuote ? "Quote" : "Note";
          const labelColor = isVoice ? T.green : isPhoto ? T.yellow : isQuote ? T.pink : T.teal;
          return (
            <li
              key={c.captureId}
              style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: FONT.grotesk, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: labelColor }}>
                    {label}
                  </span>
                  {c.visibility === "sealed" && (
                    // Slice 6 — sealed reflections never leave the journal and are
                    // never offered to the Journey Card Composer.
                    <span
                      style={{
                        fontFamily: FONT.grotesk,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: T.muted,
                        border: `1px dashed ${T.border}`,
                        borderRadius: 4,
                        padding: "2px 7px",
                      }}
                    >
                      ✦ Sealed
                    </span>
                  )}
                </span>
                <span style={{ fontFamily: FONT.dm, fontSize: 12, color: T.muted }}>{formatWhen(c.createdAt)}</span>
              </div>

              {isPhoto ? (
                <>
                  {c.driveFileId && (
                    // Private media: served only through the authorized route, never
                    // the public /api/media/thumb proxy.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/field-kit/capture/media/${encodeURIComponent(c.driveFileId)}`}
                      alt={c.bodyText || "Capture photo"}
                      style={{ display: "block", width: "100%", height: "auto", borderRadius: 9, border: `1px solid ${T.border}` }}
                    />
                  )}
                  {c.bodyText && (
                    <p style={{ fontFamily: FONT.dm, fontSize: 14.5, lineHeight: 1.5, color: T.ink, margin: "10px 0 0", whiteSpace: "pre-wrap" }}>
                      {c.bodyText}
                    </p>
                  )}
                </>
              ) : isVoice ? (
                <>
                  {c.driveFileId && (
                    // Private audio: streamed (with Range support) only through the
                    // authorized media route.
                    <audio
                      controls
                      src={`/api/field-kit/capture/media/${encodeURIComponent(c.driveFileId)}`}
                      aria-label={c.bodyText ? `Voice capture: ${c.bodyText}` : "Voice capture"}
                      style={{ width: "100%", display: "block" }}
                    />
                  )}
                  {c.bodyText && (
                    <p style={{ fontFamily: FONT.dm, fontSize: 14.5, lineHeight: 1.5, color: T.ink, margin: "10px 0 0", whiteSpace: "pre-wrap" }}>
                      {c.bodyText}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p
                    style={{
                      fontFamily: FONT.dm,
                      fontStyle: isQuote ? "italic" : "normal",
                      fontSize: 15,
                      lineHeight: 1.5,
                      color: T.ink,
                      margin: 0,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {isQuote ? `“${c.bodyText}”` : c.bodyText}
                  </p>
                  {isQuote && c.quoteSpeaker && (
                    <p style={{ fontFamily: FONT.dm, fontSize: 13.5, color: T.muted, margin: "6px 0 0" }}>
                      — {c.quoteSpeaker}
                    </p>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function TracesEmpty() {
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "72px clamp(18px, 5vw, 40px)", textAlign: "center" }}>
      <p style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: T.teal, margin: "0 0 12px" }}>
        My Traces
      </p>
      <h1 style={{ fontFamily: FONT.anton, fontSize: "clamp(28px, 6.5vw, 48px)", lineHeight: 0.96, textTransform: "uppercase", color: T.ink, margin: "0 0 16px" }}>
        Nothing caught yet.
      </h1>
      <p style={{ fontFamily: FONT.dm, fontSize: 14.5, lineHeight: 1.55, color: T.ink, opacity: 0.78, margin: 0 }}>
        Tap Capture below to jot a note or a quote — it&apos;ll show up here, newest first.
      </p>
    </main>
  );
}
