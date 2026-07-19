// components/field-kit/PdfPages.tsx
//
// Multi-page PDF renderer for the Field Library viewer. Framed PDFs are a dead
// end in standalone Safari — iOS renders only page 1, and macOS wraps the file
// in its own scrolling viewer that "swims" inside the iframe. So we render the
// document ourselves with pdf.js: every page rasterized to a canvas,
// fit-to-width, stacked vertically in the normal page scroll.
//
// The blob arrives from ResourceViewer's cache-on-open load (a single
// download — see lib/fieldKitCache#loadLibraryFile). The pdf.js worker is
// emitted by webpack as a hashed /_next/static asset (new URL(...,
// import.meta.url)), so the SW's static-asset cache keeps rendering working
// offline after first use. If pdf.js fails for any reason we fall back to the
// old iframe, so a file is never less viewable than before.

"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { T, FONT } from "@/components/field-kit/tokens";

export default function PdfPages({ blob, url, title }: { blob: Blob; url: string; title: string }) {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"rendering" | "ready" | "error">("rendering");
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    let alive = true;
    let doc: PDFDocumentProxy | null = null;
    // v6: destroy() lives on the loading task (kills doc + worker transport).
    let task: { destroy(): Promise<void> } | null = null;
    let renderPass = 0; // stale-pass guard: a resize mid-render abandons the old pass
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    let lastWidth = 0;

    const renderAll = async (cssWidth: number) => {
      if (!doc || cssWidth <= 0) return;
      const pass = ++renderPass;
      lastWidth = cssWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      holder.replaceChildren();
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        if (!alive || pass !== renderPass) return;
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: (cssWidth / base.width) * dpr });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", `${title} — page ${i} of ${doc.numPages}`);
        canvas.style.cssText = `width:100%;height:auto;display:block;background:#fff;border:1px solid ${T.border};border-radius:8px;`;
        await page.render({ canvas, viewport }).promise;
        if (!alive || pass !== renderPass) return;
        holder.appendChild(canvas); // progressive: page 1 visible while the rest render
      }
    };

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            "pdfjs-dist/build/pdf.worker.min.mjs",
            import.meta.url
          ).toString();
        }
        const data = await blob.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data });
        task = loadingTask;
        if (!alive) {
          // Unmounted during the awaits above — cleanup missed this task.
          void loadingTask.destroy();
          return;
        }
        const loaded = await loadingTask.promise;
        if (!alive) return; // cleanup already ran → its task.destroy() wins
        doc = loaded;
        setPageCount(loaded.numPages);
        await renderAll(holder.clientWidth);
        if (alive) setStatus("ready");
      } catch {
        if (alive) setStatus("error");
      }
    })();

    // Re-render on meaningful width change (rotation, window resize) so pages
    // stay fit-to-width instead of scaling a blurry raster.
    const observer = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0]?.contentRect.width ?? 0);
      if (!doc || w <= 0 || Math.abs(w - lastWidth) < 2) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => void renderAll(w), 200);
    });
    observer.observe(holder);

    return () => {
      alive = false;
      renderPass++;
      clearTimeout(resizeTimer);
      observer.disconnect();
      task?.destroy().catch(() => undefined);
    };
  }, [blob, title]);

  if (status === "error") {
    // pdf.js couldn't render this file — fall back to the pre-pdf.js iframe.
    return (
      <iframe
        src={url}
        title={title}
        style={{
          width: "100%",
          height: "calc(100dvh - 220px)",
          minHeight: 420,
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          backgroundColor: "#fff",
          display: "block",
        }}
      />
    );
  }

  return (
    <div>
      {pageCount > 1 && (
        <p
          style={{
            fontFamily: FONT.grotesk,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: T.muted,
            margin: "0 0 8px",
          }}
        >
          {pageCount} pages
        </p>
      )}
      {status === "rendering" && pageCount === 0 && (
        <p style={{ fontFamily: FONT.dm, fontSize: 13.5, color: T.muted, margin: "8px 0" }}>
          Loading document…
        </p>
      )}
      <div ref={holderRef} style={{ display: "flex", flexDirection: "column", gap: 14 }} />
    </div>
  );
}
