// components/field-kit/FieldLibrary.tsx
//
// THE FIELD LIBRARY — Slice 5, ported from the V17 mockup
// (resources/ResourcesLibrary.tsx): named shelves with accent bars, "» Relevant
// today" picks, per-card type + offline chips. Differences from the mockup, all
// deliberate:
//   • Shelves come from each resource's first tag (staff-curated in the Sheet),
//     not a hardcoded fixture; untagged rows land on "The Shelf".
//   • Today's picks are computed from the REAL itinerary day (dayId match) —
//     the mockup's "Day 5 · Košice" hardcode was flagged as a bug to not repeat.
//   • Offline is real: cache-on-open (opening a Drive-backed file saves it via
//     lib/fieldKitCache#cacheLibraryFile) plus an explicit "Save offline"
//     action; chips reflect the actual Cache Storage state. External links are
//     badged online-only.
//
// Client component: the offline chips and save actions need Cache Storage.
// The resource LIST itself arrives as props (it rides the itinerary payload,
// so it precaches offline with everything else).

"use client";

import { useCallback, useEffect, useState } from "react";
import { T, FONT, accent } from "@/components/field-kit/tokens";
import {
  cacheLibraryFile,
  isLibraryFileCached,
  type LibraryCacheResult,
} from "@/lib/fieldKitCache";
import type { FieldResource, ItineraryAccent } from "@/lib/programItinerary";

const TYPE_COLOR: Record<FieldResource["type"], string> = {
  text: T.teal,
  audio: T.purple,
  image: T.grape,
  link: T.muted,
};

// Rotate the mockup's accent palette across shelves so each keeps its own
// colored edge without inventing new colors.
const SHELF_ACCENTS: ItineraryAccent[] = ["teal", "pink", "yellow", "grape", "purple"];

export type LibraryProps = {
  resources: FieldResource[];
  programLabel: string;
  /** Real itinerary context for "Relevant today" (empty when unresolved). */
  todayDayId: string;
  todayLabel: string; // e.g. "Day 5 · Košice"
};

function fileUrl(r: FieldResource): string {
  return `/api/field-kit/library/file/${encodeURIComponent(r.id)}`;
}

/** External links open directly; everything else streams through the proxy. */
function isExternal(r: FieldResource): boolean {
  return r.type === "link";
}

export default function FieldLibrary({ resources, programLabel, todayDayId, todayLabel }: LibraryProps) {
  const todayPicks = todayDayId ? resources.filter((r) => r.dayId === todayDayId) : [];

  // Shelves by first tag, in first-appearance order; untagged → "The Shelf".
  const shelves = new Map<string, FieldResource[]>();
  for (const r of resources) {
    const shelf = r.tags[0] || "The Shelf";
    const list = shelves.get(shelf) ?? [];
    list.push(r);
    shelves.set(shelf, list);
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px clamp(14px, 4vw, 56px) 96px" }}>
      <p style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: T.teal, margin: "0 0 10px" }}>
        {programLabel} · Field Library
      </p>
      <h1 style={{ fontFamily: FONT.anton, fontSize: "clamp(38px, 6.5vw, 70px)", lineHeight: 0.93, textTransform: "uppercase", color: T.ink, margin: "0 0 16px" }}>
        The Shelf.
      </h1>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 30 }}>
        <span aria-hidden style={{ display: "inline-block", width: 26, height: 2, marginTop: 9, backgroundColor: T.pink, borderRadius: 1, flexShrink: 0 }} />
        <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: "clamp(14px, 1.7vw, 17px)", color: T.ink, opacity: 0.82, margin: 0, lineHeight: 1.5 }}>
          Every resource curated for {programLabel}. Open one once and it stays on this device —
          no signal required after that.
        </p>
      </div>

      {todayPicks.length > 0 && (
        <section aria-label="Surfaced for today" style={{ marginBottom: 38 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <span style={{ fontFamily: FONT.grotesk, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: T.pink }}>
              » Relevant today
            </span>
            {todayLabel && (
              <span style={{ fontFamily: FONT.dm, fontSize: 12, color: T.muted }}>
                surfaced from {todayLabel}
              </span>
            )}
          </div>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
            {todayPicks.map((r) => (
              <ResourceCard key={r.id} resource={r} shelfAccent={T.pink} featured />
            ))}
          </div>
        </section>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 36 }}>
        <span style={{ fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: T.muted, whiteSpace: "nowrap" }}>
          Full library
        </span>
        <span aria-hidden style={{ flex: 1, height: 1, backgroundColor: T.sep }} />
        <span style={{ fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, whiteSpace: "nowrap" }}>
          {shelves.size} {shelves.size === 1 ? "shelf" : "shelves"} · {resources.length}{" "}
          {resources.length === 1 ? "resource" : "resources"}
        </span>
      </div>

      {Array.from(shelves.entries()).map(([shelf, list], i) => (
        <section key={shelf} aria-label={shelf} style={{ marginBottom: i === shelves.size - 1 ? 0 : 48 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
            <span aria-hidden style={{ display: "inline-block", width: 4, minHeight: 34, alignSelf: "stretch", backgroundColor: accent(SHELF_ACCENTS[i % SHELF_ACCENTS.length]), borderRadius: 2, flexShrink: 0 }} />
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <h2 style={{ fontFamily: FONT.anton, fontSize: "clamp(20px, 2.8vw, 28px)", textTransform: "uppercase", color: T.ink, margin: 0, lineHeight: 1 }}>
                {shelf}
              </h2>
              <span style={{ fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted }}>
                {list.length} {list.length === 1 ? "resource" : "resources"}
              </span>
            </div>
          </div>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
            {list.map((r) => (
              <ResourceCard key={r.id} resource={r} shelfAccent={accent(SHELF_ACCENTS[i % SHELF_ACCENTS.length])} />
            ))}
          </div>
        </section>
      ))}

      {resources.length === 0 && (
        <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 14.5, lineHeight: 1.55, color: T.ink, opacity: 0.75, margin: 0, textAlign: "center", padding: "24px 0" }}>
          The shelf is being stocked — resources for this trip land here as the road team adds them.
        </p>
      )}
    </main>
  );
}

// ── Resource card ─────────────────────────────────────────────────────────────

type OfflineState = "checking" | "cached" | "not-cached" | "online-only" | "too-large";

function ResourceCard({
  resource,
  shelfAccent,
  featured = false,
}: {
  resource: FieldResource;
  shelfAccent: string;
  featured?: boolean;
}) {
  const external = isExternal(resource);
  const url = fileUrl(resource);
  const [offline, setOffline] = useState<OfflineState>(external ? "online-only" : "checking");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (external) return;
    let alive = true;
    isLibraryFileCached(url).then((cached) => {
      if (alive) setOffline(cached ? "cached" : "not-cached");
    });
    return () => {
      alive = false;
    };
  }, [external, url]);

  const save = useCallback(async () => {
    if (saving || external) return;
    setSaving(true);
    try {
      const result: LibraryCacheResult = await cacheLibraryFile(url);
      if (result === "cached") setOffline("cached");
      else if (result === "too-large") setOffline("too-large");
    } finally {
      setSaving(false);
    }
  }, [saving, external, url]);

  // Opening a file IS the cache moment (cache-on-open): kick off the save in
  // the background alongside the navigation/playback.
  const onOpen = useCallback(() => {
    if (!external && offline === "not-cached") void save();
  }, [external, offline, save]);

  const chip =
    offline === "cached"
      ? { dot: T.green, text: "Saved offline", color: T.green }
      : offline === "online-only"
        ? { dot: T.dim, text: "Online only", color: T.muted }
        : offline === "too-large"
          ? { dot: T.dim, text: "Too big to save", color: T.muted }
          : { dot: "#d4a017", text: saving ? "Saving…" : "Open to save", color: T.ink };

  return (
    <div
      style={{
        backgroundColor: T.card,
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        borderLeft: `3px solid ${shelfAccent}`,
        padding: "14px 16px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        boxShadow: featured ? "0 6px 20px rgba(14,10,19,0.35)" : "0 2px 8px rgba(14,10,19,0.2)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: FONT.grotesk, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#fff", backgroundColor: TYPE_COLOR[resource.type], padding: "0.22em 0.6em", borderRadius: 3 }}>
          {resource.type}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: FONT.grotesk, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: chip.color }}>
          <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: chip.dot, display: "inline-block" }} />
          {chip.text}
        </span>
      </div>

      <p style={{ fontFamily: FONT.dm, fontWeight: 700, fontSize: 14, color: T.ink, margin: 0, lineHeight: 1.35, flex: 1 }}>
        {resource.title}
      </p>

      {resource.tags.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {resource.tags.slice(1, 4).map((tag) => (
            <span key={tag} style={{ fontFamily: FONT.grotesk, fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, backgroundColor: "rgba(246,239,227,0.07)", padding: "0.2em 0.55em", borderRadius: 3 }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Audio plays inline (offline via the SW's Range slicing once saved). */}
      {resource.type === "audio" && !external && (
        <audio
          controls
          preload="none"
          src={url}
          onPlay={onOpen}
          style={{ width: "100%", display: "block" }}
          aria-label={`Play ${resource.title}`}
        />
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center", paddingTop: 8, borderTop: `1px solid ${T.sep}` }}>
        {external ? (
          <a
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            style={{ fontFamily: FONT.grotesk, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.teal, textDecoration: "none" }}
          >
            Open link →
          </a>
        ) : (
          <>
            {resource.type !== "audio" && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                onClick={onOpen}
                style={{ fontFamily: FONT.grotesk, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.teal, textDecoration: "none" }}
              >
                Open →
              </a>
            )}
            {offline === "not-cached" && (
              <button
                type="button"
                onClick={save}
                disabled={saving}
                style={{ marginLeft: "auto", fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.ink, background: "transparent", border: `1px solid ${T.border}`, borderRadius: 7, padding: "4px 9px", cursor: "pointer" }}
              >
                {saving ? "Saving…" : "Save offline"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
