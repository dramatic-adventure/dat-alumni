// app/projects/[slug]/page.tsx
//
// Archived project page — a living archive that reads as a story with receipts.
// Replaces the old /programs/[slug] roster page (which now 308-redirects here).
//
// Sections (each hides gracefully when its data is empty):
//   Hero → Stats → Campaign module → The Journey → In Partnership → The Causes
//   → Who Made It → (An Artist's Journey — scaffold) → The Work
//   → What It Left Behind → The Ripples → The Thread → Dual CTA
//
// Data is assembled in lib/projectArchive.ts. Typography uses the DAT font
// CSS variables only; content sits on a light paper sheet over the kraft.

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { programMap } from "@/lib/programMap";
import { getProjectArchiveData } from "@/lib/projectArchive";
import {
  campaignProgress,
  formatCurrency,
  formatCurrencyMinor,
} from "@/lib/fundraisingCampaigns";
import MiniProfileCard from "@/components/profile/MiniProfileCard";

export const revalidate = 3600;

export function generateStaticParams() {
  return Object.keys(programMap).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = programMap[slug];
  if (!p) {
    return {
      title: "Project Not Found — Dramatic Adventure Theatre",
      description: "This project could not be found.",
      alternates: { canonical: `/projects/${slug}` },
    };
  }
  const title = `${p.title} — DAT Project Archive`;
  const description = `${[p.program, p.location].filter(Boolean).join(": ")}${
    p.year ? ` — ${p.year}` : ""
  }`;
  return {
    title,
    description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: { title, description, url: `/projects/${slug}`, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

// ── Palette ──
const C = {
  ink: "#241123",
  gold: "#FFCC00",
  teal: "#2493a9",
  green: "#3b6d11",
  grape: "#7b4fa6",
  yellow: "#f5c842",
  white: "#f2f2f2",
  paper: "#f4eee1",
} as const;

const FONT_ANTON = "var(--font-anton), system-ui, sans-serif";
const FONT_GROTESK = "var(--font-space-grotesk), system-ui, sans-serif";
const FONT_DM = "var(--font-dm-sans), system-ui, sans-serif";

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <>
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
        {kicker}
      </p>
      <h2
        style={{
          fontFamily: FONT_ANTON,
          textTransform: "uppercase",
          color: C.ink,
          fontSize: "clamp(1.8rem, 4vw, 2.7rem)",
          lineHeight: 1,
          margin: "0 0 1.2rem",
        }}
      >
        {title}
      </h2>
    </>
  );
}

const ledeStyle: React.CSSProperties = {
  fontFamily: FONT_GROTESK,
  fontSize: "1.05rem",
  lineHeight: 1.75,
  maxWidth: "64ch",
  opacity: 0.9,
};

export default async function ProjectArchivePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getProjectArchiveData(slug);
  if (!data) return notFound();

  const {
    program,
    family,
    seasonLabel,
    seasonHref,
    familyHref,
    recruitingUrl,
    heroImage,
    essence,
    narrative,
    artistCount,
    footprintCount,
    regionLabel,
    regionSub,
    clubCount,
    roster,
    clubs,
    causes,
    productions,
    legacyStories,
    ripples,
    thread,
    campaign,
    campaignTotals,
    campaignConcluded,
  } = data;

  const place =
    program.footprints?.map((f) => f.city || f.region || f.country).join(" · ") ||
    program.location;

  // ── Stats band ──
  const stats: { n: string; l: string; s: string }[] = [];
  stats.push({
    n: String(artistCount),
    l: artistCount === 1 ? "Company artist" : "Company artists",
    s: "+ local collaborators",
  });
  stats.push({
    n: String(footprintCount > 0 ? footprintCount : 1),
    l: regionLabel,
    s: regionSub,
  });
  if (clubCount > 0) {
    stats.push({
      n: String(clubCount),
      l: clubCount === 1 ? "Drama club" : "Drama clubs",
      s: "in partnership",
    });
  }
  if (narrative?.weeks) {
    stats.push({
      n: String(narrative.weeks),
      l: narrative.weeks === 1 ? "Week" : "Weeks",
      s: "in the field",
    });
  } else {
    stats.push({
      n: `S${program.season}`,
      l: "Season",
      s: String(program.year),
    });
  }

  const hasItinerary = (narrative?.itinerary?.length ?? 0) > 0;
  const lede = narrative?.lede;

  return (
    <div>
      {/* ── HERO ── */}
      <div
        style={{
          position: "relative",
          height: "82vh",
          minHeight: "520px",
          overflow: "hidden",
          boxShadow: "0 0 40px rgba(36,17,35,0.5)",
        }}
      >
        <Image
          src={heroImage}
          alt={`${data.familyLabel} hero`}
          fill
          priority
          className="object-cover object-center"
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(36,17,35,0.92) 0%, rgba(36,17,35,0.3) 48%, transparent 72%)",
          }}
        />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "0 0 3rem" }}>
          <div style={{ maxWidth: "1120px", margin: "0 auto", width: "92vw" }}>
            <p
              style={{
                fontFamily: FONT_DM,
                fontSize: "0.92rem",
                fontWeight: 900,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: C.gold,
                margin: "0 0 0.5rem",
              }}
            >
              {familyHref ? (
                <Link href={familyHref} className="proj-eyebrow-link">
                  {family}
                </Link>
              ) : (
                family
              )}{" "}
              ·{" "}
              <Link href={seasonHref} className="proj-eyebrow-link">
                {seasonLabel}
              </Link>
            </p>
            <h1
              style={{
                fontFamily: FONT_ANTON,
                textTransform: "uppercase",
                color: C.white,
                fontSize: "clamp(3rem, 8vw, 7rem)",
                lineHeight: 0.95,
                margin: 0,
                textShadow: "0 8px 24px rgba(0,0,0,0.8)",
              }}
            >
              {program.title}
            </h1>
            {place && (
              <p
                style={{
                  fontFamily: FONT_GROTESK,
                  color: C.white,
                  opacity: 0.85,
                  margin: "0.7rem 0 0",
                  fontSize: "clamp(1rem, 2vw, 1.35rem)",
                  textShadow: "0 3px 10px rgba(0,0,0,0.8)",
                }}
              >
                {place}
              </p>
            )}
            {essence && (
              <p
                style={{
                  fontFamily: FONT_GROTESK,
                  fontStyle: "italic",
                  color: C.gold,
                  opacity: 0.95,
                  margin: "0.5rem 0 0",
                  fontSize: "clamp(1rem, 1.8vw, 1.25rem)",
                  fontWeight: 500,
                }}
              >
                {essence}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── SHEET ── */}
      <div
        style={{
          maxWidth: "1120px",
          margin: "2.5rem auto 3.5rem",
          width: "92vw",
          background: C.paper,
          borderRadius: "24px",
          padding: "2.6rem 2.6rem 3rem",
          position: "relative",
          zIndex: 5,
          boxShadow: "0 6px 26px rgba(36,17,35,0.16)",
        }}
        className="proj-sheet"
      >
        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            background: C.ink,
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(36,17,35,0.22)",
          }}
        >
          {stats.map((s, i) => (
            <div
              key={`${s.l}-${i}`}
              style={{
                padding: "1.3rem 1.4rem",
                textAlign: "center",
                borderRight:
                  i < stats.length - 1 ? "1px solid rgba(242,242,242,0.12)" : "none",
              }}
            >
              <div
                style={{
                  fontFamily: FONT_ANTON,
                  color: C.gold,
                  fontSize: "clamp(2.2rem, 5vw, 3.2rem)",
                  lineHeight: 1,
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  fontFamily: FONT_GROTESK,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontSize: "0.8rem",
                  color: C.white,
                  marginTop: "0.35rem",
                }}
              >
                {s.l}
              </div>
              {s.s && (
                <div
                  style={{
                    fontFamily: FONT_DM,
                    fontSize: "0.7rem",
                    color: "rgba(242,242,242,0.6)",
                    marginTop: "0.2rem",
                  }}
                >
                  {s.s}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Campaign module */}
        {campaign && campaignTotals && (
          <div
            style={{
              margin: "3rem 0 0",
              borderRadius: "16px",
              padding: "1.8rem 2rem",
              border: `2px solid ${campaignConcluded ? C.green : C.teal}`,
              background: campaignConcluded
                ? "rgba(59,109,17,0.1)"
                : "rgba(36,147,169,0.1)",
            }}
          >
            {campaignConcluded ? (
              <>
                <p
                  style={{
                    fontFamily: FONT_DM,
                    fontWeight: 900,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    fontSize: "0.72rem",
                    margin: "0 0 0.5rem",
                    color: C.green,
                  }}
                >
                  ✓ Made possible by {campaignTotals.donorCount}{" "}
                  {campaignTotals.donorCount === 1 ? "donor" : "donors"}
                </p>
                <h3
                  style={{
                    fontFamily: FONT_ANTON,
                    textTransform: "uppercase",
                    fontSize: "clamp(1.5rem, 3vw, 2.1rem)",
                    margin: "0 0 0.6rem",
                    color: C.ink,
                  }}
                >
                  {campaign.archiveHeadline || "Because you helped make this work possible"}
                </h3>
                <p
                  style={{
                    fontFamily: FONT_GROTESK,
                    lineHeight: 1.65,
                    opacity: 0.85,
                    margin: "0.4rem 0 1rem",
                    maxWidth: "60ch",
                  }}
                >
                  {campaign.archiveSummary}
                </p>
                <div className="proj-btnrow">
                  <Link className="proj-btn proj-btn-gold" href={`/projects/${slug}/recap`}>
                    See what your support made possible
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p
                  style={{
                    fontFamily: FONT_DM,
                    fontWeight: 900,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    fontSize: "0.72rem",
                    margin: "0 0 0.5rem",
                    color: C.teal,
                  }}
                >
                  ● Live campaign
                </p>
                <h3
                  style={{
                    fontFamily: FONT_ANTON,
                    textTransform: "uppercase",
                    fontSize: "clamp(1.5rem, 3vw, 2.1rem)",
                    margin: "0 0 0.6rem",
                    color: C.ink,
                  }}
                >
                  Help send this cohort
                </h3>
                <p
                  style={{
                    fontFamily: FONT_GROTESK,
                    lineHeight: 1.65,
                    opacity: 0.85,
                    margin: "0.4rem 0 1rem",
                    maxWidth: "60ch",
                  }}
                >
                  {campaign.donorCallout ||
                    "Your gift opens this project to more artists — including less-resourced traveling artists and the local artists whose presence is essential to the work."}
                </p>
                <div
                  style={{
                    height: "14px",
                    borderRadius: "8px",
                    background: "rgba(36,17,35,0.12)",
                    overflow: "hidden",
                    margin: "0.8rem 0 0.5rem",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: C.teal,
                      width: `${Math.round(
                        campaignProgress(campaignTotals.raisedMinor, campaign.goalAmount)
                      )}%`,
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontFamily: FONT_DM,
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color: C.ink,
                  }}
                >
                  <span>
                    {formatCurrencyMinor(campaignTotals.raisedMinor, campaign.currency)} raised
                  </span>
                  <span>
                    Goal {formatCurrency(campaign.goalAmount, campaign.currency)} ·{" "}
                    {Math.round(
                      campaignProgress(campaignTotals.raisedMinor, campaign.goalAmount)
                    )}
                    %
                  </span>
                </div>
                <div className="proj-btnrow" style={{ marginTop: "1.1rem" }}>
                  <Link className="proj-btn proj-btn-gold" href={`/campaign/${campaign.id}`}>
                    Give now
                  </Link>
                </div>
              </>
            )}
          </div>
        )}

        {/* The Journey — hides entirely when there's no curated lede or itinerary */}
        {(lede || hasItinerary) && (
        <section style={{ padding: "3rem 0 0" }}>
          <SectionHead kicker="What this was" title="The Journey" />
          {lede && <p style={ledeStyle}>{lede}</p>}
          {hasItinerary && (
            <div style={{ display: "flex", flexDirection: "column", marginTop: "1.2rem" }}>
              {narrative!.itinerary!.map((ch, i) => (
                <div
                  key={ch.title}
                  style={{
                    display: "flex",
                    gap: "1.2rem",
                    padding: "1.15rem 0",
                    borderBottom:
                      i < narrative!.itinerary!.length - 1
                        ? "1px solid rgba(36,17,35,0.1)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      background: C.ink,
                      color: C.gold,
                      fontFamily: FONT_ANTON,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.1rem",
                      marginTop: "2px",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <h4
                      style={{
                        fontFamily: FONT_GROTESK,
                        fontWeight: 700,
                        fontSize: "1.12rem",
                        color: C.ink,
                        margin: "0.1rem 0 0.35rem",
                      }}
                    >
                      {ch.title}
                    </h4>
                    <p
                      style={{
                        fontFamily: FONT_DM,
                        fontSize: "0.9rem",
                        lineHeight: 1.6,
                        opacity: 0.8,
                        margin: 0,
                        maxWidth: "60ch",
                      }}
                    >
                      {ch.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        )}

        {/* In Partnership (drama clubs) — place of honor, dark band */}
        {clubs.length > 0 && (
          <div
            style={{
              margin: "3rem 0 0",
              background: C.ink,
              borderRadius: "18px",
              padding: "2.4rem 2rem",
            }}
          >
            <p
              style={{
                fontFamily: FONT_DM,
                fontSize: "0.8rem",
                fontWeight: 900,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: C.yellow,
                opacity: 0.9,
                margin: "0 0 0.4rem",
              }}
            >
              The heart of this project
            </p>
            <h2
              style={{
                fontFamily: FONT_ANTON,
                textTransform: "uppercase",
                color: C.white,
                fontSize: "clamp(1.8rem, 4vw, 2.7rem)",
                margin: "0 0 1.4rem",
              }}
            >
              In Partnership With
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "1.2rem",
              }}
            >
              {clubs.map((club) => (
                <Link key={club.slug} href={club.href} className="proj-club">
                  <div style={{ position: "relative", height: "140px", background: "#3a2230" }}>
                    {club.heroImage && (
                      <Image
                        src={club.heroImage}
                        alt={club.name}
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 860px) 90vw, 300px"
                      />
                    )}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to top, rgba(36,17,35,0.85), transparent 70%)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: "0.6rem",
                        left: "0.85rem",
                        right: "0.85rem",
                        fontFamily: FONT_ANTON,
                        textTransform: "uppercase",
                        fontSize: "1.15rem",
                        color: C.white,
                        lineHeight: 1,
                        textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                      }}
                    >
                      {club.name}
                    </div>
                  </div>
                  <div style={{ padding: "0.85rem 1rem 1rem" }}>
                    <div
                      style={{
                        fontFamily: FONT_DM,
                        fontSize: "0.78rem",
                        color: "rgba(242,242,242,0.65)",
                      }}
                    >
                      {club.location}
                    </div>
                    {club.causeLabel && (
                      <div
                        style={{
                          fontFamily: FONT_DM,
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          color: C.yellow,
                          marginTop: "0.35rem",
                        }}
                      >
                        {club.causeLabel} →
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* The Causes */}
        {causes.length > 0 && (
          <section style={{ padding: "3rem 0 0" }}>
            <SectionHead kicker="Why it matters" title="The Causes We Served" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginTop: "1rem" }}>
              {causes.map((cause) => (
                <Link key={cause.id} href={cause.href} className="proj-cause">
                  <i style={{ width: "9px", height: "9px", borderRadius: "50%", background: cause.color }} />
                  {cause.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Who Made It (roster) */}
        {roster.length > 0 && (
          <section style={{ padding: "3rem 0 0" }}>
            <SectionHead kicker="The company" title="Who Made It" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              {roster.map((m) => (
                <MiniProfileCard
                  key={m.slug}
                  name={m.name}
                  role={m.roles}
                  slug={m.slug}
                  headshotUrl={m.headshotUrl}
                  href={`/alumni/${m.slug}`}
                  variant="light"
                />
              ))}
            </div>
          </section>
        )}

        {/* An Artist's Journey (journey cards) — scaffold.
            TODO: render per-artist journey cards once the journey-card feature
            ships a data source. Until then this section renders nothing. */}

        {/* The Work (productions) */}
        {productions.length > 0 && (
          <section style={{ padding: "3rem 0 0" }}>
            <SectionHead kicker="What we made" title="The Work" />
            <p style={{ ...ledeStyle, marginBottom: 0 }}>
              Theatre that grew out of this journey — devised in the field, carried onto the stage.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
                gap: "1.2rem",
                marginTop: "1rem",
              }}
            >
              {productions.map((p) => (
                <Link key={p.slug} href={p.href} className="proj-poster">
                  <div style={{ position: "relative", width: "100%", aspectRatio: "2 / 3", background: "#3a2230" }}>
                    {p.posterUrl && (
                      <Image
                        src={p.posterUrl}
                        alt={p.title}
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 860px) 50vw, 220px"
                      />
                    )}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to top, rgba(36,17,35,0.92) 8%, rgba(36,17,35,0.15) 55%, transparent 75%)",
                      }}
                    />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1rem 0.9rem" }}>
                      <div
                        style={{
                          fontFamily: FONT_ANTON,
                          textTransform: "uppercase",
                          fontSize: "1.3rem",
                          lineHeight: 0.95,
                          color: C.white,
                          textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                        }}
                      >
                        {p.title}
                      </div>
                      {p.subtitle && (
                        <div
                          style={{
                            fontFamily: FONT_DM,
                            fontSize: "0.74rem",
                            color: "rgba(242,242,242,0.8)",
                            marginTop: "0.3rem",
                          }}
                        >
                          {p.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* What It Left Behind (stories) */}
        {legacyStories.length > 0 && (
          <section style={{ padding: "3rem 0 0" }}>
            <SectionHead kicker="On the ground" title="What It Left Behind" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              {legacyStories.map((s) => (
                <Link key={s.slug} href={s.href} className="proj-lcard">
                  <div style={{ position: "relative", height: "115px", background: "#4a2a56" }}>
                    {s.heroImage && (
                      <Image
                        src={s.heroImage}
                        alt={s.title}
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 860px) 50vw, 240px"
                      />
                    )}
                  </div>
                  <div style={{ padding: "0.8rem 0.9rem 1rem" }}>
                    <h4
                      style={{
                        fontFamily: FONT_GROTESK,
                        fontWeight: 700,
                        fontSize: "0.96rem",
                        color: C.ink,
                        margin: "0 0 0.25rem",
                        lineHeight: 1.25,
                      }}
                    >
                      {s.title}
                    </h4>
                    {s.teaser && (
                      <div style={{ fontFamily: FONT_DM, fontSize: "0.72rem", color: C.ink, opacity: 0.55 }}>
                        {s.teaser}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* The Ripples (win-only) */}
        {ripples.length > 0 && (
          <section style={{ padding: "3rem 0 0" }}>
            <SectionHead kicker="What's still unfolding" title="The Ripples" />
            <p style={{ ...ledeStyle, marginBottom: 0 }}>
              The work doesn&apos;t end when the project does. Here&apos;s what kept going:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", marginTop: "1rem" }}>
              {ripples.map((r, i) => (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    gap: "1rem",
                    alignItems: "flex-start",
                    padding: "1rem 0",
                    borderBottom:
                      i < ripples.length - 1 ? "1px solid rgba(36,17,35,0.1)" : "none",
                  }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      marginTop: "2px",
                      border: `2px solid ${C.teal}`,
                      boxShadow:
                        "0 0 0 4px rgba(36,147,169,0.18), 0 0 0 9px rgba(36,147,169,0.08)",
                    }}
                  />
                  <div style={{ fontFamily: FONT_GROTESK, fontSize: "1.02rem", lineHeight: 1.6, color: C.ink }}>
                    <strong>{r.headline}</strong>
                    {r.body ? ` — ${r.body}` : ""}
                  </div>
                </div>
              ))}
            </div>
            <Link href="/ripple-effect" className="proj-ripple-more">
              Explore the Artist Ripple Effect
            </Link>
          </section>
        )}

        {/* The Thread */}
        {thread.length > 0 && (
          <section style={{ padding: "3rem 0 0" }}>
            <SectionHead kicker="The through-line" title="The Thread" />
            <p style={{ ...ledeStyle, marginBottom: 0 }}>
              One chapter in a longer story. Follow the {family} thread across the seasons:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginTop: "1rem" }}>
              {thread.map((t) => (
                <Link key={t.slug} href={t.href} className="proj-chip">
                  {t.title}
                  <span style={{ color: C.gold, marginLeft: "0.4rem", fontWeight: 800 }}>{t.year}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Dual CTA */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.2rem",
            margin: "3.4rem 0 0",
          }}
        >
          <div style={{ borderRadius: "18px", padding: "2.2rem 1.8rem", textAlign: "center", background: C.ink }}>
            <h3
              style={{
                fontFamily: FONT_ANTON,
                textTransform: "uppercase",
                color: C.white,
                fontSize: "clamp(1.4rem, 3vw, 2rem)",
                margin: "0 0 0.5rem",
              }}
            >
              Help make the next one possible
            </h3>
            <p
              style={{
                fontFamily: FONT_GROTESK,
                color: "rgba(255,255,255,0.85)",
                margin: "0 auto 1.2rem",
                lineHeight: 1.6,
                maxWidth: "38ch",
                fontSize: "0.95rem",
              }}
            >
              Your support opens the next project to more artists and more communities.
            </p>
            <div className="proj-btnrow" style={{ justifyContent: "center" }}>
              <Link className="proj-btn proj-btn-gold" href="/donate">
                Support DAT
              </Link>
            </div>
          </div>
          {recruitingUrl && (
            <div style={{ borderRadius: "18px", padding: "2.2rem 1.8rem", textAlign: "center", background: C.teal }}>
              <h3
                style={{
                  fontFamily: FONT_ANTON,
                  textTransform: "uppercase",
                  color: C.white,
                  fontSize: "clamp(1.4rem, 3vw, 2rem)",
                  margin: "0 0 0.5rem",
                }}
              >
                Make work like this
              </h3>
              <p
                style={{
                  fontFamily: FONT_GROTESK,
                  color: "rgba(255,255,255,0.85)",
                  margin: "0 auto 1.2rem",
                  lineHeight: 1.6,
                  maxWidth: "38ch",
                  fontSize: "0.95rem",
                }}
              >
                Want to join a future {family} journey? See what&apos;s coming and how to take part.
              </p>
              <div className="proj-btnrow" style={{ justifyContent: "center" }}>
                <a
                  className="proj-btn proj-btn-white"
                  href={recruitingUrl}
                  target={recruitingUrl.startsWith("http") ? "_blank" : undefined}
                  rel={recruitingUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  Explore {family}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Back-nav */}
        <div
          style={{
            padding: "2.4rem 0 0",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <Link href="/projects" className="proj-backnav">
            ← Back to the Project Archive
          </Link>
          <Link href={seasonHref} className="proj-backnav">
            {seasonLabel} →
          </Link>
        </div>
      </div>

      {/* Hover/interaction styles (DAT fonts via CSS vars; no arrows in buttons) */}
      <style>{`
        .proj-eyebrow-link:hover { text-decoration: underline; text-underline-offset: 3px; }

        .proj-btnrow { display: flex; flex-wrap: wrap; gap: 0.7rem; }
        .proj-btn {
          display: inline-block; font-family: ${FONT_DM}; font-weight: 800;
          letter-spacing: 0.08em; text-transform: uppercase; font-size: 0.82rem;
          padding: 0.8em 1.8em; border-radius: 8px;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .proj-btn-gold { background: ${C.gold}; color: ${C.ink}; }
        .proj-btn-white { background: ${C.white}; color: ${C.ink}; }
        .proj-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.25); }

        .proj-club {
          display: flex; flex-direction: column; border-radius: 14px; overflow: hidden;
          background: rgba(242,242,242,0.06); border: 1px solid rgba(242,242,242,0.14);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .proj-club:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(0,0,0,0.4); }

        .proj-cause {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: rgba(255,255,255,0.45); border: 1px solid rgba(36,17,35,0.18);
          border-radius: 999px; padding: 0.55rem 1.1rem; font-family: ${FONT_DM};
          font-weight: 700; font-size: 0.84rem; color: ${C.ink}; transition: background 0.18s ease, border-color 0.18s ease;
        }
        .proj-cause:hover { background: ${C.gold}; border-color: ${C.gold}; }

        .proj-poster {
          position: relative; border-radius: 12px; overflow: hidden; display: block;
          box-shadow: 0 6px 18px rgba(36,17,35,0.2); transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .proj-poster:hover { transform: translateY(-4px) scale(1.01); box-shadow: 0 14px 34px rgba(36,17,35,0.32); }

        .proj-lcard {
          border-radius: 12px; overflow: hidden; border: 1.5px solid rgba(36,17,35,0.18);
          background: #fbf8f0; display: flex; flex-direction: column; transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .proj-lcard:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(36,17,35,0.18); }

        .proj-ripple-more {
          display: inline-block; margin-top: 1.4rem; font-family: ${FONT_DM}; font-weight: 800;
          letter-spacing: 0.1em; text-transform: uppercase; font-size: 0.78rem; color: ${C.teal};
          border: 1.5px solid ${C.teal}; border-radius: 8px; padding: 0.7em 1.3em; transition: background 0.18s ease, color 0.18s ease;
        }
        .proj-ripple-more:hover { background: ${C.teal}; color: #fff; }

        .proj-chip {
          background: ${C.ink}; color: ${C.white}; border-radius: 8px; padding: 0.6rem 1rem;
          font-family: ${FONT_DM}; font-weight: 700; font-size: 0.82rem; transition: background 0.18s ease;
        }
        .proj-chip:hover { background: ${C.grape}; }

        .proj-backnav {
          font-family: ${FONT_DM}; font-weight: 800; letter-spacing: 0.13em; text-transform: uppercase;
          font-size: 0.78rem; color: ${C.ink}; opacity: 0.7; transition: opacity 0.18s ease, color 0.18s ease;
        }
        .proj-backnav:hover { opacity: 1; color: ${C.grape}; }

        @media (max-width: 700px) {
          .proj-sheet { padding: 1.6rem 1.3rem 2rem !important; }
        }
      `}</style>
    </div>
  );
}
