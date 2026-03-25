// components/media/MediaPickerModal.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type MediaKind = "headshot" | "album" | "reel" | "event" | "all";

type DriveMeta = { name?: string; webViewLink?: string; thumbnailLink?: string };

type MediaItem = {
  alumniId: string;
  kind: Exclude<MediaKind, "all">;
  fileId: string;
  uploadedAt: string;
  uploadedByEmail?: string;
  collectionId?: string;
  collectionTitle?: string;
  externalUrl?: string;
  isCurrent?: boolean;
  isFeatured?: boolean;
  sortIndex?: string;
  note?: string;
  drive?: DriveMeta;
};

export default function MediaPickerModal({
  open,
  onClose,
  alumniId,
  kind,
  title = "Choose existing media",
  onFeatured,
}: {
  open: boolean;
  onClose: () => void;
  alumniId: string;
  kind: Exclude<MediaKind, "all">;
  title?: string;
  onFeatured?: (fileId: string) => void;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    const run = async () => {
      setLoading(true);
      setErr("");
      try {
        const url = `/api/alumni/media/list?alumniId=${encodeURIComponent(alumniId)}&kind=${kind}&includeDrive=true&limit=100`;
        const res = await fetch(url, { cache: "no-store" });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "Failed to load media");
        setItems(j.items || []);
      } catch (e: any) {
        setErr(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [open, alumniId, kind]);

  async function feature(fileId: string) {
    try {
      const res = await fetch("/api/media/feature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alumniId, kind, fileId }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.error || "Feature failed");
      onFeatured?.(fileId);
      onClose();
    } catch (e: any) {
      setErr(e?.message || "Feature failed");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="text-sm text-gray-500 hover:text-black" onClick={onClose}>Close</button>
        </div>

        <div className="p-5">
          {err && <div className="mb-3 text-sm text-red-600">{err}</div>}
          {loading ? (
            <div className="py-10 text-center text-gray-500">Loading…</div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-gray-500">No media found.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {items.map((it) => {
                const isLive =
                  it.kind === "headshot"
                    ? it.isCurrent === true
                    : it.isFeatured === true;
                const label = isLive ? "Currently Featured" : "Feature";
                const thumbAlt = it.drive?.name || it.fileId;

                return (
                  <div key={it.fileId} className="border rounded-xl overflow-hidden">
                    {/* Thumbnail */}
                    <div className="relative w-full h-40 bg-gray-100">
                      {it.drive?.thumbnailLink ? (
                        <Image
                          src={it.drive.thumbnailLink}
                          alt={thumbAlt}
                          fill
                          sizes="(max-width: 768px) 50vw, 33vw"
                          className="object-cover"
                          // remote thumbs are optimized by Next; make sure host is in images.remotePatterns
                          priority={false}
                          draggable={false}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 px-2 text-center">
                          {thumbAlt}
                        </div>
                      )}
                    </div>

                    {/* Meta + actions */}
                    <div className="p-3 space-y-2">
                      <div className="text-sm font-medium truncate" title={thumbAlt}>
                        {thumbAlt}
                      </div>
                      <div className="text-xs text-gray-500">
                        {it.uploadedAt ? new Date(it.uploadedAt).toLocaleString() : ""}
                      </div>
                      <div className="flex items-center justify-between">
                        {isLive ? (
                          <span className="text-xs px-2 py-1 bg-emerald-500 text-white rounded-full">Live</span>
                        ) : (
                          <button
                            className="text-xs px-2 py-1 bg-black text-white rounded-full hover:opacity-90"
                            onClick={() => feature(it.fileId)}
                          >
                            {label}
                          </button>
                        )}
                        {it.drive?.webViewLink && (
                          <a
                            className="text-xs text-blue-600 hover:underline"
                            href={it.drive.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
