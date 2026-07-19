// components/field-kit/ResourceViewer.tsx
//
// In-app reader for a single Field Library resource (the fix for the
// standalone-PWA trap: opening a file via target="_blank" replaced the whole
// app with the PDF and standalone Safari — Mac web app or iOS home-screen —
// has no back chrome, stranding the user). This renders the file INSIDE the
// kit's own chrome instead: a "back to the shelf" bar stays visible above an
// <iframe> (text/pdf) or <img> (image), so there is always a way home.
//
// Opening this page IS the cache moment (cache-on-open, same §12 Q3 decision
// as the card): the file is fetched in full and stored in fk-lib on mount.
// Offline: the page itself rides the SW's nav caching; the framed file request
// hits /api/field-kit/library/file/[id], which public/sw.js serves from the
// fk-lib cache when the network is gone.
//
// "Open in browser ↗" is a deliberate escape hatch (target="_blank"): from a
// standalone app it opens the system browser / in-app overlay — useful where
// framed PDF rendering is weak (iOS shows only the first page of framed PDFs).

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { T, FONT } from "@/components/field-kit/tokens";
import {
  cacheLibraryFile,
  isLibraryFileCached,
  type LibraryCacheResult,
} from "@/lib/fieldKitCache";
import type { FieldResource } from "@/lib/programItinerary";

type OfflineState = "checking" | "cached" | "not-cached" | "online-only" | "too-large";

export default function ResourceViewer({ resource }: { resource: FieldResource }) {
  const external = resource.type === "link";
  const url = `/api/field-kit/library/file/${encodeURIComponent(resource.id)}`;
  const [offline, setOffline] = useState<OfflineState>(external ? "online-only" : "checking");

  // Cache-on-open: arriving here counts as opening the file.
  useEffect(() => {
    if (external) return;
    let alive = true;
    (async () => {
      if (await isLibraryFileCached(url)) {
        if (alive) setOffline("cached");
        return;
      }
      if (alive) setOffline("not-cached");
      const result: LibraryCacheResult = await cacheLibraryFile(url);
      if (!alive) return;
      if (result === "cached") setOffline("cached");
      else if (result === "too-large") setOffline("too-large");
    })();
    return () => {
      alive = false;
    };
  }, [external, url]);

  const chip =
    offline === "cached"
      ? { dot: T.green, text: "Saved offline", color: T.green }
      : offline === "online-only"
        ? { dot: T.dim, text: "Online only", color: T.muted }
        : offline === "too-large"
          ? { dot: T.dim, text: "Too big to save", color: T.muted }
          : { dot: "#d4a017", text: "Saving…", color: T.ink };

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "10px clamp(14px, 3vw, 40px) 96px" }}>
      {/* Back bar — the whole point of this page. Always visible above the file. */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "8px 0 14px" }}>
        <Link
          href="/field-kit/library"
          style={{ fontFamily: FONT.grotesk, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.teal, textDecoration: "none", whiteSpace: "nowrap" }}
        >
          ← Back to the shelf
        </Link>
        <span aria-hidden style={{ flex: 1, height: 1, backgroundColor: T.sep, minWidth: 24 }} />
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: FONT.grotesk, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: chip.color, whiteSpace: "nowrap" }}>
          <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: chip.dot, display: "inline-block" }} />
          {chip.text}
        </span>
        {!external && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            style={{ fontFamily: FONT.grotesk, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted, textDecoration: "none", whiteSpace: "nowrap" }}
          >
            Open in browser ↗
          </a>
        )}
      </div>

      <h1 style={{ fontFamily: FONT.dm, fontWeight: 700, fontSize: "clamp(16px, 2.4vw, 21px)", color: T.ink, margin: "0 0 12px", lineHeight: 1.3 }}>
        {resource.title}
      </h1>

      {external ? (
        <p style={{ fontFamily: FONT.dm, fontSize: 14.5, lineHeight: 1.55, color: T.ink, opacity: 0.8 }}>
          This resource lives outside the kit —{" "}
          <a href={resource.url} target="_blank" rel="noreferrer" style={{ color: T.teal }}>
            open it in your browser →
          </a>
        </p>
      ) : resource.type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element -- gated proxy URL; next/image can't optimize it
        <img
          src={url}
          alt={resource.title}
          style={{ maxWidth: "100%", borderRadius: 10, border: `1px solid ${T.border}`, display: "block" }}
        />
      ) : resource.type === "audio" ? (
        <audio controls preload="none" src={url} style={{ width: "100%", display: "block" }} aria-label={`Play ${resource.title}`} />
      ) : (
        <iframe
          src={url}
          title={resource.title}
          style={{
            width: "100%",
            // Fill the viewport below the kit's top bar + this page's back bar,
            // but never collapse on short windows.
            height: "calc(100dvh - 220px)",
            minHeight: 420,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            backgroundColor: "#fff",
            display: "block",
          }}
        />
      )}
    </main>
  );
}
