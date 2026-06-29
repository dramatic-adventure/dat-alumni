// components/field-kit/ServiceWorkerRegistrar.tsx
//
// Registers the Field Kit service worker (public/sw.js) once, on mount. Scoped to
// "/field-kit/" — the SW controls the kit and its asset fetches while leaving the
// rest of the site uncontrolled. Renders nothing; no-op where SW is unsupported.

"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/field-kit/" })
      .catch(() => undefined);
  }, []);

  return null;
}
