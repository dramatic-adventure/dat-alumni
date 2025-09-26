"use client";

import { useEffect, useMemo, useState } from "react";

type LivePatch = Record<string, string>;
type Profile = {
  alumniId: string;
  name?: string;
  location?: string;
  artistStatement?: string;
  website?: string;
  instagram?: string;
  headshotUrl?: string;
};

export default function UpdateForm({ email }: { email: string }) {
  // You can map email→alumniId server-side later; for now let the artist type it once
  const [alumniId, setAlumniId] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Basic fields
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [artistStatement, setArtistStatement] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");

  // Headshot upload state
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!headshotFile) return;
    const url = URL.createObjectURL(headshotFile);
    setHeadshotPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [headshotFile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!alumniId) return setMsg("Please enter your alumni ID (slug).");

    setLoading(true);
    setMsg(null);
    try {
      // 1) If a headshot is chosen, upload it first
      if (headshotFile) {
        const fd = new FormData();
        fd.set("file", headshotFile);
        fd.set("alumniId", alumniId);
        fd.set("kind", "headshot");
        fd.set("name", headshotFile.name);

        const up = await fetch("/api/upload", { method: "POST", body: fd });
        const upJson = await up.json();
        if (!up.ok) throw new Error(upJson?.error || "Upload failed");

        // After upload, /api/upload already appends Profile-Media and updates Profile-Live
      }

      // 2) Write Profile-Changes (pending) for simple fields
      const patch: LivePatch = {};
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

      setMsg("✅ Saved! Your profile will show the new headshot immediately, and text changes are marked pending.");
    } catch (err: any) {
      setMsg(`❌ ${err.message || err}`);
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
        {/* Alumni ID (slug) */}
        <div>
          <label className="block mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Alumni ID (your profile slug)
          </label>
          <input
            value={alumniId}
            onChange={(e) => setAlumniId(e.target.value.trim().toLowerCase())}
            required
            className="w-full border rounded-md px-3 py-2"
            placeholder="e.g. isabel-martinez"
          />
          <p className="text-sm text-gray-500 mt-1">We’ll map this to your profile rows in the sheet.</p>
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

        {/* Headshot uploader (DAT purple button) */}
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

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
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
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "inline-block",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>

        {msg && (
          <div className="mt-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            {msg}
          </div>
        )}
      </form>
    </div>
  );
}
