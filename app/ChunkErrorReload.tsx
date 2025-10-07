"use client";

import { useEffect } from "react";

export default function ChunkErrorReload() {
  useEffect(() => {
    const RELOAD_COOLDOWN_MS = 10_000;

    const reloadNow = () => {
      // Avoid reload loops
      try {
        const key = "chunk_reload_cooldown";
        const last = Number(sessionStorage.getItem(key) || "0");
        const now = Date.now();
        if (now - last < RELOAD_COOLDOWN_MS) return;
        sessionStorage.setItem(key, String(now));
      } catch {
        // ignore
      }

      // Try to purge caches (helps with PWAs/stale chunks), then reload
      const g = globalThis as unknown as Window & typeof globalThis;
      if ("caches" in g && g.caches?.keys) {
        g.caches
          .keys()
          .then((keys) => Promise.all(keys.map((k) => g.caches.delete(k))))
          .finally(() => g.location.reload());
      } else {
        g.location.reload();
      }
    };

    const onError = (e: ErrorEvent) => {
      const name = (e?.error as any)?.name || "";
      const msg = e?.message || "";
      if (name === "ChunkLoadError" || msg.includes("ChunkLoadError") || msg.includes("Loading chunk")) {
        reloadNow();
      }
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = String(e?.reason ?? "");
      if (reason.includes("ChunkLoadError") || reason.includes("Loading chunk")) {
        reloadNow();
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    // OPTIONAL: also hook Webpack’s own chunk error handler
    try {
      const w = window as any;
      if (!w.__chunkReloadHookInstalled) {
        w.__chunkReloadHookInstalled = true;
        const wpReq =
          w.__webpack_require__ ||
          (w.webpackJsonp?.webpack?.require ?? null);

        if (wpReq && typeof wpReq === "function") {
          const prev = wpReq.oe;
          wpReq.oe = (err: any) => {
            const msg = String(err?.message || err || "");
            if (msg.includes("ChunkLoadError") || msg.includes("Loading chunk")) {
              reloadNow();
            }
            if (typeof prev === "function") return prev(err);
            throw err;
          };
        }
      }
    } catch {
      // ignore if not available
    }

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
