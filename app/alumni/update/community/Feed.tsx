"use client";

import React from "react";
import CommunityComposer from "@/app/alumni/update/community/Composer";
import CommunityUpdateLine from "@/components/alumni/update/CommunityUpdateLine";

/** Returns a short relative label for timestamps < 48 h old; null otherwise. */
function relativeTime(ts?: string | number): string | null {
  if (!ts) return null;
  const ms = typeof ts === "number" ? ts : Date.parse(String(ts));
  if (!Number.isFinite(ms)) return null;
  const diffMs = Date.now() - ms;
  if (diffMs < 0) return null;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMs / 3_600_000);
  if (diffH < 24) return `${diffH}h ago`;
  if (diffH < 48) return "yesterday";
  return null; // ≥ 2 days — show nothing
}

type ToastFn = (msg: string, type?: "success" | "error") => void;

export default function Feed({
  email,
  isAdmin,
  stableAlumniId,

  feed,
  feedLoading,

  postCurrentUpdate,
  undoPostedUpdate,
  openEventAndScroll,

  showToastRef,

  isLoaded,

  COLOR,
  explainStyleLight,
}: {
  email: string;
  isAdmin: boolean;
  stableAlumniId: string;

  feed: any[];
  feedLoading: boolean;

  postCurrentUpdate: (rawText: string, meta?: any) => Promise<string | null>;
  undoPostedUpdate: (updateId: string) => Promise<void>;
  openEventAndScroll: () => void;

  showToastRef: React.MutableRefObject<ToastFn | undefined>;

  isLoaded: boolean;

  COLOR: { ink: string };
  explainStyleLight: React.CSSProperties;
}) {
  return (
    <div style={{ margin: "2rem 0 0" }}>
      <div
        style={{
          background: "#f2f2f241",
          border: "none",
          boxShadow: "none",
          borderRadius: 16,
          padding: "16px 16px 14px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: 14,
              textTransform: "uppercase",
              fontWeight: 700,
              letterSpacing: ".1em",
              color: COLOR.ink,
              opacity: 0.85,
            }}
          >
            Community Feed
          </div>
        </div>

        {!isLoaded ? (
          <p style={{ ...explainStyleLight, margin: 0 }}>Loading your profile…</p>
        ) : (
          <>
            <CommunityComposer
              postCurrentUpdate={postCurrentUpdate}
              openEventAndScroll={openEventAndScroll}
              showToastRef={showToastRef}
            />

            {/* Divider */}
            <div
              style={{
                height: 1,
                background: "rgba(36, 17, 35, 0.25)",
                margin: "14px 2px 12px",
              }}
            />

            {/* Feed */}
            {feedLoading ? (
              <p style={{ ...explainStyleLight, margin: 0 }}>Loading…</p>
            ) : !feed.length ? (
              <p style={{ ...explainStyleLight, margin: 0 }}>No updates yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {feed.map((it: any, idx: number) => (
                  <CommunityUpdateLine
                    key={`${it.id ?? `${it.alumniId}-${it.ts}-${it.field ?? "field"}`}-${idx}`}
                    name={it?.name}
                    slug={it?.slug || it?.alumniId || "alumni"}
                    text={it?.text}
                    meta={relativeTime(it?.ts) ?? undefined}
                    updateId={it?.id}
                    showActions={Boolean(it?.id && (isAdmin || it.alumniId === stableAlumniId))}
                    onUndo={undoPostedUpdate}
                    style={{
                      background: "#f2f2f27a",
                      border: "1px solid rgba(36, 17, 35, 0.10)",
                      boxShadow: "none",
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
