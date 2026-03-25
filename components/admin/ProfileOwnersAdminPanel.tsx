"use client";

import { useState } from "react";

export default function ProfileOwnersAdminPanel() {
  const [alumniId, setAlumniId] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [force, setForce] = useState(false);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/profile-owners/upsert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ alumniId, ownerEmail, force }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        setMsg(json?.error || `Request failed (${res.status})`);
        return;
      }

      setMsg(`✅ Saved: ${json.alumniId} ↔ ${json.ownerEmail}`);
    } catch (e: any) {
      setMsg(e?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold uppercase tracking-[0.25em] opacity-80">
        Admin: Profile Owners
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <input
          value={alumniId}
          onChange={(e) => setAlumniId(e.target.value)}
          placeholder="alumniId (e.g. isa-martinez)"
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
        />
        <input
          value={ownerEmail}
          onChange={(e) => setOwnerEmail(e.target.value)}
          placeholder="ownerEmail (Google email)"
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
        />
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={force}
          onChange={(e) => setForce(e.target.checked)}
        />
        Force replace existing mapping (only if needed)
      </label>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={submit}
          disabled={busy}
          className="rounded-xl bg-[#6c00af] px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-60"
        >
          {busy ? "Saving..." : "Save Owner"}
        </button>

        {msg ? <div className="text-sm opacity-90">{msg}</div> : null}
      </div>
    </div>
  );
}