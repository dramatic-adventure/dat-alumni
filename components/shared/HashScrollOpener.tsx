"use client";

import { useEffect } from "react";

/**
 * Reads window.location.hash on mount.
 * If a hash is present:
 *  1. Clicks the given collapsible button to open its panel (if currently closed).
 *  2. After a short delay (to let the animation finish), scrolls the target element into view.
 */
export default function HashScrollOpener({
  collapsibleBtnId,
}: {
  collapsibleBtnId: string;
}) {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

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
        // Briefly highlight the target program
        target.style.transition = "box-shadow 0.4s ease";
        target.style.boxShadow = "0 0 0 3px #FFCC00, 0 0 24px rgba(255, 204, 0, 0.5)";
        setTimeout(() => {
          target.style.boxShadow = "";
        }, 2000);
      }
    }, 380);

    return () => clearTimeout(timer);
  }, [collapsibleBtnId]);

  return null;
}
