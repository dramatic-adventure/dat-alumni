"use client";
import { useEffect } from "react";
import { warmLocalFromSeed } from "@/lib/nameStackCache";

/**
 * Warms localStorage with entries from /public/namestack-hints.json.
 * Runs once per browser session (uses sessionStorage flag).
 */
export default function WarmNameStackHints() {
  useEffect(() => {
    // Skip on SSR
    if (typeof window === "undefined") return;

    const FLAG = "__NS_WARMED__";
    try {
      if (sessionStorage.getItem(FLAG)) return;
      sessionStorage.setItem(FLAG, "1");
    } catch {
      // sessionStorage might be unavailable; still attempt to warm
    }

    // Kick off warm (best-effort, ignore failures)
    Promise.resolve()
      .then(() => warmLocalFromSeed())
      .then(() => {
        try {
          // lightweight debug signal (no console.*)
          window.dispatchEvent?.(new CustomEvent("namestack:warmed"));
        } catch {
          /* noop */
        }
      })
      .catch(() => {
        /* noop */
      });
  }, []);

  return null;
}
