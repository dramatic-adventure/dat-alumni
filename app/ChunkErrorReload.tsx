// app/ChunkErrorReload.tsx
"use client";

import { useEffect } from "react";

export default function ChunkErrorReload() {
  useEffect(() => {
    const COOLDOWN_MS = 10_000;        // min gap between reloads
    const MAX_RELOADS = 3;             // per-tab/session cap
    const KEY_LAST = "chunk_reload_last_ts";
    const KEY_COUNT = "chunk_reload_count";

    // Broad matcher: JS chunks, CSS chunks, dynamic imports, RSC transport
    const isChunkishError = (err: unknown) => {
      const s = String(
        // @ts-ignore
        err?.reason?.stack || err?.reason?.message || err?.reason?.name ||
        // @ts-ignore
        err?.error?.stack  || err?.error?.message  || err?.error?.name  ||
        // @ts-ignore
        err?.message || err || ""
      );
      return (
        /ChunkLoadError/i.test(s) ||                              // webpack JS chunk
        /Loading chunk .* failed/i.test(s) ||                     // generic JS chunk text
        /CSS_CHUNK_LOAD_FAILED/i.test(s) ||                       // CSS chunk
        /Failed to fetch dynamically imported module/i.test(s) || // dynamic import()
        /react-server-dom-webpack/i.test(s) ||                    // RSC transport hiccup
        /Loading CSS chunk .* failed/i.test(s)
      );
    };

    const withinCooldown = () => {
      try {
        const last = Number(sessionStorage.getItem(KEY_LAST) || "0");
        return Date.now() - last < COOLDOWN_MS;
      } catch { return false; }
    };

    const overMaxReloads = () => {
      try {
        const n = Number(sessionStorage.getItem(KEY_COUNT) || "0");
        return n >= MAX_RELOADS;
      } catch { return false; }
    };

    const bumpCounters = () => {
      try {
        sessionStorage.setItem(KEY_LAST, String(Date.now()));
        const n = Number(sessionStorage.getItem(KEY_COUNT) || "0");
        sessionStorage.setItem(KEY_COUNT, String(Math.min(MAX_RELOADS, n + 1)));
      } catch { /* ignore */ }
    };

    const reloadNow = async () => {
      if (withinCooldown() || overMaxReloads()) return;
      bumpCounters();

      // Try to ensure updated SW/chunks if you use a service worker.
      try {
        const reg = await navigator.serviceWorker?.getRegistration();
        await reg?.update();
        // Ask any waiting SW to activate immediately (your SW must listen for this)
        reg?.waiting?.postMessage?.({ type: "SKIP_WAITING" });
      } catch { /* ignore */ }

      // Simple, low-risk reload
      window.location.reload();
    };

    const onError = (e: ErrorEvent) => {
      if (isChunkishError(e)) reloadNow();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      if (isChunkishError(e)) reloadNow();
    };

    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onRejection);

    // Optional: patch webpack’s loader error hook (older patterns)
    try {
      const w: any = window as any;
      if (!w.__chunkReloadHookInstalled) {
        w.__chunkReloadHookInstalled = true;
        const wpReq = w.__webpack_require__ || (w.webpackJsonp?.webpack?.require ?? null);
        if (wpReq && typeof wpReq === "function") {
          const prev = wpReq.oe;
          wpReq.oe = (err: any) => {
            if (isChunkishError(err)) reloadNow();
            if (typeof prev === "function") return prev(err);
            throw err;
          };
        }
      }
    } catch { /* ignore */ }

    return () => {
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
