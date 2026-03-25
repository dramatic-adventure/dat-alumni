"use client";

import { useState } from "react";
import Image from "next/image";

type AlumniEntry = { alumniId: string; alumniName: string };

type Result = {
  alumniId: string;
  alumniName: string;
  status: "generated" | "renewed" | "already_owned" | "active_exists";
  inviteUrl: string;
  expiresAt: string;
  expiresAtFormatted: string;
};

const STATUS_LABEL: Record<Result["status"], string> = {
  generated: "✅ New link",
  renewed: "🔄 Renewed",
  already_owned: "👤 Already claimed",
  active_exists: "⏳ Active link",
};

export default function InvitesClient({ alumni }: { alumni: AlumniEntry[] }) {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "new" | "pending">("all");

  async function generate(subset: AlumniEntry[]) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/invites/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(subset),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      setResults(json.results);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function copyLink(url: string, id: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function copyAll() {
    const rows = filteredResults
      .filter((r) => r.inviteUrl)
      .map((r) => `${r.alumniName}\t${r.inviteUrl}\t${r.expiresAtFormatted}`)
      .join("\n");
    navigator.clipboard.writeText(rows).then(() => {
      setCopied("__all__");
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const filteredResults = results.filter((r) => {
    if (filter === "new") return r.status === "generated" || r.status === "renewed";
    if (filter === "pending") return r.status !== "already_owned";
    return true;
  });

  const newCount = results.filter(
    (r) => r.status === "generated" || r.status === "renewed"
  ).length;

  return (
    <main style={{ minHeight: "100vh", fontFamily: "var(--font-space-grotesk), system-ui, sans-serif" }}>

      {/* ── Hero ── */}
      <div style={{ position: "relative", height: "55vh", overflow: "hidden", boxShadow: "0 0 33px rgba(0,0,0,.5)" }}>
        <Image
          src="/images/alumni-hero.jpg"
          alt="DAT Hero"
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
      </div>

      {/* ── Page content ── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* ── Card ── */}
        <div
          style={{
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            padding: "28px 28px 32px",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {/* Back link + heading */}
          <a
            href="/alumni/update"
            style={{ opacity: 0.45, fontSize: 13, textDecoration: "none", color: "inherit", display: "inline-block", marginBottom: 20 }}
          >
            ← Back to Profile Studio
          </a>

          <h1
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(28px, 5vw, 48px)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 6,
              marginTop: 0,
            }}
          >
            Invite Links
          </h1>
          <p style={{ opacity: 0.5, marginBottom: 28, fontSize: 14, marginTop: 0 }}>
            {alumni.length} alumni in Profile-Live · Single-use · Valid for 30 days · Already-claimed profiles skipped automatically
          </p>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: results.length ? 24 : 0 }}>
            <button
              onClick={() => generate(alumni)}
              disabled={loading}
              style={{
                background: "#6c00af",
                color: "#f2f2f2",
                border: "none",
                borderRadius: 10,
                padding: "10px 22px",
                fontWeight: 700,
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                fontFamily: "inherit",
              }}
            >
              {loading ? "Generating…" : "Generate All Invite Links"}
            </button>

            {results.length > 0 && (
              <button
                onClick={copyAll}
                style={{
                  background: "transparent",
                  color: "inherit",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 10,
                  padding: "10px 22px",
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {copied === "__all__" ? "Copied!" : "Copy All (Name + Link + Expiry)"}
              </button>
            )}
          </div>

          {error && (
            <p style={{ color: "#f87171", marginTop: 12, marginBottom: 0, fontSize: 13 }}>{error}</p>
          )}

          {/* Results */}
          {results.length > 0 && (
            <>
              {/* Filter tabs */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {(["all", "new", "pending"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      background: filter === f ? "rgba(255,255,255,0.12)" : "transparent",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 8,
                      padding: "5px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      cursor: "pointer",
                      color: "inherit",
                      fontFamily: "inherit",
                    }}
                  >
                    {f === "all"
                      ? `All (${results.length})`
                      : f === "new"
                      ? `New / Renewed (${newCount})`
                      : "Needs link"}
                  </button>
                ))}
              </div>

              <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.06)" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, opacity: 0.6 }}>Name</th>
                      <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, opacity: 0.6 }}>Status</th>
                      <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, opacity: 0.6 }}>Use by</th>
                      <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, opacity: 0.6 }}>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((r, i) => (
                      <tr
                        key={r.alumniId}
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.06)",
                          background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                        }}
                      >
                        <td style={{ padding: "10px 14px", fontWeight: 500 }}>{r.alumniName}</td>
                        <td style={{ padding: "10px 14px", opacity: 0.65 }}>{STATUS_LABEL[r.status]}</td>
                        <td style={{ padding: "10px 14px", opacity: r.expiresAtFormatted ? 0.85 : 0.3 }}>
                          {r.expiresAtFormatted || "—"}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          {r.inviteUrl ? (
                            <button
                              onClick={() => copyLink(r.inviteUrl, r.alumniId)}
                              style={{
                                background: "rgba(255,255,255,0.07)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                borderRadius: 6,
                                padding: "4px 12px",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                                color: "inherit",
                                whiteSpace: "nowrap",
                                fontFamily: "inherit",
                              }}
                            >
                              {copied === r.alumniId ? "Copied!" : "Copy Link"}
                            </button>
                          ) : (
                            <span style={{ opacity: 0.25, fontSize: 12 }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
