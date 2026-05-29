// app/projects/program/[program]/page.tsx
//
// Family (program) archive — every project in one program line (PASSAGE,
// Creative Trek, ACTion, etc.), newest first, each linking to its
// /projects/[slug] detail page. Reached from the program name in the detail
// page hero eyebrow. Auto-populates from programMap.

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  allFamilySlugs,
  getProjectsByFamily,
  type FamilyProject,
} from "@/lib/projectFamily";
import { resolveProjectHeroImage } from "@/lib/projectHeroImage";

export const revalidate = 3600;

export function generateStaticParams() {
  return allFamilySlugs().map((program) => ({ program }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ program: string }>;
}): Promise<Metadata> {
  const { program } = await params;
  const data = getProjectsByFamily(program);
  if (!data) return { title: "Program Not Found — Dramatic Adventure Theatre" };
  const title = `${data.family} — Every Project — DAT`;
  const description = `Every ${data.family} project across DAT's seasons.`;
  return {
    title,
    description,
    alternates: { canonical: `/projects/program/${program}` },
    openGraph: { title, description, url: `/projects/program/${program}`, type: "website" },
  };
}

const C = {
  ink: "#241123",
  gold: "#FFCC00",
  white: "#f2f2f2",
  paper: "#f4eee1",
  grape: "#7b4fa6",
} as const;

const FONT_ANTON = "var(--font-anton), system-ui, sans-serif";
const FONT_GROTESK = "var(--font-space-grotesk), system-ui, sans-serif";
const FONT_DM = "var(--font-dm-sans), system-ui, sans-serif";

function projectPlace(p: FamilyProject): string {
  return (
    p.footprints?.map((f) => f.city || f.region || f.country).filter(Boolean).join(" · ") ||
    p.location
  );
}

export default async function ProgramFamilyPage({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  const { program } = await params;
  const data = getProjectsByFamily(program);
  if (!data) return notFound();

  const { family, projects } = data;

  return (
    <div style={{ minHeight: "100vh" }}>
      <div
        style={{
          maxWidth: "1120px",
          margin: "3rem auto 3.5rem",
          width: "92vw",
          background: C.paper,
          borderRadius: "24px",
          padding: "2.6rem 2.6rem 3rem",
          boxShadow: "0 6px 26px rgba(36,17,35,0.16)",
        }}
        className="pf-sheet"
      >
        {/* Header */}
        <p
          style={{
            fontFamily: FONT_DM,
            fontSize: "0.8rem",
            fontWeight: 900,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.ink,
            opacity: 0.65,
            margin: "0 0 0.4rem",
          }}
        >
          The Program Thread
        </p>
        <h1
          style={{
            fontFamily: FONT_ANTON,
            textTransform: "uppercase",
            color: C.ink,
            fontSize: "clamp(2.4rem, 6vw, 4rem)",
            lineHeight: 1,
            margin: "0 0 0.6rem",
          }}
        >
          {family}
        </h1>
        <p
          style={{
            fontFamily: FONT_GROTESK,
            fontSize: "1.05rem",
            lineHeight: 1.7,
            maxWidth: "60ch",
            opacity: 0.9,
            margin: 0,
          }}
        >
          Every {family} project across DAT&apos;s seasons —{" "}
          {projects.length === 1 ? "one chapter" : `${projects.length} chapters`} in a longer
          story.
        </p>

        {/* Project cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1.2rem",
            marginTop: "2rem",
          }}
        >
          {projects.map((p) => {
            const img = resolveProjectHeroImage(p.slug, p.season);
            const place = projectPlace(p);
            return (
              <Link key={p.slug} href={`/projects/${p.slug}`} className="pf-card">
                <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: "#3a2230" }}>
                  <Image
                    src={img}
                    alt={p.title}
                    fill
                    className="object-cover object-center pf-card-img"
                    sizes="(max-width: 860px) 50vw, 280px"
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(36,17,35,0.92) 6%, rgba(36,17,35,0.2) 55%, transparent 78%)",
                    }}
                  />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1rem 0.95rem" }}>
                    <span
                      style={{
                        fontFamily: FONT_DM,
                        fontSize: "0.66rem",
                        fontWeight: 800,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: C.gold,
                      }}
                    >
                      Season {p.season} · {p.year}
                    </span>
                    <div
                      style={{
                        fontFamily: FONT_ANTON,
                        textTransform: "uppercase",
                        fontSize: "1.25rem",
                        lineHeight: 0.98,
                        color: C.white,
                        margin: "0.25rem 0 0",
                        textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                      }}
                    >
                      {p.title}
                    </div>
                    {place && (
                      <div
                        style={{
                          fontFamily: FONT_DM,
                          fontSize: "0.74rem",
                          color: "rgba(242,242,242,0.8)",
                          marginTop: "0.3rem",
                        }}
                      >
                        {place}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Back-nav */}
        <div style={{ padding: "2.4rem 0 0" }}>
          <Link href="/projects" className="pf-backnav">
            ← Back to the Project Archive
          </Link>
        </div>
      </div>

      <style>{`
        .pf-card {
          display: block; border-radius: 14px; overflow: hidden;
          box-shadow: 0 6px 18px rgba(36,17,35,0.2);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .pf-card:hover { transform: translateY(-4px); box-shadow: 0 14px 34px rgba(36,17,35,0.32); }
        .pf-card-img { transition: transform 0.5s ease; }
        .pf-card:hover .pf-card-img { transform: scale(1.04); }
        .pf-backnav {
          font-family: ${FONT_DM}; font-weight: 800; letter-spacing: 0.13em; text-transform: uppercase;
          font-size: 0.78rem; color: ${C.ink}; opacity: 0.7; transition: opacity 0.18s ease, color 0.18s ease;
        }
        .pf-backnav:hover { opacity: 1; color: ${C.grape}; }
        @media (max-width: 700px) {
          .pf-sheet { padding: 1.6rem 1.3rem 2rem !important; }
        }
      `}</style>
    </div>
  );
}
