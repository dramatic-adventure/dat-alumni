"use client";

import { useEffect, useState } from "react";

type DriveMeta = { name?: string; thumbnailLink?: string; webViewLink?: string };
type HeadshotItem = {
  fileId: string;
  uploadedAt?: string;
  isCurrent?: boolean;
  drive?: DriveMeta;
};

export default function HeadshotChooser({
  alumniId,
  onFeatured,
  loading: parentLoading,
}: {
  alumniId: string;
  onFeatured: (fileId: string) => void;
  loading?: boolean;
}) {
  const [items, setItems] = useState<HeadshotItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const [featuring, setFeaturing] = useState<string | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!alumniId) return;
    const run = async () => {
      setFetching(true);
      setErr("");
      try {
        const res = await fetch(
          `/api/alumni/media/list?alumniId=${encodeURIComponent(alumniId)}&kind=headshot&includeDrive=true&limit=100`,
          { cache: "no-store" }
        );
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "Failed to load");
        setItems(j.items || []);
      } catch (e: any) {
        setErr(e?.message || "Failed to load");
      } finally {
        setFetching(false);
      }
    };
    run();
  }, [alumniId]);

  async function feature(fileId: string) {
    if (featuring || parentLoading) return;
    setFeaturing(fileId);
    setErr("");
    try {
      const res = await fetch("/api/media/feature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alumniId, kind: "headshot", fileId }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.error || "Feature failed");
      // Optimistically mark new current in local list
      setItems((prev) =>
        prev.map((it) => ({ ...it, isCurrent: it.fileId === fileId }))
      );
      onFeatured(fileId);
    } catch (e: any) {
      setErr(e?.message || "Feature failed");
    } finally {
      setFeaturing(null);
    }
  }

  const current = items.find((it) => it.isCurrent);
  const thumbUrl = (it: HeadshotItem) =>
    it.drive?.thumbnailLink
      ? it.drive.thumbnailLink
      : `/api/media/thumb?fileId=${encodeURIComponent(it.fileId)}`;

  if (fetching) {
    return (
      <div style={{ padding: "24px 0", opacity: 0.6, fontSize: 13 }}>
        Loading headshots…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ padding: "16px 0", opacity: 0.5, fontSize: 13 }}>
        No past headshots found.
      </div>
    );
  }

  return (
    <div>
      {err && (
        <div style={{ marginBottom: 10, fontSize: 13, color: "#f87171" }}>{err}</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 20, alignItems: "start" }}>
        {/* 4:5 portrait of the current headshot */}
        <div
          style={{
            width: 120,
            aspectRatio: "4 / 5",
            borderRadius: 10,
            overflow: "hidden",
            border: "2px solid rgba(108,0,175,0.7)",
            background: "rgba(255,255,255,0.06)",
            flexShrink: 0,
            position: "relative",
          }}
        >
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbUrl(current)}
              alt="Current headshot"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                opacity: 0.4,
                textAlign: "center",
                padding: "0 8px",
              }}
            >
              None set
            </div>
          )}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "rgba(108,0,175,0.75)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.05em",
              textAlign: "center",
              padding: "3px 0",
              color: "#fff",
            }}
          >
            CURRENT
          </div>
        </div>

        {/* Horizontal scrollable strip */}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, opacity: 0.55, marginBottom: 8 }}>
            Click any thumbnail to make it your current headshot.
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            {items.map((it) => {
              const isCurr = !!it.isCurrent;
              const isProcessing = featuring === it.fileId;
              return (
                <button
                  key={it.fileId}
                  type="button"
                  onClick={() => !isCurr && feature(it.fileId)}
                  disabled={!!featuring || !!parentLoading}
                  style={{
                    flexShrink: 0,
                    width: 72,
                    aspectRatio: "4 / 5",
                    borderRadius: 8,
                    overflow: "hidden",
                    border: isCurr
                      ? "2px solid rgba(108,0,175,0.9)"
                      : "2px solid rgba(255,255,255,0.2)",
                    cursor: isCurr ? "default" : "pointer",
                    background: "rgba(255,255,255,0.06)",
                    padding: 0,
                    position: "relative",
                    opacity: isProcessing ? 0.5 : 1,
                    transition: "border-color 0.15s, opacity 0.15s",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbUrl(it)}
                    alt={it.drive?.name || it.fileId}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                  {isProcessing && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        color: "#fff",
                      }}
                    >
                      …
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
