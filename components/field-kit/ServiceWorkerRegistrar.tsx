// components/field-kit/ServiceWorkerRegistrar.tsx
//
// Registers the Field Kit service worker (public/sw.js) once, on mount. Scoped to
// "/field-kit" (NO trailing slash — matching the manifest scope): a "/field-kit/"
// scope never controlled the bare /field-kit home navigation, so the home page
// could never be cached or opened offline. The SW controls the kit and its asset
// fetches while leaving the rest of the site uncontrolled. Renders nothing;
// no-op where SW is unsupported.

"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/field-kit" })
      .catch(() => undefined);
    // One-time migration: retire the older "/field-kit/"-scoped registration.
    // Left in place it would keep winning (longest-matching scope) for every
    // subroute while still missing the bare /field-kit home.
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => {
        for (const reg of regs) {
          if (new URL(reg.scope).pathname === "/field-kit/") void reg.unregister();
        }
      })
      .catch(() => undefined);
  }, []);

  // Ask the browser to mark this origin's storage PERSISTENT.
  //
  // WHY: an unsynced capture lives in exactly one place — this device's
  // IndexedDB — and by default that storage is "best-effort", which the browser
  // may evict under space pressure. On WebKit a Blob's bytes are held in a
  // file-backed store separate from its metadata, so an eviction can take the
  // AUDIO while leaving a Blob that still reports the correct `size`. The
  // upload then fails with a bare "Load failed" and nothing anywhere says why.
  // Observed 2026-07: three voice notes failing every attempt while a fourth
  // from the same queue uploaded fine.
  //
  // persist() exempts the origin from that eviction. Browsers grant it based on
  // engagement/installation, so it is NOT guaranteed — this is insurance for
  // captures made from here on, never a recovery path for bytes already gone.
  // Best-effort and silent: a refusal changes nothing about how the app works.
  useEffect(() => {
    void navigator.storage?.persist?.().catch(() => undefined);
  }, []);

  return null;
}
