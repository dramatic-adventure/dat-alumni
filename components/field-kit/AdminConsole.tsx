// components/field-kit/AdminConsole.tsx
//
// Slice 3 (Notifications) — the admin-only staff console UI. Two trigger actions
// (Send Field Update, Set Rally Point) each write a Notifications row AND send a
// push via the gated admin API. Below them, a Sent-history log with WhatsApp/SMS
// copy-to-clipboard per message — the kit never auto-sends to those channels; it
// just generates the text for staff to paste.
//
// The page already gated admin access server-side; this component assumes it.

"use client";

import { useCallback, useState } from "react";
import { Megaphone, MapPin, Loader2 } from "lucide-react";
import { T, FONT } from "@/components/field-kit/tokens";
import {
  label,
  field,
  primaryBtn,
  smallBtn,
  card,
  sectionTitle,
  sectionHint,
} from "@/components/field-kit/adminStyles";
import {
  AdminRollCallSection,
  AdminCompanyChoiceSection,
  type AdminRollCallInitial,
  type AdminChoiceInitial,
} from "@/components/field-kit/AdminOps";
import type { NotificationRow } from "@/lib/notifications";
import type { RallyPoint } from "@/lib/programItinerary";

function absolute(link: string): string {
  if (!link) return "";
  try {
    return new URL(link, window.location.origin).href;
  } catch {
    return link;
  }
}

// Staff-chosen expiration choices (minutes; 0 = never). Applied to the push
// delivery TTL, the sheet row, and — for rally points — the Today banner,
// which auto-hides once the expiration passes.
const EXPIRY_OPTIONS: { label: string; value: number }[] = [
  { label: "No expiration", value: 0 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "4 hours", value: 240 },
  { label: "8 hours", value: 480 },
  { label: "24 hours", value: 1440 },
];

function ExpirySelect({
  id,
  value,
  onChange,
  hint,
}: {
  id: string;
  value: number;
  onChange: (v: number) => void;
  hint: string;
}) {
  return (
    <>
      <label style={label} htmlFor={id}>
        Expires
      </label>
      <select
        id={id}
        style={{ ...field, appearance: "auto" as const }}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        title={hint}
      >
        {EXPIRY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </>
  );
}

function whatsappText(n: { title: string; body: string; link: string }): string {
  return [`*${n.title}*`, n.body, absolute(n.link)].filter(Boolean).join("\n");
}
function smsText(n: { title: string; body: string; link: string }): string {
  return [n.title, n.body, absolute(n.link)].filter(Boolean).join("\n");
}

export default function AdminConsole({
  programId,
  initialHistory,
  initialRally,
  initialRollCall,
  initialChoice,
  todayDayId,
}: {
  programId: string;
  initialHistory: NotificationRow[];
  initialRally: RallyPoint | null;
  initialRollCall: AdminRollCallInitial | null;
  initialChoice: AdminChoiceInitial | null;
  todayDayId: string;
}) {
  const [history, setHistory] = useState<NotificationRow[]>(initialHistory);
  const [notice, setNotice] = useState<string | null>(null);
  const [clearingId, setClearingId] = useState<string | null>(null);

  // Send Field Update form
  const [uTitle, setUTitle] = useState("");
  const [uBody, setUBody] = useState("");
  const [uExpiry, setUExpiry] = useState(0);
  const [uBusy, setUBusy] = useState(false);

  // Set Rally Point form
  const [rLocation, setRLocation] = useState(initialRally?.location ?? "");
  const [rLookFor, setRLookFor] = useState(initialRally?.lookFor ?? "");
  const [rMeet, setRMeet] = useState(initialRally?.meetTime ?? "");
  const [rDepart, setRDepart] = useState(initialRally?.departure ?? "");
  const [rExpiry, setRExpiry] = useState(0);
  const [rBusy, setRBusy] = useState(false);
  const [hasRally, setHasRally] = useState(!!initialRally);

  const flash = useCallback((msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice((cur) => (cur === msg ? null : cur)), 4000);
  }, []);

  const refreshHistory = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/field-kit/admin/history?program=${encodeURIComponent(programId)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = (await res.json()) as { notifications?: NotificationRow[] };
        if (Array.isArray(data.notifications)) setHistory(data.notifications);
      }
    } catch {
      /* leave existing history */
    }
  }, [programId]);

  const sendUpdate = useCallback(async () => {
    if (!uTitle.trim() || !uBody.trim() || uBusy) return;
    setUBusy(true);
    try {
      const res = await fetch("/api/field-kit/admin/notify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          program: programId,
          title: uTitle.trim(),
          body: uBody.trim(),
          ...(uExpiry > 0 ? { expiresInMinutes: uExpiry } : {}),
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; sent?: number; total?: number; sendError?: string; error?: string }
        | null;
      if (!res.ok || !data?.ok) {
        flash(data?.error || "Send failed");
        return;
      }
      setUTitle("");
      setUBody("");
      flash(
        data.sendError
          ? `Logged, but push failed: ${data.sendError}`
          : `Update sent to ${data.sent ?? 0} of ${data.total ?? 0} devices`
      );
      await refreshHistory();
    } finally {
      setUBusy(false);
    }
  }, [uTitle, uBody, uExpiry, uBusy, programId, flash, refreshHistory]);

  const setRally = useCallback(async () => {
    if (!rLocation.trim() || rBusy) return;
    setRBusy(true);
    try {
      const res = await fetch("/api/field-kit/admin/rally", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          program: programId,
          location: rLocation.trim(),
          lookFor: rLookFor.trim(),
          meetTime: rMeet.trim(),
          departure: rDepart.trim(),
          ...(rExpiry > 0 ? { expiresInMinutes: rExpiry } : {}),
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; sent?: number; total?: number; sendError?: string; error?: string }
        | null;
      if (!res.ok || !data?.ok) {
        flash(data?.error || "Could not set rally point");
        return;
      }
      setHasRally(true);
      flash(
        data.sendError
          ? `Rally point set, but push failed: ${data.sendError}`
          : `Rally point set · pushed to ${data.sent ?? 0} of ${data.total ?? 0} devices`
      );
      await refreshHistory();
    } finally {
      setRBusy(false);
    }
  }, [rLocation, rLookFor, rMeet, rDepart, rExpiry, rBusy, programId, flash, refreshHistory]);

  const clearRally = useCallback(async () => {
    if (rBusy) return;
    setRBusy(true);
    try {
      const res = await fetch("/api/field-kit/admin/rally", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ program: programId }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        flash(data?.error || "Could not clear rally point");
        return;
      }
      setHasRally(false);
      setRLocation("");
      setRLookFor("");
      setRMeet("");
      setRDepart("");
      flash("Rally point cleared — the Today banner is gone");
    } finally {
      setRBusy(false);
    }
  }, [rBusy, programId, flash]);

  // "Clear" a history entry — marks the Sheet row cancelled (kept as an audit
  // trail) and hides it here. A push already on phones can't be recalled.
  const clearNotification = useCallback(
    async (n: NotificationRow) => {
      if (clearingId) return;
      if (!window.confirm(`Clear "${n.title}" from the history? Alerts already on phones aren't recalled.`)) {
        return;
      }
      setClearingId(n.id);
      try {
        const res = await fetch("/api/field-kit/admin/history", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ program: programId, id: n.id }),
        });
        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; error?: string }
          | null;
        if (!res.ok || !data?.ok) {
          flash(data?.error || "Could not clear notification");
          return;
        }
        setHistory((cur) => cur.filter((h) => h.id !== n.id));
        flash("Notification cleared");
        await refreshHistory();
      } finally {
        setClearingId(null);
      }
    },
    [clearingId, programId, flash, refreshHistory]
  );

  const copy = useCallback(
    async (text: string, kind: string) => {
      try {
        await navigator.clipboard.writeText(text);
        flash(`${kind} text copied`);
      } catch {
        flash("Copy failed — select and copy manually");
      }
    },
    [flash]
  );

  return (
    <main style={{ maxWidth: 620, margin: "0 auto", padding: "20px clamp(14px, 4vw, 24px) 96px" }}>
      <p
        style={{
          fontFamily: FONT.grotesk,
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: T.teal,
          margin: "0 0 4px",
        }}
      >
        Staff console
      </p>
      <h1
        style={{
          fontFamily: FONT.anton,
          fontSize: "clamp(26px, 6vw, 40px)",
          lineHeight: 0.96,
          textTransform: "uppercase",
          color: T.ink,
          margin: "0 0 20px",
        }}
      >
        Field updates
      </h1>

      {/* Roll Call + Company Choice (Slice 5) — the other two mission-board
          modules, alongside Rally Point below. */}
      <AdminRollCallSection
        programId={programId}
        initial={initialRollCall}
        todayDayId={todayDayId}
        flash={flash}
      />
      <AdminCompanyChoiceSection programId={programId} initial={initialChoice} flash={flash} />

      {/* Send Field Update */}
      <section style={card}>
        <h2 style={sectionTitle}>
          <Megaphone size={18} aria-hidden /> Send field update
        </h2>
        <p style={sectionHint}>A push to everyone on the trip with alerts turned on.</p>
        <label style={label} htmlFor="u-title">
          Title
        </label>
        <input
          id="u-title"
          style={field}
          value={uTitle}
          onChange={(e) => setUTitle(e.target.value)}
          placeholder="Change of plans"
          maxLength={80}
        />
        <label style={label} htmlFor="u-body">
          Message
        </label>
        <textarea
          id="u-body"
          style={{ ...field, minHeight: 84, resize: "vertical" }}
          value={uBody}
          onChange={(e) => setUBody(e.target.value)}
          placeholder="What the cohort needs to know…"
          maxLength={400}
        />
        <ExpirySelect
          id="u-expiry"
          value={uExpiry}
          onChange={setUExpiry}
          hint="Phones offline past this window won't receive the (stale) alert"
        />
        <button
          type="button"
          style={{ ...primaryBtn, opacity: uTitle.trim() && uBody.trim() && !uBusy ? 1 : 0.5 }}
          onClick={sendUpdate}
          disabled={!uTitle.trim() || !uBody.trim() || uBusy}
        >
          {uBusy ? <Loader2 size={15} className="spin" aria-hidden /> : <Megaphone size={15} aria-hidden />}
          {uBusy ? "Sending…" : "Send update"}
        </button>
      </section>

      {/* Set Rally Point */}
      <section style={card}>
        <h2 style={sectionTitle}>
          <MapPin size={18} aria-hidden /> Set rally point
        </h2>
        <p style={sectionHint}>
          Updates the current rally point (shown on Today + saved offline) and pushes it to the cohort.
        </p>
        <label style={label} htmlFor="r-loc">
          Location
        </label>
        <input
          id="r-loc"
          style={field}
          value={rLocation}
          onChange={(e) => setRLocation(e.target.value)}
          placeholder="Main square fountain"
          maxLength={120}
        />
        <label style={label} htmlFor="r-look">
          Look for
        </label>
        <input
          id="r-look"
          style={field}
          value={rLookFor}
          onChange={(e) => setRLookFor(e.target.value)}
          placeholder="Yellow DAT flag"
          maxLength={120}
        />
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={label} htmlFor="r-meet">
              Meet by
            </label>
            <input
              id="r-meet"
              style={field}
              value={rMeet}
              onChange={(e) => setRMeet(e.target.value)}
              placeholder="3:30pm"
              maxLength={40}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={label} htmlFor="r-depart">
              Departs
            </label>
            <input
              id="r-depart"
              style={field}
              value={rDepart}
              onChange={(e) => setRDepart(e.target.value)}
              placeholder="3:45pm sharp"
              maxLength={40}
            />
          </div>
        </div>
        <ExpirySelect
          id="r-expiry"
          value={rExpiry}
          onChange={setRExpiry}
          hint="The Today banner hides itself once this passes"
        />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            style={{ ...primaryBtn, opacity: rLocation.trim() && !rBusy ? 1 : 0.5 }}
            onClick={setRally}
            disabled={!rLocation.trim() || rBusy}
          >
            {rBusy ? <Loader2 size={15} className="spin" aria-hidden /> : <MapPin size={15} aria-hidden />}
            {rBusy ? "Setting…" : "Set rally point & notify"}
          </button>
          {hasRally && (
            <button
              type="button"
              style={{ ...smallBtn, alignSelf: "center", opacity: rBusy ? 0.5 : 1 }}
              onClick={clearRally}
              disabled={rBusy}
            >
              Clear rally point
            </button>
          )}
        </div>
      </section>

      {/* Sent history */}
      <section>
        <h2 style={{ ...sectionTitle, fontSize: 15, marginBottom: 12 }}>Sent history</h2>
        {history.length === 0 ? (
          <p style={sectionHint}>Nothing sent yet.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {history.map((n) => (
              <li
                key={n.id}
                style={{
                  background: T.paper,
                  border: `1px solid ${T.sep}`,
                  borderRadius: 11,
                  padding: "11px 13px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span
                    style={{
                      fontFamily: FONT.grotesk,
                      fontSize: 8.5,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: n.type === "rally" ? T.pink : T.teal,
                      border: `1px solid ${n.type === "rally" ? T.pink : T.teal}`,
                      borderRadius: 4,
                      padding: "1px 5px",
                    }}
                  >
                    {n.type}
                  </span>
                  <span style={{ fontFamily: FONT.dm, fontSize: 11, color: T.dim }}>
                    {n.sentAt ? new Date(n.sentAt).toLocaleString() : "not sent"}
                  </span>
                </div>
                <div style={{ fontFamily: FONT.dm, fontSize: 14, fontWeight: 700, color: T.ink }}>
                  {n.title}
                </div>
                {n.body && (
                  <div style={{ fontFamily: FONT.dm, fontSize: 13, color: T.muted, marginTop: 2 }}>
                    {n.body}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 9, flexWrap: "wrap" }}>
                  <button type="button" style={smallBtn} onClick={() => copy(whatsappText(n), "WhatsApp")}>
                    Copy for WhatsApp
                  </button>
                  <button type="button" style={smallBtn} onClick={() => copy(smsText(n), "SMS")}>
                    Copy for SMS
                  </button>
                  <button
                    type="button"
                    style={{
                      ...smallBtn,
                      marginLeft: "auto",
                      color: T.pink,
                      borderColor: T.pink,
                      opacity: clearingId && clearingId !== n.id ? 0.5 : 1,
                    }}
                    onClick={() => clearNotification(n)}
                    disabled={!!clearingId}
                    title="Removes this from the history and stops any future delivery. Alerts already on phones aren't recalled."
                  >
                    {clearingId === n.id ? "Clearing…" : "Clear"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {notice && (
        <div
          role="status"
          style={{
            position: "fixed",
            left: "50%",
            bottom: "calc(env(safe-area-inset-bottom) + 76px)",
            transform: "translateX(-50%)",
            zIndex: 60,
            fontFamily: FONT.grotesk,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: T.ink,
            backgroundColor: "rgba(14,10,19,0.94)",
            border: `1px solid ${T.border}`,
            borderRadius: 999,
            padding: "9px 16px",
            boxShadow: "0 8px 24px rgba(14,10,19,0.5)",
            maxWidth: "90vw",
            textAlign: "center",
          }}
        >
          {notice}
        </div>
      )}

      <style>{`@keyframes fk-spin{to{transform:rotate(360deg)}} .spin{animation:fk-spin 0.8s linear infinite}`}</style>
    </main>
  );
}
