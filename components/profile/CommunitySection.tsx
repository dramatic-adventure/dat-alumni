"use client";

import Link from "next/link";
import { CAUSE_CATEGORIES, CAUSE_SUBCATEGORIES_BY_CATEGORY } from "@/lib/causes";
import { dramaClubs } from "@/lib/dramaClubMap";
import useIsMobile from "@/hooks/useIsMobile";

interface CommunitySectionProps {
  supportedClubs?: string;
  impactCauses?: string;
  featuredSupportedClub?: string;
  featuredImpactCause?: string;
}

function parseCommaList(raw?: string | null): string[] {
  if (!raw) return [];
  return String(raw).split(",").map((s) => s.trim()).filter(Boolean);
}

const FF_GROTESK = "var(--font-space-grotesk), system-ui, sans-serif";
const FF_SANS = "var(--font-dm-sans), system-ui, sans-serif";
const INK = "#241123";

function resolveDramaClub(slug: string) {
  const dc = dramaClubs.find((c) => c.slug === slug);
  return dc ? { slug: dc.slug, name: dc.name, country: dc.country, location: dc.location } : undefined;
}

function resolveCauseAnywhere(id: string) {
  for (const cat of CAUSE_CATEGORIES) {
    const sub = (CAUSE_SUBCATEGORIES_BY_CATEGORY[cat.id] ?? []).find((s) => s.id === id);
    if (sub) return { id: sub.id, label: sub.shortLabel ?? sub.label };
  }
  return undefined;
}

export default function CommunitySection({
  supportedClubs,
  impactCauses,
  featuredSupportedClub,
  featuredImpactCause,
}: CommunitySectionProps) {
  const isMobile = useIsMobile();

  // Resolve clubs
  const clubSlugs = parseCommaList(supportedClubs);
  const clubSlugSet = new Set(clubSlugs);
  const resolvedClubs = dramaClubs
    .filter((c) => clubSlugSet.has(c.slug))
    .map((c) => ({ slug: c.slug, name: c.name, country: c.country, location: c.location }));

  // Resolve causes (preserving category order)
  const causeIdSet = new Set(parseCommaList(impactCauses));
  const resolvedCauses: { id: string; label: string }[] = [];
  for (const cat of CAUSE_CATEGORIES) {
    const subs = CAUSE_SUBCATEGORIES_BY_CATEGORY[cat.id] ?? [];
    for (const sub of subs) {
      if (causeIdSet.has(sub.id)) {
        resolvedCauses.push({ id: sub.id, label: sub.shortLabel ?? sub.label });
      }
    }
  }

  const featuredClubSlug = featuredSupportedClub?.trim() ?? "";
  const featuredClub = featuredClubSlug
    ? (resolvedClubs.find((c) => c.slug === featuredClubSlug) ?? resolveDramaClub(featuredClubSlug))
    : undefined;
  const otherClubs = featuredClub
    ? resolvedClubs.filter((c) => c.slug !== featuredClub.slug)
    : resolvedClubs;

  const featuredCauseId = featuredImpactCause?.trim() ?? "";
  const featuredCause = featuredCauseId
    ? (resolvedCauses.find((c) => c.id === featuredCauseId) ?? resolveCauseAnywhere(featuredCauseId))
    : undefined;
  const otherCauses = featuredCause
    ? resolvedCauses.filter((c) => c.id !== featuredCause.id)
    : resolvedCauses;

  const hasClubs = resolvedClubs.length > 0 || !!featuredClub;
  const hasCauses = resolvedCauses.length > 0 || !!featuredCause;
  const hasBothColumns = hasClubs && hasCauses;

  if (!hasClubs && !hasCauses) return null;

  return (
    <section
      style={{
        backgroundColor: "#faf8f5",
        padding: isMobile ? "3rem 24px 3.5rem" : "4.5rem 30px 5rem",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <p
          style={{
            fontFamily: FF_GROTESK,
            fontSize: "0.78rem",
            textTransform: "uppercase",
            letterSpacing: "0.2rem",
            fontWeight: 600,
            color: INK,
            opacity: 0.5,
            margin: "0 0 2.5rem 0",
          }}
        >
          What I&apos;m Part Of
        </p>

        <div
          style={{
            display: hasBothColumns && !isMobile ? "grid" : "block",
            gridTemplateColumns: hasBothColumns && !isMobile ? "1fr 0.85fr" : undefined,
            gap: hasBothColumns && !isMobile ? "4rem" : undefined,
          }}
        >
          {/* Drama Clubs */}
          {hasClubs && (
            <div style={{ marginBottom: isMobile && hasCauses ? "3rem" : 0 }}>
              <p
                style={{
                  fontFamily: FF_GROTESK,
                  fontSize: "0.72rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.18rem",
                  fontWeight: 600,
                  color: INK,
                  opacity: 0.45,
                  margin: "0 0 1.1rem 0",
                }}
              >
                Drama Clubs I Support
              </p>

              {featuredClub && (
                <Link
                  href={`/drama-club/${featuredClub.slug}`}
                  style={{
                    display: "block",
                    padding: "1.25rem 1.5rem",
                    borderRadius: "10px",
                    background: "rgba(36,147,169,0.06)",
                    border: "1px solid rgba(36,147,169,0.22)",
                    textDecoration: "none",
                    marginBottom: otherClubs.length > 0 ? "1.1rem" : 0,
                    transition: "background 160ms, border-color 160ms",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(36,147,169,0.11)";
                    e.currentTarget.style.borderColor = "rgba(36,147,169,0.38)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(36,147,169,0.06)";
                    e.currentTarget.style.borderColor = "rgba(36,147,169,0.22)";
                  }}
                >
                  <p
                    style={{
                      fontFamily: FF_GROTESK,
                      fontSize: "0.65rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.18rem",
                      fontWeight: 600,
                      color: "#2493A9",
                      margin: "0 0 0.45rem 0",
                    }}
                  >
                    Featured Drama Club
                  </p>
                  <p
                    style={{
                      fontFamily: FF_GROTESK,
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      color: INK,
                      margin: "0 0 0.3rem 0",
                      lineHeight: 1.25,
                    }}
                  >
                    {featuredClub.name}
                  </p>
                  <p
                    style={{
                      fontFamily: FF_SANS,
                      fontSize: "0.82rem",
                      color: INK,
                      opacity: 0.5,
                      margin: 0,
                    }}
                  >
                    {featuredClub.location ?? featuredClub.country}
                  </p>
                </Link>
              )}

              {otherClubs.length > 0 && (
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "0.5rem" }}>
                  {otherClubs.map((club) => (
                    <li key={club.slug}>
                      <Link
                        href={`/drama-club/${club.slug}`}
                        style={{
                          fontFamily: FF_SANS,
                          fontSize: "0.9rem",
                          fontWeight: 400,
                          color: `${INK}cc`,
                          textDecoration: "none",
                          transition: "color 140ms",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#2493A9"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = `${INK}cc`; }}
                      >
                        {club.name}
                        <span
                          style={{
                            marginLeft: "0.4rem",
                            fontSize: "0.78rem",
                            opacity: 0.45,
                          }}
                        >
                          {club.location ?? club.country}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Causes */}
          {hasCauses && (
            <div>
              <p
                style={{
                  fontFamily: FF_GROTESK,
                  fontSize: "0.72rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.18rem",
                  fontWeight: 600,
                  color: INK,
                  opacity: 0.45,
                  margin: "0 0 1.1rem 0",
                }}
              >
                Causes I Stand For
              </p>

              {featuredCause && (
                <div
                  style={{
                    padding: "1.1rem 1.4rem",
                    borderRadius: "10px",
                    background: "rgba(108,0,175,0.05)",
                    border: "1px solid rgba(108,0,175,0.18)",
                    marginBottom: otherCauses.length > 0 ? "1.1rem" : 0,
                    transition: "background 160ms, border-color 160ms",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(108,0,175,0.09)";
                    e.currentTarget.style.borderColor = "rgba(108,0,175,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(108,0,175,0.05)";
                    e.currentTarget.style.borderColor = "rgba(108,0,175,0.18)";
                  }}
                >
                  <p
                    style={{
                      fontFamily: FF_GROTESK,
                      fontSize: "0.65rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.18rem",
                      fontWeight: 600,
                      color: "#6C00AF",
                      margin: "0 0 0.45rem 0",
                    }}
                  >
                    Featured Cause
                  </p>
                  <Link
                    href={`/cause/${featuredCause.id}`}
                    style={{ display: "block", textDecoration: "none" }}
                  >
                    <p
                      style={{
                        fontFamily: FF_GROTESK,
                        fontSize: "1.25rem",
                        fontWeight: 600,
                        color: INK,
                        margin: 0,
                        lineHeight: 1.3,
                        transition: "color 140ms",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = INK; }}
                    >
                      {featuredCause.label}
                    </p>
                  </Link>
                </div>
              )}

              {otherCauses.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {otherCauses.map(({ id, label }) => (
                    <Link
                      key={id}
                      href={`/cause/${id}`}
                      style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: 999,
                        fontFamily: FF_GROTESK,
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1rem",
                        color: INK,
                        background: "rgba(36,17,35,0.07)",
                        border: "1px solid rgba(36,17,35,0.13)",
                        textDecoration: "none",
                        transition: "background 140ms, border-color 140ms",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(36,17,35,0.14)";
                        e.currentTarget.style.borderColor = "rgba(36,17,35,0.22)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(36,17,35,0.07)";
                        e.currentTarget.style.borderColor = "rgba(36,17,35,0.13)";
                      }}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
