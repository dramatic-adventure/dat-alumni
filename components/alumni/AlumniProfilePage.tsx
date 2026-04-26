// components/alumni/AlumniProfilePage.tsx

"use client";

import Head from "next/head";
import { useMemo, useState, useEffect } from "react";
import type { AlumniRow, StoryRow } from "@/lib/types";
import ProfileCard from "@/components/profile/ProfileCard";
import AlumniProfileBackdrop from "@/components/alumni/AlumniProfileBackdrop";
import { clientDebug } from "@/lib/clientDebug";

interface UpcomingEvent {
  title: string;
  link?: string;
  date?: string;
  expiresAt?: string;
  description?: string;
  city?: string;
  stateCountry?: string;
  mediaType?: "image" | "video";
  mediaFileId?: string;
  mediaUrl?: string;
  mediaAlt?: string;
  videoAutoplay?: boolean;
}

interface AlumniProfileProps {
  data: AlumniRow;
  allStories: StoryRow[];

  /**
   * Optional list of slug aliases for this alum (including canonical).
   * Used ONLY to match cross-refs (productions/stories) that might still
   * reference a legacy slug.
   */
  slugAliases?: string[];

  offsetTop?: string; // Additional offset for fine-tuning (e.g., "-2rem")
  offsetBottom?: string; // Space below section (e.g., "-6rem")
  minSectionHeight?: string; // Ensures parallax coverage (e.g., "140vh")

  upcomingEvent?: UpcomingEvent;
}

const HEADER_HEIGHT = "84px"; // ✅ Adjust if your header height changes

function cleanStr(v?: string | null): string | undefined {
  const t = (v ?? "").trim();
  return t.length ? t : undefined;
}

/**
 * Normalize slug-ish things for cross-ref matching.
 * Handles:
 * - whitespace/case
 * - accidental "/alumni/<slug>" paths
 * - URL-ish strings where pathname contains /alumni/<slug>
 */
function normSlugish(raw: unknown): string {
  const s0 = String(raw ?? "").trim();
  if (!s0) return "";

  try {
    const u = new URL(s0, "http://local");
    const m = u.pathname.match(/^\/alumni\/([^\/?#]+)/i);
    if (m?.[1]) return m[1].trim().toLowerCase();
  } catch {
    // ignore
  }

  const m2 = s0.match(/^\/alumni\/([^\/?#]+)/i);
  if (m2?.[1]) return m2[1].trim().toLowerCase();

  return s0.toLowerCase();
}

/** Coerce string|string[]|unknown into a normalized string[] */
function coerceStrArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === "string") {
    return v
      .split(/[,;\n|]/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}


export default function AlumniProfilePage({
  data,
  allStories,
  slugAliases = [],
  offsetTop = "2rem",
  offsetBottom = "15rem",
  minSectionHeight = "100vh",
  upcomingEvent,
}: AlumniProfileProps) {
  const d = (data || {}) as any;

  const slug = cleanStr(d.slug) ?? "";
  const name = cleanStr(d.name) ?? "";

  // ✅ Stable story identity (matches your Stories sheet column `alumniId`)
  const alumniId = cleanStr(d.alumniId ?? d.alumni_id ?? d["alumni id"] ?? d.id ?? d.profileId) ?? "";

  const roles = Array.isArray(d.roles) ? (d.roles as string[]) : [];
  const role = cleanStr(d.role) ?? "";
  const headshotUrl = cleanStr(d.headshotUrl); // allow undefined; ProfileCard/Provider can fill
  const currentHeadshotId = cleanStr(d.currentHeadshotId ?? d.currentheadshotid ?? d["current headshot id"]);


  // NOTE: these may be string[] OR strings depending on CSV/live snapshot
  const programBadges = coerceStrArray(d.programBadges ?? d.programs ?? d.projectBadges);
  const identityTags = coerceStrArray(d.identityTags ?? d.identity ?? d.identity_tags);
  const practiceTags = coerceStrArray(d.practiceTags ?? d.practice_tags ?? d["practice tags"]);
  const exploreCareTags = coerceStrArray(
    d.exploreCareTags ?? d.explore_care_tags ?? d["explore care tags"]
  );
  const statusFlags = coerceStrArray(d.statusFlags ?? d.flags ?? d.status_signifier);

  // ✅ Bio / artist statement: accept multiple worlds
  const artistStatement =
    cleanStr(d.artistStatement) ??
    cleanStr(d.bioLong) ??
    cleanStr(d.bio_long) ??
    cleanStr(d["bio long"]) ??
    cleanStr(d["artist statement"]) ??
    "";

  // ✅ Background: support both keys
  const backgroundChoice =
    cleanStr(d.backgroundChoice ?? d.backgroundStyle ?? d.backgroundKey) ?? "kraft";

  // Dual title + multi-city
  const currentTitle = cleanStr(d.currentTitle) ?? "";
  const secondLocation = cleanStr(d.secondLocation) ?? "";
  const isBiCoastal = !!d.isBiCoastal;

  // Contact fields: accept multiple worlds
  const location = cleanStr(d.location) ?? "";
  const rawPublicEmail = cleanStr((d as any).publicEmail);
  const rawWebsite = cleanStr(d.website) ?? cleanStr(d.profileUrl) ?? cleanStr(d["profile url"]) ?? "";
  const socials = coerceStrArray(d.socials ?? d.socialLinks ?? d["social links"] ?? d["artist social links"]);

  // Visibility flags: "false" = hidden; blank / "true" = shown (default shown for compat)
  const showWebsite = String((d as any).showWebsite ?? "").trim().toLowerCase() !== "false";
  const showPublicEmail = String((d as any).showPublicEmail ?? "").trim().toLowerCase() !== "false";
  const website = showWebsite ? rawWebsite : "";
  const publicEmail = showPublicEmail ? rawPublicEmail : undefined;

  // Featured link from primarySocial
  const featuredLink = (d as any).featuredLink as { url: string; label: string } | undefined;

  // NOTE: updates shape is handled inside ProfileCard; we just pass through.
  const updates = (d.updates ?? []) as any[];

  if (process.env.NEXT_PUBLIC_DEBUG_PROFILE === "1") {
    clientDebug("🧪 updates passed to ProfileCard:", updates);
  }

  // ✅ Prefer roles[] if available, otherwise fallback to role
  const primaryRole = roles[0] ?? role;

  // ✅ Canonical + alias slugs as a normalized set for robust matching
  const aliasNormSet = useMemo(() => {
    const set = new Set<string>();
    const add = (v: unknown) => {
      const t = normSlugish(v);
      if (t) set.add(t);
    };

    add(slug);
    for (const a of slugAliases) add(a);

    return set;
  }, [slug, slugAliases]);

  // ✅ Author stories (alias-aware, normalized)
const authorStories = useMemo(() => {
  const rows = allStories || [];

  const byId =
    alumniId
      ? rows.filter((s: any) => {
          const sid = String(s?.alumniId ?? s?.alumni_id ?? s?.["alumni id"] ?? "").trim();
          return sid && sid === alumniId;
        })
      : [];

  // ✅ If alumniId produces matches, use them. If not, fall back to slug/alias matching.
  if (byId.length > 0) return byId;

  return rows.filter((s: any) => {
    // match either authorSlug OR alumniId against slug/aliases
    const a = String(
      s?.authorSlug ??
        s?.AuthorSlug ??
        s?.author_slug ??
        s?.["author slug"] ??
        ""
    ).trim();

    const sid = String(
      s?.alumniId ??
        s?.AlumniId ??
        s?.alumni_id ??
        s?.["alumni id"] ??
        ""
    ).trim();

    const aNorm = a ? normSlugish(a) : "";
    const idNorm = sid ? normSlugish(sid) : "";

    return (aNorm && aliasNormSet.has(aNorm)) || (idNorm && aliasNormSet.has(idNorm));
  });
}, [allStories, aliasNormSet, alumniId]);

  // ✅ Detect mobile viewport
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  // ✅ Use the canonical slug for ProfileCard routing
  const safeSlugForLinks = slug;

  // ✅ Dev proof: confirm data is actually present BEFORE it hits ProfileCard
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    // eslint-disable-next-line no-console
    console.log("[AlumniProfilePage] incoming fields:", {
      slug,
      name,
      artistStatement: artistStatement?.slice?.(0, 80),
      statusFlags,
      publicEmail,
      website,
      socials,
    });
  }, [slug, name, artistStatement, statusFlags, publicEmail, website, socials]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{name} | DAT Alumni</title>
      </Head>

      <main style={{ margin: 0, padding: 0, width: "100%", display: "block" }}>
        <AlumniProfileBackdrop backgroundKey={backgroundChoice}>
          <section
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              width: "100%",
              position: "relative",
              minHeight: minSectionHeight,
              paddingTop: 0,
              marginBottom: offsetBottom,
            }}
          >
            <div
              style={{
                width: "85%",
                maxWidth: "1200px",
                margin: isMobile ? "0" : "0 auto",

                ...(isMobile && {
                  marginLeft: "5%",
                  marginRight: "10%",
                }),

                position: "relative",
                overflow: "visible",
                borderRadius: "18px",
                boxShadow: "6px 12px 20px rgba(0, 0, 0, 0.2)",
                top: `calc(${HEADER_HEIGHT} + ${offsetTop})`,
                transition: "top 0.3s ease-in-out",
              }}
            >
              <ProfileCard
                key={slug}
                slug={safeSlugForLinks}
                slugAliases={slugAliases}
                // IMPORTANT: only pass a real stable alumniId.
// If missing, pass nothing so ProfileCard falls back to alias/authorSlug matching.
alumniId={alumniId || undefined}
                name={name}
                role={primaryRole}
                roles={roles}
                headshotUrl={headshotUrl || ""}
                currentHeadshotId={currentHeadshotId || undefined}
                location={location}
                programBadges={programBadges}
                identityTags={identityTags}
                practiceTags={practiceTags}
                exploreCareTags={exploreCareTags}
                statusFlags={statusFlags}
                artistStatement={artistStatement}
                stories={authorStories}
                publicEmail={publicEmail}
                website={website}
                socials={socials}
                featuredLink={featuredLink}
                updates={updates}
                currentTitle={currentTitle || undefined}
                secondLocation={secondLocation || undefined}
                isBiCoastal={isBiCoastal}
                upcomingEvent={upcomingEvent}
              />
            </div>
          </section>
        </AlumniProfileBackdrop>

      </main>
    </>
  );
}
