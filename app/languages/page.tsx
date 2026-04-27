// app/languages/page.tsx

import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import { buildLanguageSummaries } from "@/lib/languages";
import SeasonsCarouselAlt from "@/components/alumni/SeasonsCarouselAlt";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Languages | Dramatic Adventure Theatre",
  description:
    "Explore DAT alumni by the languages they speak. The DAT network connects artists across cultures and communities worldwide.",
  alternates: { canonical: "/languages" },
  openGraph: {
    title: "Languages | Dramatic Adventure Theatre",
    description: "Explore DAT alumni by the languages they speak.",
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
    <div>
      {/* HERO */}
      <div
        style={{
          position: "relative",
          height: "55vh",
          overflow: "hidden",
          zIndex: 0,
          boxShadow: "0 0 33px rgba(0, 0, 0, 0.5)",
        }}
      >
        <Image
          src="/images/alumni-hero.jpg"
          alt="Languages Hero"
          fill
          priority
          className="object-cover object-center"
        />
        <div
          style={{
            position: "absolute",
            bottom: "1.1rem",
            right: "0",
            paddingRight: "2.5vw",
            textAlign: "right",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(4rem, 9vw, 8rem)",
              color: "#f2f2f2",
              opacity: 0.88,
              textTransform: "uppercase",
              textShadow: "0 8px 20px rgba(0,0,0,0.8)",
              margin: 0,
              lineHeight: "1",
            }}
          >
            Languages
          </h1>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "1.5rem",
              color: "#f2f2f2",
              opacity: 0.72,
              margin: 0,
              textShadow: "0 4px 9px rgba(0,0,0,0.9)",
              textAlign: "right",
            }}
          >
            Explore the languages spoken across the Dramatic Adventure Theatre community.
          </p>
        </div>
      </div>

      {/* MAIN */}
      <main
        style={{
          marginTop: "-5rem",
          padding: "8rem 0 2rem",
          position: "relative",
          opacity: 0.97,
          zIndex: 10,
        }}
      >
        <div style={{ width: "90%", maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              background: "rgba(36, 17, 35, 0.18)",
              borderRadius: "12px",
              padding: "2rem",
            }}
          >
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
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        transition: "background 180ms ease, transform 180ms ease",
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
          </div>
        </div>

        {/* Season nav */}
        <section
          style={{
            width: "100vw",
            backgroundColor: "#6C00AF",
            boxShadow: "0px 0px 33px rgba(0.8,0.8,0.8,0.8)",
            padding: "4rem 0",
            marginTop: "4rem",
            marginBottom: "-2rem",
          }}
        >
          <SeasonsCarouselAlt />
        </section>
      </main>

      <style>{`
        a { text-decoration: none; }
        a:hover { text-decoration: none; }
        .lang-link:hover {
          background: rgba(36,147,169,0.18) !important;
          transform: translateY(-1px);
        }
        @media (max-width: 900px) {
          main {
            margin-top: -3.5rem;
            padding-top: 5.5rem;
          }
        }
      `}</style>
    </div>
  );
}

