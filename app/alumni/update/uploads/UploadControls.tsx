"use client";

import React from "react";
import { prettyMB } from "@/app/alumni/update/helpers/liveMap";
import type { UploadKind, UploadTask } from "@/lib/uploader";
import { ProgressBar } from "@/app/alumni/update/UpdateBits";

/**
 * Controls: pause/resume/cancel for a given upload kind
 */
export function UploadControls({
  kind,
  disabled,
  uploaderRef,
  stableAlumniId,
  datButtonGhost,
}: {
  kind: UploadKind;
  disabled?: boolean;
  uploaderRef: React.MutableRefObject<any | null>;
  stableAlumniId: string;
  datButtonGhost: React.CSSProperties;
}) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
      <button
        type="button"
        disabled={!!disabled}
        onClick={() => uploaderRef.current?.pauseKind(kind)}
        style={datButtonGhost}
        className="dat-btn-ghost"
      >
        Pause
      </button>
      <button
        type="button"
        disabled={!!disabled}
        onClick={() => uploaderRef.current?.resumeKind(kind, { alumniId: stableAlumniId })}
        style={datButtonGhost}
        className="dat-btn-ghost"
      >
        Resume
      </button>
      <button
        type="button"
        disabled={!!disabled}
        onClick={() => uploaderRef.current?.cancelKind(kind)}
        style={{
          ...datButtonGhost,
          border: "1px solid rgba(242,51,89,0.7)",
          background: "rgba(242,51,89,0.15)",
        }}
        className="dat-btn-ghost"
      >
        Cancel
      </button>
    </div>
  );
}

/**
 * FailedList: lists failed tasks for one kind + retry buttons
 */
export function FailedList({
  kind,
  failed,
  uploaderRef,
  stableAlumniId,
  datButtonGhost,
  COLOR,
  setFailed,
}: {
  kind: UploadKind;
  failed: Record<UploadKind, string[]>;
  uploaderRef: React.MutableRefObject<any | null>;
  stableAlumniId: string;
  datButtonGhost: React.CSSProperties;
  COLOR: { snow: string };
  setFailed: React.Dispatch<React.SetStateAction<Record<UploadKind, string[]>>>;
}) {
  const ids = failed[kind];
  if (!ids.length) return null;

  const tasks: UploadTask[] =
    uploaderRef.current?.getTasks().filter((t: UploadTask) => ids.includes(t.id)) ?? [];

  const retryOne = (id: string) => {
    const t: UploadTask | undefined = uploaderRef.current?.getTaskById(id);
    if (!t) return;

    const ff = { alumniId: stableAlumniId };
    uploaderRef.current?.resumeKind(kind, ff);
    uploaderRef.current?.enqueue({ kind, files: [t.file], formFields: ff });

    setFailed((f) => ({ ...f, [kind]: f[kind].filter((x) => x !== id) }));
    uploaderRef.current?.start();
  };

  const retryAll = () => {
    const ff = { alumniId: stableAlumniId };
    const files = tasks.map((t) => t.file);
    if (!files.length) return;

    uploaderRef.current?.resumeKind(kind, ff);
    uploaderRef.current?.enqueue({ kind, files, formFields: ff });

    setFailed((f) => ({ ...f, [kind]: [] }));
    uploaderRef.current?.start();
  };

  return (
    <div
      style={{
        marginTop: 12,
        background: "rgba(242,51,89,0.12)",
        borderRadius: 8,
        padding: 12,
        color: COLOR.snow,
      }}
    >
      <div style={{ marginBottom: 8, fontWeight: 600 }}>Some files failed to upload:</div>

      <ul style={{ marginLeft: 18, listStyle: "disc" }}>
        {tasks.map((t) => (
          <li key={t.id} style={{ margin: "6px 0" }}>
            {t.file.name} ({prettyMB(t.file.size)} MB)
            <button
              type="button"
              onClick={() => retryOne(t.id)}
              style={{ ...datButtonGhost, padding: "4px 8px", marginLeft: 10 }}
              className="dat-btn-ghost"
            >
              Retry
            </button>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 8 }}>
        <button type="button" onClick={retryAll} style={datButtonGhost} className="dat-btn-ghost">
          Retry all failed
        </button>
      </div>
    </div>
  );
}

/**
 * UploadProgressSection: optional wrapper that renders the entire progress block
 */
export function UploadProgressSection({
  progress,
  failed,
  loading,
  uploaderRef,
  stableAlumniId,
  datButtonGhost,
  COLOR,
  setFailed,
}: {
  progress: Record<UploadKind, { uploaded: number; total: number; pct: number }>;
  failed: Record<UploadKind, string[]>;
  loading: boolean;
  uploaderRef: React.MutableRefObject<any | null>;
  stableAlumniId: string;
  datButtonGhost: React.CSSProperties;
  COLOR: { snow: string };
  setFailed: React.Dispatch<React.SetStateAction<Record<UploadKind, string[]>>>;
}) {
  const hasAny =
    progress.headshot.total > 0 ||
    progress.album.total > 0 ||
    progress.reel.total > 0 ||
    progress.event.total > 0;

  if (!hasAny) return null;

  return (
    <div style={{ marginTop: 18 }}>
      {(["headshot", "album", "reel", "event"] as UploadKind[]).map((k) =>
        progress[k].total > 0 ? (
          <div key={k} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 6 }}>
              {k[0].toUpperCase() + k.slice(1)} uploads {progress[k].pct}% &nbsp;(
              {prettyMB(progress[k].uploaded)} / {prettyMB(progress[k].total)} MB)
            </div>

            <ProgressBar value={progress[k].pct} />

            <UploadControls
              kind={k}
              disabled={loading}
              uploaderRef={uploaderRef}
              stableAlumniId={stableAlumniId}
              datButtonGhost={datButtonGhost}
            />

            <FailedList
              kind={k}
              failed={failed}
              uploaderRef={uploaderRef}
              stableAlumniId={stableAlumniId}
              datButtonGhost={datButtonGhost}
              COLOR={COLOR}
              setFailed={setFailed}
            />
          </div>
        ) : null
      )}
    </div>
  );
}
