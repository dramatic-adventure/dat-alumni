// app/ChunkErrorReload.tsx
"use client";

import { useEffect } from "react";

export default function ChunkErrorReload() {
  useEffect(() => {
    const COOLDOWN_MS = 10_000;
    const MAX_RELOADS = 3;
    const KEY_LAST = "chunk_reload_last_ts";
    const KEY_COUNT = "chunk_reload_count";

    function getTextFromUnknown(x: unknown): string {
      if (!x) return "";
      if (typeof x === "string") return x;
      if (x instanceof Error) return `${x.name}: ${x.message}\n${x.stack ?? ""}`;

      // ErrorEvent
      if (typeof x === "object" && x && "message" in x) {
        // @ts-ignore
        const m = x.message;
        if (typeof m === "string") return m;
      }

      try {
        return JSON.stringify(x);
      } catch {
        return String(x);
      }
    }

    function extractSignals(e: unknown): string {
      // PromiseRejectionEvent
      // @ts-ignore
      const reason = e?.reason;
      // ErrorEvent
      // @ts-ignore
      const message = e?.message;
      // @ts-ignore
      const filename = e?.filename;
      // @ts-ignore
      const error = e?.error;

      return [
        getTextFromUnknown(message),
        getTextFromUnknown(filename),
        getTextFromUnknown(reason),
        getTextFromUnknown(error),
      ]
        .filter(Boolean)
        .join("\n");
    }

    const isChunkishError = (e: unknown) => {
      const s = extractSignals(e);

      return (
        /ChunkLoadError/i.test(s) ||
        /Loading chunk .* failed/i.test(s) ||
        /CSS_CHUNK_LOAD_FAILED/i.test(s) ||
        /Loading CSS chunk .* failed/i.test(s) ||
        /Failed to fetch dynamically imported module/i.test(s) ||
        /react-server-dom-webpack/i.test(s)
      );
    };

    const withinCooldown = () => {
      try {
        const last = Number(sessionStorage.getItem(KEY_LAST) || "0");
        return Date.now() - last < COOLDOWN_MS;
      } catch {
        return false;
      }
    };

    const overMaxReloads = () => {
      try {
        const n = Number(sessionStorage.getItem(KEY_COUNT) || "0");
        return n >= MAX_RELOADS;
      } catch {
        return false;
      }
    };

    const bumpCounters = () => {
      try {
        sessionStorage.setItem(KEY_LAST, String(Date.now()));
        const n = Number(sessionStorage.getItem(KEY_COUNT) || "0");
        sessionStorage.setItem(KEY_COUNT, String(Math.min(MAX_RELOADS, n + 1)));
      } catch {
        /* ignore */
      }
    };

    const reloadNow = async () => {
      if (withinCooldown() || overMaxReloads()) return;
      bumpCounters();

      // Best effort SW refresh
      try {
        const reg = await navigator.serviceWorker?.getRegistration();
        await reg?.update();
        reg?.waiting?.postMessage?.({ type: "SKIP_WAITING" });
      } catch {
        /* ignore */
      }

      window.location.reload();
    };

    const onError = (e: ErrorEvent) => {
      if (isChunkishError(e)) void reloadNow();
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      if (isChunkishError(e)) void reloadNow();
    };

    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
