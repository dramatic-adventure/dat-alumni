// components/profile/ProfileCard.tsx
"use client";

import { useState, useLayoutEffect, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

import ArtistBio from "./ArtistBio";
import ProgramStamps from "@/components/alumni/ProgramStamps";
import Lightbox from "@/components/shared/Lightbox";

// ✅ RESTORE contact UI
import ContactOverlay from "@/components/shared/ContactOverlay";

import type { StoryRow, Production, SpotlightUpdate, Update } from "@/lib/types";
import { productionMap as productionMapCanon, getSortYear } from "@/lib/productionMap.canon";

import MobileProfileHeader from "@/components/alumni/MobileProfileHeader";
import DesktopProfileHeader from "@/components/alumni/DesktopProfileHeader";
import useIsMobile from "@/hooks/useIsMobile";

import SpotlightPanel from "@/components/alumni/SpotlightPanel";
import HighlightPanel from "@/components/alumni/HighlightPanel";
import type { HighlightCard as UIHighlightCard } from "@/components/alumni/HighlightPanel";

import ProfileShowcaseSection from "@/components/profile/ProfileShowcaseSection";
import CategoryScroller from "@/components/alumni/CategoryScroller";
import { mapSpotlightUpdateToUpdate } from "@/lib/mapSpotlightUpdateToUpdate";
import JourneyMiniCard from "@/components/alumni/JourneyMiniCard";

import "@/components/productions/productionCarouselCards.css";

/* -----------------------------------------------------------
 * Local helpers for mapping CSV rows → panel props
 * ----------------------------------------------------------*/
type RawRow = {
  profileSlug?: string;
  type?: string;
  title?: string;
  subtitle?: string;
  bodyNote?: string;
  mediaUrls?: string;
  mediaType?: string;
  eventDate?: string;
  evergreen?: string | boolean;
  expirationDate?: string;
  ctaText?: string;
  ctaUrl?: string;
  featured?: string | boolean;
  sortDate?: string;
  tags?: string;
  [key: string]: any;
};

const norm = (s?: string) => (s ?? "").trim().toLowerCase();
const coerceBool = (v: any) => {
  if (typeof v === "boolean") return v;
  const s = norm(String(v));
  return s === "true" || s === "1" || s === "yes" || s === "y";
};
const firstMedia = (s?: string) => {
  if (!s) return "";
  const parts = s
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  return parts[0] ?? "";
};
const isSpotlightRow = (row: RawRow) => {
  const t = norm(row.type);
  return t === "dat spotlight" || t === "spotlight" || t === "dat-spotlight";
};
const isHighlightRow = (row: RawRow) => {
  const t = norm(row.type);
  return t === "highlight" || t === "highlights";
};

const toSpotlightUpdate = (row: RawRow): SpotlightUpdate => ({
  tag: row.type || "DAT Spotlight",
  headline: row.title || "",
  body: row.bodyNote || "",
  ctaLink: row.ctaUrl,
  mediaUrl: firstMedia(row.mediaUrls),
  evergreen: coerceBool(row.evergreen),
});

const toHighlightCard = (row: RawRow): UIHighlightCard => ({
  headline: row.title || "",
  mediaUrl: firstMedia(row.mediaUrls),
  subheadline: row.subtitle || undefined,
  body: row.bodyNote || undefined,
  ctaLink: row.ctaUrl || undefined,
  evergreen: coerceBool(row.evergreen),
  expirationDate: row.expirationDate || undefined,
});

/* -----------------------------------------------------------
 * Slug normalization for alias-aware matching
 * ----------------------------------------------------------*/
function normSlugish(raw: unknown): string {
  const s0 = String(raw ?? "").trim();
  if (!s0) return "";

  try {
    const u = new URL(s0, "http://local");
    const m = u.pathname.match(/^\/alumni\/([^\/?#]+)/i);
    if (m?.[1]) return m[1].trim().toLowerCase();
  } catch {}

  const m2 = s0.match(/^\/alumni\/([^\/?#]+)/i);
  if (m2?.[1]) return m2[1].trim().toLowerCase();

  return s0.toLowerCase();
}

/** Filter rows to the current profile if profileSlug is present (alias-aware). */
const filterForSlugIfPresent = (rows: RawRow[], aliases: Set<string>) => {
  const anyHaveSlug = rows.some((r) => r.profileSlug != null && String(r.profileSlug).trim() !== "");
  if (!anyHaveSlug) return rows;
  return rows.filter((r) => aliases.has(normSlugish(r.profileSlug)));
};

const FeaturedStories = dynamic(() => import("@/components/shared/FeaturedStories"), {
  ssr: false,
});

type WithMaybeYear = { year?: string | number };
const normalizeProductionYear = <T extends WithMaybeYear>(p: T) => ({
  ...p,
  year: typeof p.year === "string" ? parseInt(p.year, 10) || 0 : p.year ?? 0,
});

function isHttpUrl(s: string) {
  return /^https?:\/\//i.test(s);
}
function isRootRelative(s: string) {
  return s.startsWith("/");
}
function normalizeImageSrc(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;

  const bad = ["null", "undefined", "n/a", "na", "-"];
  if (bad.includes(s.toLowerCase())) return null;

  if (isHttpUrl(s) || isRootRelative(s)) return s;
  if (/^www\./i.test(s)) return `https://${s}`;
  if (s.startsWith("//")) return `https:${s}`;

  return null;
}
function normalizeHref(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "/";
  if (isHttpUrl(s) || isRootRelative(s)) return s;
  if (/^www\./i.test(s)) return `https://${s}`;
  return `/${s.replace(/^\/+/, "")}`;
}

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

function FeaturedWorkCard({
  title,
  href,
  imageUrl,
  metaLine,
}: {
  title: string;
  href: string;
  imageUrl: string;
  metaLine?: string;
}) {
  const fallback = "/posters/fallback-16x9.jpg";
  const safeHref = normalizeHref(href);
  const [imgSrc, setImgSrc] = useState<string>(fallback);

  useEffect(() => {
    let alive = true;

    const candidate = normalizeImageSrc(imageUrl);
    setImgSrc(fallback);
    if (!candidate) return () => void (alive = false);

    const isLocalPoster = candidate.startsWith("/posters/");
    if (isLocalPoster) {
      fetch(candidate, { method: "HEAD" })
        .then((r) => {
          if (!alive) return;
          if (r.ok) setImgSrc(candidate);
          else setImgSrc(fallback);
        })
        .catch(() => {
          if (!alive) return;
          setImgSrc(fallback);
        });

      return () => {
        alive = false;
      };
    }

    setImgSrc(candidate);
    return () => {
      alive = false;
    };
  }, [imageUrl]);

  return (
    <Link href={safeHref} className="related-card no-underline datFeaturedCard" aria-label={title}>
      <div className="related-image-shell datFeaturedImageShell">
        <Image
          src={imgSrc}
          alt={title || "Production image"}
          fill
          sizes="(max-width: 900px) 92vw, 340px"
          className="object-cover"
          onError={() => {
            if (imgSrc !== fallback) setImgSrc(fallback);
          }}
        />
      </div>

      <div className="related-meta">
        <div className="related-title">{title}</div>
        {metaLine ? <div className="related-sub">{metaLine}</div> : null}
      </div>
    </Link>
  );
}

type SpanMeta = { md: "half" | "full"; lg: "third" | "half" | "full" };
function spanMetaForIndex(i: number, len: number): SpanMeta {
  const mdRemainder = len % 2;
  const md: SpanMeta["md"] = mdRemainder === 1 && i === len - 1 ? "full" : "half";

  const lgRemainder = len % 3;
  let lg: SpanMeta["lg"] = "third";
  if (lgRemainder === 1 && i === len - 1) lg = "full";
  else if (lgRemainder === 2 && i >= len - 2) lg = "half";

  return { md, lg };
}

interface ProfileCardProps {
  name: string;
  slug: string;
  role: string;
  headshotUrl?: string;
  currentHeadshotId?: string;
  location?: string;
  identityTags?: any;
  statusFlags?: any;
  programBadges?: any;
  artistStatement?: string;
  stories?: StoryRow[];
  email?: string;
  website?: string;
  socials?: any;
  updates?: RawRow[];
  slugAliases?: string[];
}

const scaleCache = new Map<string, { first: number; last: number }>();

export default function ProfileCard(props: ProfileCardProps) {
  const {
    name,
    slug,
    role,
    headshotUrl,
    currentHeadshotId,
    location,
    email,
    website,
    updates = [],
    stories = [],
    slugAliases = [],
  } = props;

    const derivedHeadshotUrl =
    (currentHeadshotId?.trim()
      ? `/api/media/thumb?fileId=${encodeURIComponent(currentHeadshotId.trim())}`
      : "") ||
    headshotUrl ||
    undefined;

  // ✅ Normalize "array-ish" props defensively
  const identityTags = coerceStrArray((props as any).identityTags ?? (props as any)["identity tags"]);
  const statusFlags = coerceStrArray(
    (props as any).statusFlags ??
      (props as any).statusflags ??
      (props as any)["status flags"] ??
      (props as any).flags ??
      (props as any)["status signifier"],
  );
  const programBadges = coerceStrArray((props as any).programBadges ?? (props as any)["project badges"]);
  const socials = coerceStrArray((props as any).socials ?? (props as any)["social links"]);

  // ✅ Bio/statement: accept multiple keys
  const artistStatement =
    (props.artistStatement ?? "").trim() ||
    String(
      (props as any).bioLong ??
        (props as any).biolong ??
        (props as any)["bio long"] ??
        (props as any)["artist statement"] ??
        "",
    ).trim();

  const profileCardRef = useRef<HTMLDivElement>(null);

  // Name scaling cache vars (unchanged)
  const nameParts = name.trim().split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || nameParts[0];
  const lastName = nameParts.slice(-1).join(" ") || "";

  const firstNameRef = useRef<HTMLDivElement>(null);
  const lastNameRef = useRef<HTMLDivElement>(null);

  const cached = scaleCache.get(name);
  const [firstScale, setFirstScale] = useState(cached?.first ?? 0.95);
  const [lastScale, setLastScale] = useState(cached?.last ?? 0.95);
  const [hasMeasured, setHasMeasured] = useState(!!cached);

  const isMobile = useIsMobile();

  useLayoutEffect(() => {
    if (hasMeasured) return;
    const first = firstNameRef.current;
    const last = lastNameRef.current;
    if (first && last) {
      const firstWidth = first.scrollWidth;
      const lastWidth = last.scrollWidth;
      const widest = Math.max(firstWidth, lastWidth);
      const targetWidth = widest > 360 ? 360 : widest;
      const newFirstScale = targetWidth / firstWidth;
      const newLastScale = targetWidth / lastWidth;
      scaleCache.set(name, { first: newFirstScale, last: newLastScale });
      setFirstScale(newFirstScale);
      setLastScale(newLastScale);
      setHasMeasured(true);
    }
  }, [name, hasMeasured]);

  const hasArtistBio = !!artistStatement?.trim() || identityTags.length > 0;
  const hasStories = stories?.length > 0;

  // ✅ Alias-aware normalized slug set
  const aliasNormSet = useMemo(() => {
    const set = new Set<string>();
    set.add(normSlugish(slug));
    for (const a of slugAliases) set.add(normSlugish(a));
    return set;
  }, [slug, slugAliases]);

  // ✅ Featured productions (unchanged)
  const featuredProductions = useMemo(() => {
    const list = (Object.values(productionMapCanon) as Array<WithMaybeYear & Record<string, any>>)
      .filter((p) => {
        const artists = (p as any)?.artists;
        if (!artists || typeof artists !== "object") return false;

        for (const key of Object.keys(artists as Record<string, any>)) {
          const k = normSlugish(key);
          if (k && aliasNormSet.has(k)) return true;
        }

        for (const v of Object.values(artists as Record<string, any>)) {
          if (!v) continue;

          if (Array.isArray(v)) {
            for (const item of v) {
              const s = normSlugish(
                typeof item === "string"
                  ? item
                  : (item as any)?.slug ?? (item as any)?.profileSlug ?? (item as any)?.alumniSlug,
              );
              if (s && aliasNormSet.has(s)) return true;
            }
          } else if (typeof v === "string") {
            const parts = v
              .split(",")
              .map((x) => normSlugish(x))
              .filter(Boolean);
            if (parts.some((s) => aliasNormSet.has(s))) return true;
          }
        }

        return false;
      })
      .map(normalizeProductionYear)
      .sort((a, b) => {
        const ya = getSortYear(a as any);
        const yb = getSortYear(b as any);
        if (yb !== ya) return yb - ya;
        const sa = Number((a as any).season) || 0;
        const sb = Number((b as any).season) || 0;
        return sb - sa;
      }) as unknown as Production[];

    return list;
  }, [aliasNormSet]);

  const [featuredExpanded, setFeaturedExpanded] = useState(false);
  const [featuredInitialCount, setFeaturedInitialCount] = useState(3);

  useEffect(() => {
    const compute = () => {
      const w = typeof window !== "undefined" ? window.innerWidth : 1200;
      const count = w >= 1024 ? 3 : w >= 768 ? 2 : 1;
      setFeaturedInitialCount(count);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const visibleFeaturedProductions = useMemo(() => {
    if (featuredExpanded) return featuredProductions;
    return featuredProductions.slice(0, featuredInitialCount);
  }, [featuredExpanded, featuredProductions, featuredInitialCount]);

  const canToggleFeatured = featuredProductions.length > featuredInitialCount;

  /* ---------- PANELS ---------- */
  const rowsForThisProfile = filterForSlugIfPresent(updates as RawRow[], aliasNormSet);
  const spotlightUpdates = rowsForThisProfile.filter(isSpotlightRow).map(toSpotlightUpdate);
  const highlightUpdates: UIHighlightCard[] = rowsForThisProfile.filter(isHighlightRow).map(toHighlightCard);

  const hasSpotlight = spotlightUpdates.length > 0;
  const hasHighlight = highlightUpdates.length > 0;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxUrls, setLightboxUrls] = useState<string[]>([]);

  const spotlightSection = hasSpotlight ? <SpotlightPanel updates={spotlightUpdates} /> : null;
  const highlightSection = hasHighlight ? <HighlightPanel cards={highlightUpdates} /> : null;

  const categorizedUpdatesMap = new Map<string, Update[]>();
  rowsForThisProfile
    .filter((u) => !isHighlightRow(u) && !isSpotlightRow(u))
    .forEach((raw) => {
      const pseudo: SpotlightUpdate = {
        tag: raw.type,
        headline: raw.title || "",
        body: raw.bodyNote || "",
        ctaLink: raw.ctaUrl,
        mediaUrl: firstMedia(raw.mediaUrls),
        evergreen: coerceBool(raw.evergreen),
      };
      const update = mapSpotlightUpdateToUpdate(pseudo);
      const category = update.tag || "Other";
      if (!categorizedUpdatesMap.has(category)) categorizedUpdatesMap.set(category, []);
      categorizedUpdatesMap.get(category)!.push(update);
    });

  const categorizedJourneyUpdates = Array.from(categorizedUpdatesMap.entries()).map(([category, updates]) => ({
    category,
    updates,
  }));

  return (
    <div ref={profileCardRef} style={{ position: "relative" }}>
      {/* ✅ RESTORED Contact tab/overlay moved to mobile and desktop profile headers */}

      {isMobile ? (
        <MobileProfileHeader
          alumniId={slug}
          name={name}
          role={role}
          location={location}
          headshotUrl={derivedHeadshotUrl}
          email={email}
          website={website}
          socials={socials}
          statusFlags={statusFlags}
        />
      ) : (
        <DesktopProfileHeader
          alumniId={slug}
          name={name}
          role={role}
          location={location}
          headshotUrl={derivedHeadshotUrl}
          email={email}
          website={website}
          socials={socials}
          statusFlags={statusFlags}
        />
      )}

      {(hasArtistBio || hasSpotlight || hasHighlight) && (
        <div style={{ backgroundColor: "#2493A9", paddingTop: hasArtistBio ? "3rem" : "2rem", paddingBottom: "2.5rem" }}>
          {hasArtistBio && (
            <ArtistBio
              identityTags={identityTags}
              artistStatement={artistStatement}
              fontFamily="var(--font-dm-sans), system-ui, sans-serif"
              fontSize="1.15rem"
              color="#0C2D37"
              fontStyle="normal"
              fontWeight={400}
              letterSpacing="normal"
              identityTagStyle={{
                marginTop: "0rem",
                marginBottom: "2.5rem",
                marginLeft: isMobile ? "30px" : "310px",
                marginRight: "30px",
              }}
              bioStyle={{
                marginLeft: "30px",
                marginRight: "30px",
                marginTop: "1rem",
                marginBottom: "3rem",
                maxWidth: "calc(100% - 60px)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflowWrap: "anywhere",
              }}
            />
          )}
        </div>
      )}

      {(hasSpotlight || hasHighlight) && (
        <div style={{ margin: "2rem 30px 2.5rem 30px" }}>
          <ProfileShowcaseSection>
            {spotlightSection}
            {highlightSection}
          </ProfileShowcaseSection>
        </div>
      )}

      <CategoryScroller
        categories={categorizedJourneyUpdates}
        onCardClick={(category) => {
          const el = document.getElementById(`journey-category-${category}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      {categorizedJourneyUpdates.length > 0 && (
        <div style={{ margin: "2rem 30px 3rem 30px" }}>
          <ProfileShowcaseSection>
            {categorizedJourneyUpdates.map(({ category, updates }) => (
              <div key={category} id={`journey-category-${category}`} style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontSize: "2rem", marginBottom: "1rem", color: "#241123" }}>
                  {category}
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                  {updates.map((update, index) => (
                    <JourneyMiniCard
                      key={index}
                      update={update}
                      onClick={() => {
                        const link = update.ctaLink?.trim();
                        const media =
                          update.mediaUrls
                            ?.split(",")
                            .map((url) => url.trim())
                            .filter(Boolean) || [];

                        if (link?.startsWith("http")) {
                          window.open(link, "_blank");
                        } else if (media.length > 0) {
                          setLightboxUrls(media);
                          setLightboxOpen(true);
                        } else {
                          alert("This update has no link or media. Here's the content:\n\n" + (update.body || "No content"));
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </ProfileShowcaseSection>
        </div>
      )}

      {featuredProductions.length > 0 && (
        <div className="bg-[#19657c] py-[30px] px-[30px]">
          <h2
            className="text-6xl text-[#D9A919] mb-4"
            style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif" }}
          >
            Featured DAT Work
          </h2>

          <p
            className="text-[#5BBFD3] text-lg max-w-3xl mb-8"
            style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
          >
            Developed through cross-cultural exchange and a fearless approach to storytelling, this
            work reflects a deep engagement with place, people, and purpose.
          </p>

          <style>{`
            .datFeaturedCard{
              border-top-left-radius: 0 !important;
              border-top-right-radius: 0 !important;
              border-bottom-left-radius: 18px !important;
              border-bottom-right-radius: 18px !important;
              overflow: hidden;

              width: 100% !important;
              max-width: none !important;
              justify-self: stretch !important;
              display: block !important;
            }

            .datFeaturedImageShell{
              border-radius: 0 !important;
              overflow: hidden;
            }

            .datFeaturedGrid{
              display: grid;
              grid-template-columns: 1fr;
              gap: 14px;
              width: 100%;
            }

            @media (min-width: 768px){
              .datFeaturedGrid{
                grid-template-columns: repeat(4, minmax(0, 1fr));
              }
              .datFeaturedItem[data-md="half"]{ grid-column: span 2; }
              .datFeaturedItem[data-md="full"]{ grid-column: 1 / -1; }
            }

            @media (min-width: 1024px){
              .datFeaturedGrid{
                grid-template-columns: repeat(6, minmax(0, 1fr));
              }
              .datFeaturedItem[data-lg="third"]{ grid-column: span 2; }
              .datFeaturedItem[data-lg="half"]{ grid-column: span 3; }
              .datFeaturedItem[data-lg="full"]{ grid-column: 1 / -1; }
            }
          `}</style>

          <div className="datFeaturedGrid" role="list">
            {visibleFeaturedProductions.map((p, i) => {
              const yearText = p?.year ? String((p as any).year) : "";
              const cityText = (p as any)?.location ? String((p as any).location) : "";
              const metaLine = [yearText, cityText].filter(Boolean).join(" • ");
              const posterGuess = `/posters/${(p as any).slug}-landscape.jpg`;

              const span = spanMetaForIndex(i, visibleFeaturedProductions.length);

              return (
                <div
                  key={(p as any).slug}
                  role="listitem"
                  className="datFeaturedItem"
                  data-md={span.md}
                  data-lg={span.lg}
                  style={{ minWidth: 0 }}
                >
                  <FeaturedWorkCard
                    title={(p as any).title}
                    href={`/theatre/${(p as any).slug}`}
                    imageUrl={posterGuess}
                    metaLine={metaLine}
                  />
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              marginTop: "2rem",
            }}
          >
            {canToggleFeatured && (
              <button
                type="button"
                onClick={() => setFeaturedExpanded((v) => !v)}
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.35rem",
                  fontSize: "1.2rem",
                  color: "#241123",
                  backgroundColor: "#3FA9BE",
                  padding: "18px 40px",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "opacity 0.2s ease-in-out",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {featuredExpanded ? "Show Fewer Productions" : "Show All My Productions"}
              </button>
            )}

            <Link
              href="/theatre"
              style={{
                marginTop: "0.6rem",
                textAlign: "right",
                width: "100%",
                fontFamily: "var(--font-rock-salt), cursive",
                fontSize: "1rem",
                color: "#3FA9BE",
                textDecoration: "none",
                transition: "color 0.2s ease-in-out",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#6C00AF")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#3FA9BE")}
            >
              ← Explore all DAT productions&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </Link>
          </div>
        </div>
      )}

      {/* ✅ IMPORTANT FIX:
          Don't gate stamps on programBadges. ProgramStamps should be driven by
          programMap + slug (and it can no-op internally if none found). */}
      {!!slug?.trim() && (
        <div className="relative py-6 m-0 animate-fadeIn" style={{ zIndex: 50 }}>
          <div className="max-w-6xl mx-auto px-4">
            <ProgramStamps artistSlug={slug} slugAliases={slugAliases} />
          </div>
        </div>
      )}

      {/* ✅ Featured Stories: DO NOT re-filter by authorSlug here.
          The parent already passed the correct (alias-aware) slice. */}
      {hasStories && (
        <section className="bg-[#f2f2f2] rounded-xl px-[30px] py-[30px] mt-[0px]">
          <FeaturedStories stories={stories} authorSlug={undefined} />
        </section>
      )}

      {lightboxOpen && <Lightbox images={lightboxUrls} onClose={() => setLightboxOpen(false)} />}
    </div>
  );
}