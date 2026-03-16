"use client";

import { useState } from "react";

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
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 24px",
        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <a
          href="/alumni/update"
          style={{ opacity: 0.5, fontSize: 13, textDecoration: "none", color: "inherit" }}
        >
          ← Back to Profile Studio
        </a>
      </div>

      <h1
        style={{
          fontFamily: "var(--font-anton), system-ui, sans-serif",
          fontSize: "clamp(24px, 4vw, 36px)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 8,
        }}
      >
        Invite Links
      </h1>
      <p style={{ opacity: 0.6, marginBottom: 32, fontSize: 14 }}>
        {alumni.length} alumni in Profile-Live. Generate single-use links valid for 30 days.
        Already-claimed profiles are skipped automatically.
      </p>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
        <button
          onClick={() => generate(alumni)}
          disabled={loading}
          style={{
            background: "#6c00af",
            color: "#f2f2f2",
            border: "none",
            borderRadius: 10,
            padding: "10px 20px",
            fontWeight: 700,
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
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
              padding: "10px 20px",
              fontWeight: 700,
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              cursor: "pointer",
            }}
          >
            {copied === "__all__" ? "Copied!" : `Copy All (Name + Link + Expiry)`}
          </button>
        )}
      </div>

      {error && (
        <p style={{ color: "#f87171", marginBottom: 16, fontSize: 13 }}>{error}</p>
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
                }}
              >
                {f === "all" ? `All (${results.length})` : f === "new" ? `New / Renewed (${newCount})` : "Needs link"}
              </button>
            ))}
          </div>

          <div
            style={{
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.06)" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, opacity: 0.7 }}>Name</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, opacity: 0.7 }}>Status</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, opacity: 0.7 }}>Use by</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, opacity: 0.7 }}>Link</th>
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
                    <td style={{ padding: "10px 14px", opacity: 0.7 }}>{STATUS_LABEL[r.status]}</td>
                    <td style={{ padding: "10px 14px", opacity: r.expiresAtFormatted ? 1 : 0.3 }}>
                      {r.expiresAtFormatted || "—"}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {r.inviteUrl ? (
                        <button
                          onClick={() => copyLink(r.inviteUrl, r.alumniId)}
                          style={{
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: 6,
                            padding: "4px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            color: "inherit",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {copied === r.alumniId ? "Copied!" : "Copy Link"}
                        </button>
                      ) : (
                        <span style={{ opacity: 0.3, fontSize: 12 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
