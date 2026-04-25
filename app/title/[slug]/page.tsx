// app/title/[slug]/page.tsx
/**
 * Creative titles with custom buckets (e.g., Executive Directors, Stage Managers, Designers, Playwrights, Travel Writers, etc.).
 * Supports comma-separated titles, special merges, exclusions, and de-duplication via lib/titles.
 */
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import type { AlumniRow } from "@/lib/types";
import MiniProfileCard from "@/components/profile/MiniProfileCard";
import SeasonsCarouselAlt from "@/components/alumni/SeasonsCarouselAlt";
import TitlesGrid from "@/components/alumni/TitlesGrid";
import { buildTitleBuckets, slugifyTitle } from "@/lib/titles";
import { loadRoleAssignments } from "@/lib/loadRoleAssignments";
import {
  getOrderedProfileRoles,
  getPrimaryDatRoleForProfile,
  getStaffStatusForProfile,
  getStaffViaLabelForProfile,
  getExecDirStatusForProfile,
  getExecDirViaLabelForProfile,
} from "@/lib/profileRoleAssignments";
import { programMap } from "@/lib/programMap";
import { productionMap } from "@/lib/productionMap";
import { normSlug } from "@/lib/slugAliases";
import { getViaBucketToken, type TitleBucketKey } from "@/lib/titles";
import { cache } from "react";

// Use ISR instead of force-dynamic
export const revalidate = 3600;

/**
 * Build a slug-keyed index of project roles from programMap + productionMap.
 * Used to enrich mergedRoles with roles that only appear in program/production data
 * (e.g. a Road Manager credit that never made it into Profile-Live or Role-Assignments).
 */
function buildProjectRolesIndex(): Map<string, string[]> {
  const index = new Map<string, string[]>();

  const addRoles = (artistSlug: string, roles: string[]) => {
    const key = normSlug(artistSlug);
    if (!key) return;
    const existing = index.get(key) ?? [];
    index.set(key, [...existing, ...roles]);
  };

  for (const key in programMap) {
    const prog = (programMap as Record<string, any>)[key];
    const artists: Record<string, string[]> = prog?.artists ?? {};
    for (const [slug, roles] of Object.entries(artists)) {
      if (Array.isArray(roles)) addRoles(slug, roles);
    }
  }

  for (const key in productionMap) {
    const prod = (productionMap as Record<string, any>)[key];
    const artists: Record<string, string[]> = prod?.artists ?? {};
    for (const [slug, roles] of Object.entries(artists)) {
      if (Array.isArray(roles)) addRoles(slug, roles);
    }
  }

  return index;
}

/**
 * Loads alumni with Role-Assignment merged roles populated into a.roles.
 * Also folds in project roles from programMap/productionMap so that credits
 * that only appear there (e.g. "Road Manager") are included in title buckets.
 *
 * Cached per render so generateStaticParams / generateMetadata / TitlePage
 * all share the same computed data.
 */
const loadAlumniWithMergedRoles = cache(async (): Promise<AlumniRow[]> => {
  const [alumni, roleAssignments] = await Promise.all([
    loadVisibleAlumni(),
    loadRoleAssignments(),
  ]);

  const projectRolesIndex = buildProjectRolesIndex();

  return alumni.map((a) => {
    const projectRoles = projectRolesIndex.get(normSlug(a.slug)) ?? [];

    const mergedRoles = getOrderedProfileRoles(
      a.profileId || a.slug,
      a.roles,
      roleAssignments,
      new Date(),
      projectRoles,
    );

    const primaryRole =
      getPrimaryDatRoleForProfile(a.slug, a.roles || [], roleAssignments) ||
      mergedRoles[0] ||
      a.role;

    const staffStatus = getStaffStatusForProfile(a.profileId || a.slug, roleAssignments);
    const staffViaLabel = getStaffViaLabelForProfile(a.profileId || a.slug, roleAssignments) ?? undefined;

    const execDirStatus = getExecDirStatusForProfile(a.profileId || a.slug, roleAssignments);
    const execDirViaTitle = getExecDirViaLabelForProfile(a.profileId || a.slug, roleAssignments) ?? undefined;

    return {
      ...a,
      role: primaryRole,
      roles: mergedRoles,
      datStaffStatus: staffStatus ?? undefined,
      staffViaLabel,
      execDirStatus: execDirStatus ?? undefined,
      execDirViaTitle,
    };
  });
});

type RouteParams = Promise<{ slug: string }>;

function norm(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

function humanizeSlug(slug: string) {
  const safe = typeof slug === "string" ? slug : "";
  return safe
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
function titleCase(input: string) {
  const safe = typeof input === "string" ? input : "";
  return safe
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export async function generateStaticParams() {
  const alumni: AlumniRow[] = await loadAlumniWithMergedRoles();
  const buckets = buildTitleBuckets(alumni);
  const valid = Array.from(buckets.values()).filter((b) => b.people.size > 0);

  const seen = new Set<string>();
  const out: { slug: string }[] = [];
  for (const b of valid) {
    const keySlug = String(b.meta.key); // fixed buckets: use key (e.g., "playwrights")
    const labelSlug = slugifyTitle(b.meta.label); // dynamic buckets: use label
    const isDynamic = keySlug.startsWith("title:") || keySlug.startsWith("pathway:");
    const canonical = isDynamic ? labelSlug : keySlug;

    if (!seen.has(canonical)) {
      out.push({ slug: canonical });
      seen.add(canonical);
    }
    // also allow labelSlug for fixed (non-dynamic) buckets as an alias
    if (!isDynamic && !seen.has(labelSlug)) {
      out.push({ slug: labelSlug });
      seen.add(labelSlug);
    }
  }
  return out;
}

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const slugLower = norm(slug);

  // ✅ Metadata must never crash; fall back gracefully.
  if (!slug) {
    return {
      title: "DAT Alumni — Titles",
      description: "Explore creative titles in the DAT alumni community.",
    };
  }

  const alumni: AlumniRow[] = await loadAlumniWithMergedRoles();
  const buckets = buildTitleBuckets(alumni);
  const target = slug.toLowerCase();

  const entry = Array.from(buckets.values()).find((b) => {
    const keySlug = String(b.meta.key);
    const labelSlug = slugifyTitle(b.meta.label);
    const isDynamic = keySlug.startsWith("title:") || keySlug.startsWith("pathway:");
    const canonical = isDynamic ? labelSlug : keySlug;
    return canonical === target || labelSlug === target;
  });

  const label = entry?.meta.label ?? humanizeSlug(slug);
  const title = `${label} — DAT Alumni`;
  const description = `Explore ${(typeof label === "string" ? label : "")
    .toLowerCase()} in the DAT alumni community.`;

  return { title, description };
}

export default async function TitlePage({
  params,
}: {
  params: RouteParams;
}) {
  const { slug } = await params;
  const target = norm(slug);

  // ✅ seasons-style guard
  if (!target) {
    notFound();
  }

  const alumni: AlumniRow[] = await loadAlumniWithMergedRoles();
  const buckets = buildTitleBuckets(alumni);

  // Find target bucket by either key or label slug
  const entry = Array.from(buckets.values()).find((b) => {
    const keySlug = String(b.meta.key); // e.g., "designers", "title:actors", "pathway:physical-therapists"
    const labelSlug = slugifyTitle(b.meta.label); // e.g., "actors", "physical-therapists"
    const isDynamic = keySlug.startsWith("title:") || keySlug.startsWith("pathway:");
    const canonical = isDynamic ? labelSlug : keySlug;
    return canonical === target || labelSlug === target;
  });

  if (!entry || entry.people.size === 0) return notFound();

  const displayLabel = entry.meta.label;
  const isPathwayBucket = entry.category === "professional-pathway";

  // Quick lookup for slug -> AlumniRow
  const bySlug = new Map(alumni.map((a) => [a.slug, a]));

  // Only Designers and Executive Directors have subcategories; everyone else is a flat grid
  const isGrouped =
    entry.meta.key === "designers" ||
    entry.meta.key === "executive-directors" ||
    entry.meta.key === "staff";

const flatSelected = !isGrouped
  ? alumni
      .filter((a) => entry.people.has(a.slug))
      .sort((a, b) => a.name.localeCompare(b.name))
  : [];

const groupedSections =
  isGrouped && entry.subcats
    ? Array.from(entry.subcats.entries())
        .map(([lcSubcat, slugs]) => {
          const title = titleCase(lcSubcat);
          const people = Array.from(slugs)
            .map((s) => bySlug.get(s))
            .filter(Boolean)
            .sort((a, b) =>
              (a!.name || "").localeCompare(b!.name || "")
            ) as AlumniRow[];
          return { title, people };
        })
        // ✅ Drop empty subgroups so no empty section headings render.
        .filter((g) => g.people.length > 0)
        .sort((a, b) => {
          if (entry.meta.key === "executive-directors" || entry.meta.key === "staff") {
            // ✅ Order: Current → Past
            const order: Record<string, number> = { current: 0, past: 1 };
            const aOrd = order[a.title.toLowerCase()] ?? 99;
            const bOrd = order[b.title.toLowerCase()] ?? 99;
            if (aOrd !== bOrd) return aOrd - bOrd;
          }
          return a.title.localeCompare(b.title);
        })
    : null;

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
          alt={`${displayLabel} Hero`}
          fill
          priority
          className="object-cover object-center"
        />
        <div style={{ position: "absolute", bottom: "1rem", right: "5%" }}>
          <h1
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(4rem, 9vw, 8rem)",
              color: "#f2f2f2",
              textTransform: "uppercase",
              textShadow: "0 8px 20px rgba(0,0,0,0.8)",
              margin: 0,
              lineHeight: "1",
              textAlign: "right",
            }}
          >
            {displayLabel}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "1.5rem",
              color: "#f2f2f2",
              opacity: 0.7,
              margin: 0,
              marginTop: "0rem",
              textShadow: "0 4px 9px rgba(0,0,0,0.9)",
              textAlign: "right",
            }}
          >
            Celebrating our incredible {humanizeSlug(slug).toLowerCase()}
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
        <div style={{ width: "90%", margin: "0 auto" }}>
          <h3
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "2.4rem",
              margin: "3.5rem 0 1.1rem",
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
            {displayLabel}
          </h3>

          <div
            style={{
              background: "rgba(36, 17, 35, 0.2)",
              borderRadius: "8px",
              padding: "2rem",
            }}
          >
            {groupedSections ? (
              <div style={{ display: "grid", gap: "2.5rem" }}>
                {groupedSections.map((group) => (
                  <section key={group.title}>
                    <h4
                      style={{
                        fontFamily:
                          "var(--font-space-grotesk), system-ui, sans-serif",
                        fontSize: "1.9rem",
                        fontWeight: 500,
                        color: "#D9A919",
                        margin: "0 0 1rem",
                        backgroundColor: "#241123",
                        opacity: 0.6,
                        padding: "0.1em 0.5em",
                        borderRadius: "0.3em",
                        display: "inline-block",
                      }}
                    >
                      {entry.meta.key === "designers" ? `${group.title} Designers` : titleCase(group.title)}
                    </h4>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(140px, 1fr))",
                        gap: "1rem",
                        justifyItems: "center",
                      }}
                    >
                      {group.people.map((artist) => {
                        const via = entry ? getViaBucketToken(artist, entry.meta.key as TitleBucketKey) : null;
                        return (
                          <MiniProfileCard
                            key={artist.slug}
                            alumniId={artist.slug}
                            name={artist.name}
                            role={artist.role}
                            allRoles={artist.roles}
                            slug={artist.slug}
                            headshotUrl={artist.headshotUrl}
                            viaLabel={via?.label}
                            viaSource={via?.source}
                          />
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: "1rem",
                  justifyItems: "center",
                }}
              >
                {flatSelected.map((artist) => {
                  const via = entry ? getViaBucketToken(artist, entry.meta.key as TitleBucketKey) : null;
                  return (
                    <MiniProfileCard
                      key={artist.slug}
                      alumniId={artist.slug}
                      name={artist.name}
                      role={artist.role}
                      allRoles={artist.roles}
                      slug={artist.slug}
                      headshotUrl={artist.headshotUrl}
                      viaLabel={via?.label}
                      viaSource={via?.source}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* NAV GRID */}
        <section style={{ width: "90%", margin: "4rem auto 0" }}>
          <h3
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "2.4rem",
              margin: "0rem 0 1.1rem",
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
            Explore More Titles
          </h3>

          <div
            style={{
              background: "rgba(36, 17, 35, 0.2)",
              borderRadius: "8px",
              padding: "2rem",
            }}
          >
            <TitlesGrid alumni={alumni} />
          </div>
        </section>

        {/* SEASON NAV */}
        <section
          style={{
            width: "100vw",
            backgroundColor: "#6C00AF",
            boxShadow: "0px 0px 33px rgba(0.8,0.8,0.8,0.8)",
            padding: "4rem 0",
            marginTop: "4rem",
            marginBottom: "-2rem", // ✅ tuck into footer like /role
          }}
        >
          <SeasonsCarouselAlt />
        </section>
      </main>

      <style>{`
        a { text-decoration: none; }
        h3 { color: #FFCC00; }
      `}</style>
    </div>
  );
}
