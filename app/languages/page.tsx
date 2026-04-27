// app/languages/page.tsx

import Link from "next/link";
import type { Metadata } from "next";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import { buildLanguageSummaries } from "@/lib/languages";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Languages | Dramatic Adventure Theatre",
  description:
    "Explore DAT alumni by the languages they speak. The DAT network connects artists across cultures and communities worldwide.",
  alternates: { canonical: "/languages" },
  openGraph: {
    title: "Languages | Dramatic Adventure Theatre",
    description:
      "Explore DAT alumni by the languages they speak.",
    url: "/languages",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Languages | Dramatic Adventure Theatre",
    description: "Explore DAT alumni by the languages they speak.",
  },
};

export default async function LanguagesIndexPage() {
  const alumni = await loadVisibleAlumni();
  const languages = buildLanguageSummaries(alumni.map((a) => a.languages));

  return (
    <>
      <style>{`.lang-link:hover { background: rgba(36,147,169,0.15) !important; }`}</style>
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#0e0b14",
        paddingBottom: "6rem",
      }}
    >
      {/* Hero */}
      <section
        style={{
          backgroundColor: "#2493A9",
          padding: "5rem 30px 4rem",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.78rem",
              textTransform: "uppercase",
              letterSpacing: "0.2rem",
              fontWeight: 600,
              color: "#F2f2f2",
              opacity: 0.85,
              margin: "0 0 1rem 0",
            }}
          >
            Community
          </p>
          <h1
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              color: "#241123",
              margin: "0 0 1rem 0",
              lineHeight: 1.2,
            }}
          >
            Languages
          </h1>
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "1.1rem",
              color: "#241123cc",
              margin: 0,
              maxWidth: "60ch",
            }}
          >
            Languages are how the DAT network connects and communicates.
            Explore our alumni community by the languages they speak.
          </p>
        </div>
      </section>

      {/* Language list */}
      <section style={{ padding: "4rem 30px 0", maxWidth: "900px", margin: "0 auto" }}>
        {languages.length === 0 ? (
          <p
            style={{
              color: "#f2f2f2aa",
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            }}
          >
            No language data available yet.
          </p>
        ) : (
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "grid",
              gap: "0.5rem",
            }}
          >
            {languages.map((lang) => (
              <li key={lang.slug}>
                <Link
                  href={`/languages/${lang.slug}`}
                  className="lang-link"
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "0.75rem",
                    textDecoration: "none",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    transition: "background 180ms ease",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                      fontSize: "1.05rem",
                      fontWeight: 600,
                      color: "#f2f2f2",
                    }}
                  >
                    {lang.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                      fontSize: "0.85rem",
                      color: "#2493A9",
                      fontWeight: 500,
                    }}
                  >
                    {lang.count} {lang.count === 1 ? "artist" : "artists"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
    </>
  );
}
