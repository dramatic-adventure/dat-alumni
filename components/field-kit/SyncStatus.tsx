// components/field-kit/SyncStatus.tsx
//
// Field Kit connectivity indicator for the top bar.
//
// HONEST SCOPE: there is no offline cache / sync engine yet (that's the PWA
// task). So this reports only REAL connectivity (navigator.onLine) — no
// fabricated "last synced 2m ago" or "N pending" until a sync layer exists to
// back those numbers. PLUG-AND-PLAY SEAM: when the service worker + draft queue
// land, extend this to surface last-sync time and pending-count from that layer.

"use client";

import { useEffect, useState } from "react";
import { T, FONT } from "@/components/field-kit/tokens";

export default function SyncStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <span
      title={online ? "Online — data loads live" : "Offline"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: FONT.grotesk,
        fontSize: 8.5,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "rgba(246,239,227,0.6)",
      }}
    >
      <span
        aria-hidden
        style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: online ? T.green : T.pink, flexShrink: 0 }}
      />
      {online ? "Online" : "Offline"}
    </span>
  );
}
