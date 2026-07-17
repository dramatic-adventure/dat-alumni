// components/field-kit/NavCacheReconciler.tsx
//
// Client half of the SLICE 4b cache-first navigation strategy (public/sw.js).
// Kit pages are served instantly from Cache Storage; the SW then revalidates in
// the background and messages controlled windows:
//
// - "fk-nav-fresh": a newer copy of this URL just landed in the cache → run a
//   silent router.refresh() so the on-screen server components catch up. No
//   banner — home/itinerary already surface "updated" via LiveRefresh when the
//   underlying data actually changed.
// - "fk-nav-auth": the network answered with a login redirect or the
//   roster-gate screen; the SW has deleted the cached entry → hard reload so
//   the real redirect/gate shows instead of the stale page.
//
// Acts only when the message's URL matches the page being viewed (path +
// query). Renders nothing; no-op where SW is unsupported.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NavCacheReconciler() {
  const router = useRouter();

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const onMessage = (e: MessageEvent) => {
      const data = e.data as { type?: string; url?: string } | null;
      if (!data?.type || !data.url) return;
      let target: URL;
      try {
        target = new URL(data.url);
      } catch {
        return;
      }
      const here = window.location;
      if (target.pathname !== here.pathname || target.search !== here.search) return;

      if (data.type === "fk-nav-fresh") {
        router.refresh(); // silent — client state (forms, scroll) preserved
      } else if (data.type === "fk-nav-auth") {
        window.location.reload(); // cache entry is gone → real redirect/gate loads
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [router]);

  return null;
}
