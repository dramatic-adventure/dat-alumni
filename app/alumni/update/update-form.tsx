"use client";

import { useEffect, useMemo, useState } from "react";

/** ─────────────────────────────────────────────────────────────
 * Simple Toast (no libs)
 * ────────────────────────────────────────────────────────────*/
function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  if (!msg) return null;
  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        padding: "12px 16px",
        borderRadius: 12,
        background: type === "success" ? "#0ea5e9" : "#ef4444",
        color: "#fff",
        fontFamily: '"Space Grotesk", sans-serif',
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        zIndex: 99999,
      }}
    >
      {msg}
    </div>
  );
}

export default function UpdateForm({ email }: { email: string }) {
  // identity
  const [alumniId, setAlumniId] = useState("");
  const [autoDetected, setAutoDetected] = useState(false);

  // fields
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [artistStatement, setArtistStatement] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");

  // headshot
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(null);

  // albums / reels / events
  const [albumFiles, setAlbumFiles] = useState<File[]>([]);
  const [reelFiles, setReelFiles] = useState<File[]>([]);
  const [eventFiles, setEventFiles] = useState<File[]>([]);

  // ux
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  }

  // preview
  useEffect(() => {
    if (!headshotFile) return;
    const url = URL.createObjectURL(headshotFile);
    setHeadshotPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [headshotFile]);

  // auto-detect alumniId by email
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`/api/alumni/lookup?email=${encodeURIComponent(email)}`, { cache: "no-store" });
        if (!res.ok) return;
        const j = await res.json();
        if (j?.alumniId) {
          setAlumniId(j.alumniId);
          setAutoDetected(true);
        }
      } catch {
        /* ignore */
      }
    };
    if (email) run();
  }, [email]);

  async function uploadOne(kind: "headshot" | "album" | "reel" | "event", file: File) {
    const fd = new FormData();
    fd.set("file", file);
    fd.set("alumniId", alumniId);
    fd.set("kind", kind);
    fd.set("name", file.name);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || `Upload ${kind} failed`);
    return json;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!alumniId) {
      showToast("Please provide your alumni ID (slug).", "error");
      return;
    }

    setLoading(true);
    try {
      // 1) Headshot first (promotes to current in Profile-Live)
      if (headshotFile) {
        await uploadOne("headshot", headshotFile);
      }

      // 2) Albums (multiple images)
      if (albumFiles.length > 0) {
        for (const f of albumFiles) await uploadOne("album", f);
      }

      // 3) Reels (likely video)
      if (reelFiles.length > 0) {
        for (const f of reelFiles) await uploadOne("reel", f);
      }

      // 4) Events (image/pdf)
      if (eventFiles.length > 0) {
        for (const f of eventFiles) await uploadOne("event", f);
      }

      // 5) Text fields → Profile-Changes
      const patch: Record<string, string> = {};
      if (name) patch.name = name;
      if (location) patch.location = location;
      if (artistStatement) patch.artistStatement = artistStatement;
      if (website) patch.website = website;
      if (instagram) patch.instagram = instagram;

      if (Object.keys(patch).length > 0) {
        const res = await fetch("/api/alumni/save", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alumniId, changes: patch }),
        });
        const j = await res.json();
        if (!res.ok || !j.ok) throw new Error(j?.error || "Save failed");
      }

      showToast("Saved! Headshot is live; text pending review.");
      // Optional: clear file pickers
      setHeadshotFile(null);
      setAlbumFiles([]);
      setReelFiles([]);
      setEventFiles([]);
    } catch (err: any) {
      showToast(err?.message || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-3xl mb-1" style={{ fontFamily: "Anton, sans-serif", textTransform: "uppercase" }}>
        Update Your Alumni Profile
      </h1>
      <p className="mb-8" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#333" }}>
        Signed in as <strong>{email}</strong>
      </p>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Alumni ID (slug) — auto-filled, editable */}
        <div>
          <label className="block mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Alumni ID (your profile slug)
          </label>
          <input
            value={alumniId}
            onChange={(e) => {
              setAlumniId(e.target.value.trim().toLowerCase());
              setAutoDetected(false);
            }}
            required
            className="w-full border rounded-md px-3 py-2"
            placeholder="e.g. isabel-martinez"
          />
          <p className="text-sm text-gray-500 mt-1">
            {autoDetected ? "Detected from your Google email. You can edit if needed." : "Enter the slug shown in your profile URL."}
          </p>
        </div>

        {/* Text fields */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Artist Statement</label>
          <textarea
            value={artistStatement}
            onChange={(e) => setArtistStatement(e.target.value)}
            className="w-full border rounded-md px-3 py-2 min-h-[120px]"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Website</label>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Instagram</label>
            <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="@handle" />
          </div>
        </div>

        {/* Headshot uploader */}
        <div>
          <label className="block mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Headshot</label>
          <div className="flex items-center gap-4">
            <label style={{ display: "inline-block" }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setHeadshotFile(e.target.files?.[0] ?? null)}
                style={{ display: "none" }}
              />
              <span
                style={{
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.35rem",
                  fontSize: "1.1rem",
                  color: "#f2f2f2",
                  backgroundColor: "#6c00af",
                  padding: "12px 30px",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  display: "inline-block",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Choose Headshot
              </span>
            </label>

            {headshotPreview && (
              <img
                src={headshotPreview}
                alt="preview"
                className="h-24 w-24 object-cover"
                style={{ borderRadius: 0, boxShadow: "0 6px 18px rgba(0,0,0,0.18)" }}
              />
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">JPEG/PNG preferred. Uploading sets this as your current headshot immediately.</p>
        </div>

        {/* Album images (multiple) */}
        <div>
          <label className="block mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Journey Album Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setAlbumFiles(Array.from(e.target.files || []))}
            className="block"
          />
          {albumFiles.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">{albumFiles.length} file(s) selected</p>
          )}
        </div>

        {/* Reels (video) */}
        <div>
          <label className="block mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Reels / Video</label>
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={(e) => setReelFiles(Array.from(e.target.files || []))}
            className="block"
          />
          {reelFiles.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">{reelFiles.length} file(s) selected</p>
          )}
        </div>

        {/* Events (image/pdf) */}
        <div>
          <label className="block mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Event Flyers / Media (image or PDF)</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={(e) => setEventFiles(Array.from(e.target.files || []))}
            className="block"
          />
          {eventFiles.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">{eventFiles.length} file(s) selected</p>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || !alumniId}
            style={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.35rem",
              fontSize: "1.1rem",
              color: "#f2f2f2",
              backgroundColor: "#6c00af",
              padding: "12px 30px",
              border: "none",
              borderRadius: "12px",
              cursor: loading || !alumniId ? "not-allowed" : "pointer",
              opacity: loading || !alumniId ? 0.7 : 1,
              display: "inline-block",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
