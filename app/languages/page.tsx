// app/languages/page.tsx

import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import { buildLanguageSummaries, type LanguageSummary } from "@/lib/languages";
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

function LanguageBucket({
  title,
  languages,
}: {
  title: string;
  languages: LanguageSummary[];
}) {
  if (languages.length === 0) return null;
  return (
    <section style={{ width: "90%", margin: "3.5rem auto 0" }}>
      <h3
        style={{
          fontFamily: "var(--font-anton), system-ui, sans-serif",
          fontSize: "2.4rem",
          margin: "0 0 1.1rem",
          textTransform: "uppercase",
          letterSpacing: "0.2rem",
          color: "#241123",
          backgroundColor: "#FFCC00",
          opacity: 0.6,
          padding: "0.1em 0.5em",
          borderRadius: "0.3em",
          display: "inline-block",
        }}
      >
        {title}
      </h3>
      <div
        style={{
          background: "rgba(36, 17, 35, 0.2)",
          borderRadius: "8px",
          padding: "2rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "0.75rem",
            alignItems: "stretch",
          }}
        >
          {languages.map((lang) => (
            <Link
              key={lang.slug}
              href={`/languages/${lang.slug}`}
              className="lang-chip"
              aria-label={`Browse ${lang.count} ${lang.count === 1 ? "artist" : "artists"} who speak ${lang.name}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 1rem",
                borderRadius: "15px",
                backgroundColor: "#241123",
                color: "#FFCC00",
                opacity: 0.7,
                letterSpacing: "0.06em",
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontWeight: 600,
                fontSize: "1rem",
                boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
                textDecoration: "none",
                transition:
                  "transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease",
              }}
            >
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {lang.name}
              </span>
              <span
                style={{
                  marginLeft: "0.75rem",
                  fontFamily:
                    "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "0.85rem",
                  opacity: 0.85,
                  flexShrink: 0,
                }}
              >
                {lang.count}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function LanguagesIndexPage() {
  const alumni = await loadVisibleAlumni();
  const languages = buildLanguageSummaries(alumni.map((a) => a.languages));

  // Top 5 by artist count → Core; remainder sorted alphabetically → Network
  const byCount = [...languages].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );
  const coreLanguages = byCount.slice(0, Math.min(5, byCount.length));
  const networkLanguages = byCount
    .slice(coreLanguages.length)
    .sort((a, b) => a.name.localeCompare(b.name));

  const langCount = languages.length;

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
        <div style={{ position: "absolute", bottom: "1rem", right: "5%" }}>
          <h1
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(3.6rem, 9vw, 8rem)",
              color: "#f2f2f2",
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
              opacity: 0.7,
              margin: 0,
              textShadow: "0 4px 9px rgba(0,0,0,0.9)",
              textAlign: "right",
            }}
          >
            The voices that carry DAT stories across cultures and continents.
          </p>
        </div>
      </div>

      {/* MAIN */}
      <main
        style={{
          marginTop: "-5rem",
          padding: "8rem 0 2rem",
          position: "relative",
          opacity: 0.9,
          zIndex: 10,
        }}
      >
        {/* Editorial intro */}
        <div style={{ width: "90%", maxWidth: 760, margin: "0 auto" }}>
          <h3
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              color: "#530087",
              opacity: 0.9,
              fontSize: "clamp(1.5rem, 3.5vw, 2rem)",
              fontWeight: 800,
              margin: "0 0 0.6rem",
            }}
          >
            A global network, many tongues
          </h3>
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              color: "#f2f2f2",
              opacity: 0.78,
              fontSize: "clamp(1rem, 1.6vw, 1.15rem)",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            DAT alumni create, teach, and collaborate across{" "}
            {langCount > 0 ? `${langCount} languages` : "many languages"}.
            Whether you&apos;re looking for an artist who shares your mother
            tongue or want to explore DAT&apos;s reach across cultures, browse
            the network below.
          </p>
        </div>

        {languages.length === 0 ? (
          <div style={{ width: "90%", margin: "3rem auto 0" }}>
            <p
              style={{
                color: "#f2f2f2aa",
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              }}
            >
              No language data available yet.
            </p>
          </div>
        ) : (
          <>
            <LanguageBucket
              title="Core DAT Languages"
              languages={coreLanguages}
            />
            {networkLanguages.length > 0 && (
              <LanguageBucket
                title="Languages in the Network"
                languages={networkLanguages}
              />
            )}
          </>
        )}

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
        .lang-chip:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 22px rgba(0,0,0,0.28) !important;
          opacity: 0.9 !important;
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
