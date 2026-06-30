// components/field-kit/OfflineItinerary.tsx
//
// Slice 2 — the OFFLINE itinerary view. Renders the on-device snapshot through
// the SAME ItineraryCompanion the online path uses (it's a plain prop-rendering
// component with no "use client" / server-only imports, so it renders fine
// client-side), with "today" resolved from the device clock. A clear banner makes
// it unmistakable that this is last-synced data, not live.
//
// This is shown ONLY when offline (ItineraryView gates it) — an online user never
// sees the snapshot. The cold-start app-shell (public/field-kit-shell.html) is a
// dependency-free mirror of this same view for the no-JS-bundle case.

"use client";

import { useEffect, useState } from "react";
import ItineraryCompanion from "@/components/field-kit/ItineraryCompanion";
import { resolveToday } from "@/lib/programItinerary";
import { getSnapshot, type ItinerarySnapshotRecord } from "@/lib/itinerarySnapshot";
import { formatRelativeTime } from "@/lib/relativeTime";
import { T, FONT } from "@/components/field-kit/tokens";

export default function OfflineItinerary({ programId }: { programId: string }) {
  // undefined = still reading IndexedDB; null = no snapshot on this device yet.
  const [snap, setSnap] = useState<ItinerarySnapshotRecord | null | undefined>(undefined);
  // Re-tick the relative label while the view stays open offline.
  const [, setNow] = useState(0);

  useEffect(() => {
    let alive = true;
    getSnapshot(programId).then((s) => {
      if (alive) setSnap(s ?? null);
    });
    return () => {
      alive = false;
    };
  }, [programId]);

  useEffect(() => {
    const id = setInterval(() => setNow((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  if (snap === undefined) return <OfflineNotice variant="loading" />;
  if (!snap) return <OfflineNotice variant="empty" />;

  const today = resolveToday(snap.itinerary);
  return (
    <>
      <OfflineBanner syncedAt={snap.syncedAt} />
      <ItineraryCompanion itinerary={snap.itinerary} today={today} />
    </>
  );
}

function OfflineBanner({ syncedAt }: { syncedAt: number }) {
  return (
    <div role="status" style={BANNER}>
      <span aria-hidden style={DOT} />
      <span style={LABEL}>Offline — showing last synced {formatRelativeTime(syncedAt)}</span>
    </div>
  );
}

function OfflineNotice({ variant }: { variant: "loading" | "empty" }) {
  const empty = variant === "empty";
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "72px clamp(18px, 5vw, 40px)", textAlign: "center" }}>
      <p style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: T.pink, margin: "0 0 12px" }}>
        Offline
      </p>
      <h1 style={{ fontFamily: FONT.anton, fontSize: "clamp(26px, 6vw, 42px)", lineHeight: 0.98, textTransform: "uppercase", color: T.ink, margin: "0 0 16px" }}>
        {empty ? "No saved itinerary yet." : "Loading saved itinerary…"}
      </h1>
      {empty && (
        <p style={{ fontFamily: FONT.dm, fontSize: 14.5, lineHeight: 1.55, color: T.ink, opacity: 0.78, margin: 0 }}>
          Open the itinerary once while you have a connection and it&apos;ll be saved here for offline use in the field.
        </p>
      )}
    </main>
  );
}

const BANNER: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "9px 14px",
  backgroundColor: "rgba(255,64,103,0.10)",
  borderBottom: `1px solid ${T.border}`,
};

const DOT: React.CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: "50%",
  backgroundColor: T.pink,
  flexShrink: 0,
};

const LABEL: React.CSSProperties = {
  fontFamily: FONT.grotesk,
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: T.ink,
};
