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

  return null;
}
