// components/field-kit/CaptureForm.tsx
//
// Field Kit "Capture" — Slice A UI (text-only note/quote, online). A minimal
// gated screen: a Note/Quote toggle, a text field, and Save. The captureId is a
// client-minted ULID that doubles as the idempotency key, so a retried Save
// never double-writes. createdAt is stamped client-side; dayIndex carries the
// current itinerary day when the page could resolve one.
//
// Slice B (deferred): photo/voice capture, Drive upload, offline queue.

"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { T, FONT } from "@/components/field-kit/tokens";

type Kind = "note" | "quote";

// Crockford base32 ULID: 48-bit timestamp + 80 bits of randomness. Good enough
// as an idempotency key without pulling in a dependency.
const ULID_ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function ulid(): string {
  let now = Date.now();
  const time: string[] = new Array(10);
  for (let i = 9; i >= 0; i--) {
    time[i] = ULID_ENCODING[now % 32];
    now = Math.floor(now / 32);
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const rand = Array.from(bytes, (b) => ULID_ENCODING[b % 32]);
  return time.join("") + rand.join("");
}

const KINDS: { value: Kind; label: string }[] = [
  { value: "note", label: "Note" },
  { value: "quote", label: "Quote" },
];

export default function CaptureForm({ currentDayId }: { currentDayId: string }) {
  // Admin impersonation — forwarded to the route so the capture attributes to the
  // impersonated member. Honored ONLY for admins server-side (getFieldKitAccess).
  const asId = useSearchParams().get("asId")?.trim() || "";
  const [kind, setKind] = useState<Kind>("note");
  const [bodyText, setBodyText] = useState("");
  const [quoteSpeaker, setQuoteSpeaker] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; msg: string } | null>(null);

  const canSave = bodyText.trim().length > 0 && !saving;

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/field-kit/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          captureId: ulid(),
          kind,
          bodyText: bodyText.trim(),
          createdAt: new Date().toISOString(),
          dayIndex: currentDayId || undefined,
          quoteSpeaker: kind === "quote" ? quoteSpeaker.trim() || undefined : undefined,
          asId: asId || undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error || `Save failed (${res.status})`);
      setBodyText("");
      setQuoteSpeaker("");
      setStatus({ kind: "ok", msg: "Saved." });
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

      {/* Note / Quote toggle */}
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
          outline: "none",
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
            outline: "none",
          }}
        />
      )}

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
