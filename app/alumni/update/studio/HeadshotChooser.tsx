"use client";

import { useEffect, useMemo, useState } from "react";

type DriveMeta = { name?: string; thumbnailLink?: string; webViewLink?: string };
type HeadshotItem = {
  fileId: string;
  uploadedAt?: string;
  isCurrent?: boolean;
  externalUrl?: string;
  isSynthetic?: boolean;
  drive?: DriveMeta;
};

export default function HeadshotChooser({
  alumniId,
  onFeatured,
  onFeaturedUrl,
  profileHeadshotId,
  profileHeadshotUrl,
  loading: parentLoading,
}: {
  alumniId: string;
  onFeatured: (fileId: string) => void;
  onFeaturedUrl?: (url: string) => void;
  profileHeadshotId?: string;
  profileHeadshotUrl?: string;
  loading?: boolean;
}) {
  const [items, setItems] = useState<HeadshotItem[]>([]);
  const [fetching, setFetching] = useState(false);
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

  // Sync isCurrent badges to the profile's actual saved headshot (Profile-Live is authoritative;
  // Sheets isCurrent flags can be stale due to eventual consistency + 15s server cache).
  useEffect(() => {
    if (profileHeadshotId) {
      setItems((prev) => prev.map((it) => ({ ...it, isCurrent: it.fileId === profileHeadshotId })));
    } else if (profileHeadshotUrl) {
      setItems((prev) =>
        prev.map((it) => ({ ...it, isCurrent: !it.fileId && it.externalUrl === profileHeadshotUrl }))
      );
    }
  }, [profileHeadshotId, profileHeadshotUrl]);

  // Staging-only selection: no server write until Save Profile Basics is clicked.
  function select(fileId: string, externalUrl?: string) {
    if (parentLoading) return;
    if (!fileId) {
      if (!externalUrl) return;
      setItems((prev) =>
        prev.map((it) => ({ ...it, isCurrent: !it.fileId && it.externalUrl === externalUrl }))
      );
      onFeaturedUrl?.(externalUrl);
      return;
    }
    setItems((prev) =>
      prev.map((it) => ({ ...it, isCurrent: it.fileId === fileId }))
    );
    onFeatured(fileId);
  }

  const thumbUrl = (it: HeadshotItem): string => {
    if (it.fileId) return `/api/media/thumb?fileId=${encodeURIComponent(it.fileId)}&w=160`;
    if (it.externalUrl) return it.externalUrl;
    return "";
  };

  // Merge fetched items with an optional synthetic entry for the profile's URL headshot.
  // Filters out completely blank rows (no fileId and no externalUrl).
  const displayItems = useMemo<HeadshotItem[]>(() => {
    const filtered = items.filter((it) => it.fileId || it.externalUrl);
    const url = profileHeadshotUrl;
    if (!url) return filtered;
    if (filtered.some((it) => it.externalUrl === url)) return filtered;
    // Only mark the synthetic item as current if no fetched item is already current
    const syntheticIsCurrent = !filtered.some((it) => it.isCurrent);
    return [
      { fileId: "", externalUrl: url, isCurrent: syntheticIsCurrent, isSynthetic: true },
      ...filtered,
    ];
  }, [items, profileHeadshotUrl]);

  const current = displayItems.find((it) => it.isCurrent);

  if (fetching) {
    return (
      <div style={{ padding: "24px 0", opacity: 0.6, fontSize: 13 }}>
        Loading headshots…
      </div>
    );
  }

  if (displayItems.length === 0) {
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
            Click any thumbnail to stage it. Hit <strong>Save Profile Basics</strong> to persist.
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            {displayItems.map((it) => {
              const isCurr = !!it.isCurrent;
              return (
                <button
                  key={it.fileId || `url:${it.externalUrl}`}
                  type="button"
                  onClick={() => !isCurr && select(it.fileId, it.externalUrl)}
                  disabled={!!parentLoading}
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
                    transition: "border-color 0.15s",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbUrl(it)}
                    alt={it.drive?.name || it.fileId}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
