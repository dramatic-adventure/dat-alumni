"use client";

import { useEffect } from "react";

/**
 * Reads window.location.hash on mount.
 * If a hash is present (and passes prefix filters):
 *  1. Clicks the given collapsible button to open its panel (if currently closed).
 *  2. After a short delay (to let the animation finish), scrolls the target element into view.
 *
 * hashPrefix  — if provided, only fires when the hash STARTS WITH this string.
 *               Use for sections with a known anchor prefix (e.g. "proj-").
 * blockPrefix — if provided, does NOT fire when the hash starts with this string.
 *               Use to prevent a section from opening on another section's anchors.
 */
export default function HashScrollOpener({
  collapsibleBtnId,
  hashPrefix,
  blockPrefix,
}: {
  collapsibleBtnId: string;
  hashPrefix?:  string;
  blockPrefix?: string;
}) {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    // Positive filter: only fire for hashes with this prefix
    if (hashPrefix  !== undefined && !hash.startsWith(hashPrefix))  return;
    // Negative filter: skip hashes that belong to another section
    if (blockPrefix !== undefined &&  hash.startsWith(blockPrefix)) return;

    // Open the collapsible if it's currently closed
    const btn = document.getElementById(collapsibleBtnId) as HTMLButtonElement | null;
    if (btn && btn.getAttribute("aria-expanded") === "false") {
      btn.click();
    }

    // Wait for the collapsible animation to finish, then scroll to the target
    const timer = setTimeout(() => {
      const target = document.getElementById(hash);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        // Briefly highlight the target element
        target.style.transition = "box-shadow 0.4s ease";
        target.style.boxShadow = "0 0 0 3px #FFCC00, 0 0 24px rgba(255, 204, 0, 0.5)";
        setTimeout(() => {
          target.style.boxShadow = "";
        }, 2000);
      }
    }, 380);

    return () => clearTimeout(timer);
  }, [collapsibleBtnId, hashPrefix, blockPrefix]);

  return null;
}
