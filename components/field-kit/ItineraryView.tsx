// components/field-kit/ItineraryView.tsx
//
// Slice 2 — chooses between the LIVE itinerary and the OFFLINE snapshot view.
//
// CORE PRINCIPLE: online users always get live data; the snapshot is only ever
// the offline fallback. So while online this renders `children` verbatim — the
// server-rendered ItineraryCompanion + LiveRefresh (the live path) — and the
// snapshot is never shown. The moment the device goes offline it swaps to
// OfflineItinerary (last-synced snapshot). On reconnect it swaps back to the live
// path, whose LiveRefresh re-fetches and resumes live updates.
//
// SSR renders online (children) so first paint matches the live document and
// there's no hydration flash for the common case.

"use client";

import { useEffect, useState } from "react";
import OfflineItinerary from "@/components/field-kit/OfflineItinerary";

export default function ItineraryView({
  programId,
  children,
}: {
  programId: string;
  children: React.ReactNode;
}) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(navigator.onLine === false);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (offline) return <OfflineItinerary programId={programId} />;
  return <>{children}</>;
}
