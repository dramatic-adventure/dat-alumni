"use client";

import { useState } from "react";

export default function CopyEventLinkButton({
  className = "",
}: {
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // no-op; button remains usable even if clipboard fails
    }
  }

  return (
    <button type="button" onClick={handleCopy} className={className}>
      {copied ? "Link Copied ✓" : "Copy Link →"}
    </button>
  );
}