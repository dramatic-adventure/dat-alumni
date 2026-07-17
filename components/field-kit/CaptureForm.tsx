// components/field-kit/CaptureForm.tsx
//
// Field Kit "Capture" UI — note/quote (Slice A) + photo (Slice B1) + voice
// (Slice B2), online only. A minimal gated screen: a Note/Quote/Photo/Voice
// toggle, the relevant input(s), and Save. The captureId is a client-minted ULID
// that doubles as the idempotency key, so a retried Save never double-writes.
// createdAt is stamped client-side; dayIndex carries the current itinerary day
// when the page could resolve one.
//
// Day binding (Slice 7): a "Capture day" picker lets any capture file under a
// different trip day. Choosing a photo/audio FILE auto-selects the day matching
// the file's timestamp (file.lastModified vs the itinerary's fullDate) so an
// uploaded older photo lands on the day it was taken; the picker is always
// there to override. When the file's timestamp falls on the selected day,
// createdAt is stamped from the file (true capture moment) instead of "now".
//
// The photo file input uses accept="image/*" with NO capture attribute, so the OS
// picker offers Photo Library, Take Photo, and Files. Voice prefers an in-app
// MediaRecorder; if the browser lacks getUserMedia/MediaRecorder (or mic permission
// is denied) it falls back to an accept="audio/*" file input.
//
// Slice C: Save is offline-first. It no longer POSTs directly — it writes the
// capture to a local IndexedDB queue (lib/captureQueue) and kicks the drainer
// (lib/captureSync), which syncs to /api/field-kit/capture when online. Captures
// survive no signal; SyncStatus shows the pending/failed count.

"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { T, FONT } from "@/components/field-kit/tokens";
import { enqueue, type QueuedCapture, type CaptureVisibility } from "@/lib/captureQueue";
import { kick } from "@/lib/captureSync";
import { ulid } from "@/lib/ulid";

type Kind = "note" | "quote" | "photo" | "voice";

// Voice bounds — mirror the server cap; auto-stop the recorder at 5:00.
const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_RECORD_SECONDS = 300; // 5:00

// MediaRecorder mimeType may carry a codecs param (e.g. "audio/webm;codecs=opus").
// The server's allow-set matches bare types, so strip parameters before sending.
function bareAudioType(t: string): string {
  return (t.split(";")[0] || "").trim().toLowerCase() || "audio/webm";
}

function fmtElapsed(s: number): string {
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}

const KINDS: { value: Kind; label: string }[] = [
  { value: "note", label: "Note" },
  { value: "quote", label: "Quote" },
  { value: "photo", label: "Photo" },
  { value: "voice", label: "Voice" },
];

/** Compact trip-day option for the "Capture day" picker (built by the page). */
export type CaptureDayOption = {
  id: string;
  chapterId: string;
  dayNum: number;
  dateLabel: string;
  fullDate: string; // ISO yyyy-mm-dd; "" when the day carries no date
};

/** Local yyyy-mm-dd for an epoch-ms timestamp (device-local, like resolveToday). */
function localIsoDate(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dayLabel(d: CaptureDayOption): string {
  return `Day ${d.dayNum}${d.dateLabel ? ` · ${d.dateLabel}` : ""}`;
}

export default function CaptureForm({
  currentDayId,
  currentChapterId = "",
  days = [],
}: {
  currentDayId: string;
  currentChapterId?: string;
  days?: CaptureDayOption[];
}) {
  // Admin impersonation — forwarded to the route so the capture attributes to the
  // impersonated member. Honored ONLY for admins server-side (getFieldKitAccess).
  const asId = useSearchParams().get("asId")?.trim() || "";
  const [kind, setKind] = useState<Kind>("note");
  const [bodyText, setBodyText] = useState("");
  const [quoteSpeaker, setQuoteSpeaker] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; msg: string } | null>(null);
  // Slice 6 visibility: "card" (default — composable into your Journey Card,
  // still private until you stamp) vs "sealed" (never leaves your journal).
  const [sealed, setSealed] = useState(false);
  // Slice 7 day binding — which trip day this capture files under. Defaults to
  // today; auto-switches when a chosen file's date matches another trip day.
  const [dayId, setDayId] = useState(currentDayId);
  const [dayHint, setDayHint] = useState<string | null>(null);

  // Auto-file an uploaded photo/audio under the day it was taken, when the
  // file's timestamp maps to a trip day. The picker below always allows override.
  function autoDetectDay(f: File | null) {
    if (!f || !f.lastModified || !days.length) return;
    const iso = localIsoDate(f.lastModified);
    const match = days.find((d) => d.fullDate && d.fullDate === iso);
    if (match && match.id !== dayId) {
      setDayId(match.id);
      setDayHint(`Dated from the file — filed under ${dayLabel(match)}. Change below if that's wrong.`);
    } else {
      setDayHint(null);
    }
  }

  // Voice state. recorderSupported defaults false so SSR/first paint shows the
  // fallback file input; the effect flips it on once the client confirms
  // getUserMedia + MediaRecorder. (The voice panel only renders after the user
  // picks Voice — well past hydration — so there's no visible flash.)
  const [recorderSupported, setRecorderSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recError, setRecError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPhoto = kind === "photo";
  const isVoice = kind === "voice";
  // Photo/voice need a file (caption optional); note/quote need text. Can't save
  // mid-recording.
  const canSave =
    (isPhoto ? !!file : isVoice ? !!audioBlob && !recording : bodyText.trim().length > 0) &&
    !saving;

  useEffect(() => {
    setRecorderSupported(
      typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof window !== "undefined" &&
        typeof window.MediaRecorder !== "undefined"
    );
  }, []);

  // Unmount cleanup: stop the timer and release the mic.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Auto-stop at the cap (kept out of the interval updater so setElapsed stays pure).
  useEffect(() => {
    if (recording && elapsed >= MAX_RECORD_SECONDS) stopRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording, elapsed]);

  function stopTracks() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function discardAudio() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setElapsed(0);
    setRecError(null);
  }

  async function startRecording() {
    setRecError(null);
    discardAudio();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      recorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const type = bareAudioType(mr.mimeType || "audio/webm");
        const blob = new Blob(chunksRef.current, { type });
        stopTracks();
        if (blob.size > MAX_AUDIO_BYTES) {
          setRecError("Recording too large (max 25 MB). Try a shorter clip.");
          return;
        }
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };
      mr.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      // Permission denied, no mic, or insecure context → fall back to file input.
      stopTracks();
      setRecording(false);
      setRecorderSupported(false);
      setRecError(
        "Microphone unavailable — grant mic permission (HTTPS required), or pick an audio file below."
      );
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const mr = recorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    setRecording(false);
  }

  // Fallback path: an audio file chosen via the file input.
  function onAudioFile(f: File | null) {
    if (!f) return;
    if (f.size > MAX_AUDIO_BYTES) {
      setRecError("Recording too large (max 25 MB).");
      return;
    }
    discardAudio();
    setAudioBlob(f);
    setAudioUrl(URL.createObjectURL(f));
    autoDetectDay(f);
  }

  function clearForm() {
    setBodyText("");
    setQuoteSpeaker("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    discardAudio();
    setDayId(currentDayId);
    setDayHint(null);
  }

  // Offline-first: write the capture to the local IndexedDB queue (instant), kick
  // the drainer, and report success immediately. The drainer (lib/captureSync) owns
  // the network from here — POSTing to /api/field-kit/capture when connectivity
  // allows, with the captureId ULID as the idempotency key.
  async function save() {
    if (!canSave) return;
    setSaving(true);
    setStatus(null);
    try {
      const online = typeof navigator === "undefined" || navigator.onLine;

      // photo/voice carry the raw Blob (stored directly in IndexedDB). For voice,
      // stamp the bare MIME (no ;codecs= param) the server's allow-set expects.
      let blob: Blob | undefined;
      let blobType: string | undefined;
      if (isVoice && audioBlob) {
        blob = audioBlob;
        blobType = bareAudioType(audioBlob.type);
      } else if (isPhoto && file) {
        blob = file;
        blobType = file.type;
      }

      // Day binding: the selected day wins (defaults to today). Its chapter
      // rides along so the Composer groups the trace under the right act.
      const selectedDay = days.find((d) => d.id === dayId);
      // createdAt: the file's own timestamp when it falls on the selected day
      // (the true capture moment for an uploaded older photo); otherwise now.
      const stampFile: File | null =
        isPhoto && file ? file : isVoice && audioBlob instanceof File ? audioBlob : null;
      const createdAt =
        stampFile?.lastModified &&
        selectedDay?.fullDate &&
        localIsoDate(stampFile.lastModified) === selectedDay.fullDate
          ? new Date(stampFile.lastModified).toISOString()
          : new Date().toISOString();

      const visibility: CaptureVisibility = sealed ? "sealed" : "card";
      const item: QueuedCapture = {
        captureId: ulid(),
        kind,
        bodyText: bodyText.trim(),
        quoteSpeaker: kind === "quote" ? quoteSpeaker.trim() || undefined : undefined,
        createdAt,
        dayIndex: dayId || undefined,
        chapterId: (selectedDay ? selectedDay.chapterId : currentChapterId) || undefined,
        visibility,
        asId: asId || undefined,
        blob,
        blobType,
        status: "pending",
        attempts: 0,
      };

      await enqueue(item);
      kick();
      clearForm();
      setStatus({
        kind: "ok",
        msg: online ? "Saved." : "Saved — will sync when you're online.",
      });
    } catch (e) {
      setStatus({ kind: "error", msg: e instanceof Error ? e.message : "Save failed." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "40px clamp(18px, 5vw, 40px) 96px" }}>
      <p style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: T.teal, margin: "0 0 10px" }}>
        Capture
      </p>
      <h1 style={{ fontFamily: FONT.anton, fontSize: "clamp(28px, 6.5vw, 44px)", lineHeight: 0.96, textTransform: "uppercase", color: T.ink, margin: "0 0 22px" }}>
        Catch it now.
      </h1>

      {/* Note / Quote / Photo / Voice toggle */}
      <div role="tablist" aria-label="Capture type" style={{ display: "inline-flex", gap: 6, padding: 4, borderRadius: 10, background: T.black, border: `1px solid ${T.border}`, marginBottom: 16 }}>
        {KINDS.map((k) => {
          const active = kind === k.value;
          return (
            <button
              key={k.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setKind(k.value)}
              style={{
                fontFamily: FONT.grotesk,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                padding: "8px 18px",
                borderRadius: 7,
                border: "none",
                background: active ? T.yellow : "transparent",
                color: active ? T.black : T.muted,
              }}
            >
              {k.label}
            </button>
          );
        })}
      </div>

      {isPhoto ? (
        <>
          {/* accept="image/*" with NO capture attribute → the OS picker offers
              Photo Library, Take Photo, and Files; the user chooses the source. */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              autoDetectDay(f);
            }}
            aria-label="Choose a photo"
            style={{
              width: "100%",
              boxSizing: "border-box",
              fontFamily: FONT.dm,
              fontSize: 15,
              color: T.ink,
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: "14px 16px",

            }}
          />
          <input
            type="text"
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder="Add a caption (optional)"
            aria-label="Caption"
            style={{
              width: "100%",
              boxSizing: "border-box",
              fontFamily: FONT.dm,
              fontSize: 16,
              lineHeight: 1.5,
              color: T.ink,
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: "12px 16px",
              marginTop: 12,

            }}
          />
        </>
      ) : isVoice ? (
        <>
          {/* In-app recorder when supported; otherwise an audio file input.
              getUserMedia needs a secure context (HTTPS / localhost) + mic grant. */}
          {recorderSupported && !audioBlob ? (
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                style={{
                  fontFamily: FONT.grotesk,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  padding: "12px 26px",
                  borderRadius: 9,
                  border: "none",
                  background: recording ? T.pink : T.yellow,
                  color: T.black,
                }}
              >
                {recording ? "Stop" : "Record"}
              </button>
              <span
                aria-live="polite"
                style={{ fontFamily: FONT.dm, fontSize: 15, color: recording ? T.ink : T.muted, fontVariantNumeric: "tabular-nums" }}
              >
                {recording ? `${fmtElapsed(elapsed)} / 5:00` : "Tap Record to start"}
              </span>
            </div>
          ) : !recorderSupported && !audioBlob ? (
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              onChange={(e) => onAudioFile(e.target.files?.[0] ?? null)}
              aria-label="Choose an audio file"
              style={{
                width: "100%",
                boxSizing: "border-box",
                fontFamily: FONT.dm,
                fontSize: 15,
                color: T.ink,
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: "14px 16px",
  
              }}
            />
          ) : null}

          {audioBlob && audioUrl && (
            <div>
              {/* Playback preview before saving. */}
              <audio controls src={audioUrl} aria-label="Recording preview" style={{ width: "100%", display: "block" }} />
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    discardAudio();
                    if (recorderSupported) startRecording();
                  }}
                  style={{
                    fontFamily: FONT.grotesk,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    padding: "9px 18px",
                    borderRadius: 8,
                    border: `1px solid ${T.border}`,
                    background: "transparent",
                    color: T.ink,
                  }}
                >
                  {recorderSupported ? "Re-record" : "Choose another"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    discardAudio();
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  style={{
                    fontFamily: FONT.grotesk,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    padding: "9px 18px",
                    borderRadius: 8,
                    border: `1px solid ${T.border}`,
                    background: "transparent",
                    color: T.muted,
                  }}
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {recError && (
            <p style={{ fontFamily: FONT.dm, fontSize: 13.5, lineHeight: 1.5, color: T.pink, margin: "10px 0 0" }}>
              {recError}
            </p>
          )}

          <input
            type="text"
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder="Add a caption (optional)"
            aria-label="Caption"
            style={{
              width: "100%",
              boxSizing: "border-box",
              fontFamily: FONT.dm,
              fontSize: 16,
              lineHeight: 1.5,
              color: T.ink,
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: "12px 16px",
              marginTop: 12,

            }}
          />
        </>
      ) : (
        <>
          <textarea
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder={kind === "quote" ? "Something someone said…" : "What just happened…"}
            rows={7}
            style={{
              width: "100%",
              boxSizing: "border-box",
              resize: "vertical",
              fontFamily: FONT.dm,
              fontSize: 16,
              lineHeight: 1.5,
              color: T.ink,
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: "14px 16px",

            }}
          />

          {kind === "quote" && (
            <input
              type="text"
              value={quoteSpeaker}
              onChange={(e) => setQuoteSpeaker(e.target.value)}
              placeholder="Name or who was speaking"
              aria-label="Who said it?"
              style={{
                width: "100%",
                boxSizing: "border-box",
                fontFamily: FONT.dm,
                fontSize: 16,
                lineHeight: 1.5,
                color: T.ink,
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: "12px 16px",
                marginTop: 12,
  
              }}
            />
          )}
        </>
      )}

      {/* Slice 7 — Capture day. Defaults to today; auto-switches when a chosen
          file's date matches another trip day. Manual override for any kind
          (write up yesterday's note, upload Monday's photo on Wednesday). */}
      {days.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <label
            htmlFor="capture-day"
            style={{ display: "block", fontFamily: FONT.grotesk, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.ink, marginBottom: 6 }}
          >
            Capture day
          </label>
          <select
            id="capture-day"
            value={dayId}
            onChange={(e) => {
              setDayId(e.target.value);
              setDayHint(null);
            }}
            style={{
              width: "100%",
              boxSizing: "border-box",
              fontFamily: FONT.dm,
              fontSize: 15,
              color: T.ink,
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: "12px 16px",
            }}
          >
            {!currentDayId && <option value="">No day (unassigned)</option>}
            {days.map((d) => (
              <option key={d.id} value={d.id}>
                {dayLabel(d)}
                {d.id === currentDayId ? " (today)" : ""}
              </option>
            ))}
          </select>
          {dayHint && (
            <p style={{ fontFamily: FONT.dm, fontSize: 12.5, lineHeight: 1.45, color: T.teal, margin: "6px 0 0" }}>
              {dayHint}
            </p>
          )}
        </div>
      )}

      {/* Slice 6 — sealed vs card. Sealed = Private Reflection: never reviewed,
          never published, never offered to the Journey Card. Card (default) is
          still private until the artist stamps in the Publish flow. */}
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          marginTop: 16,
          padding: "12px 14px",
          borderRadius: 10,
          background: sealed ? "rgba(122, 71, 133, 0.10)" : T.card,
          border: `1.5px ${sealed ? "dashed" : "solid"} ${T.border}`,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={sealed}
          onChange={(e) => setSealed(e.target.checked)}
          aria-label="Seal this capture — private reflection, never published"
          style={{ marginTop: 3, accentColor: T.yellow }}
        />
        <span>
          <span
            style={{
              display: "block",
              fontFamily: FONT.grotesk,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: T.ink,
              marginBottom: 2,
            }}
          >
            ✦ Private reflection {sealed ? "· sealed" : ""}
          </span>
          <span style={{ fontFamily: FONT.dm, fontSize: 12.5, lineHeight: 1.45, color: T.muted }}>
            {sealed
              ? "Sealed — never reviewed, never published. It stays in your journal."
              : "Off — this saves toward your card. Still private until you stamp."}
          </span>
        </span>
      </label>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          style={{
            fontFamily: FONT.grotesk,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: canSave ? "pointer" : "default",
            padding: "12px 26px",
            borderRadius: 9,
            border: "none",
            background: canSave ? T.yellow : T.card,
            color: canSave ? T.black : T.muted,
          }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {status && (
          <span style={{ fontFamily: FONT.dm, fontSize: 13.5, color: status.kind === "ok" ? T.green : T.pink }}>
            {status.msg}
          </span>
        )}
      </div>
    </main>
  );
}
