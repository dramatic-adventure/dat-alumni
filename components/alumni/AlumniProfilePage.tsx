"use client";

import Head from "next/head";
import { useMemo, useState, useEffect } from "react";
import { AlumniRow, StoryRow } from "@/lib/types";
import ProfileCard from "@/components/profile/ProfileCard";
import AlumniProfileBackdrop from "@/components/alumni/AlumniProfileBackdrop";
import { clientDebug } from "@/lib/clientDebug";

// ✅ Option B: import the card CSS right here (local usage)
import "@/components/productions/productionCarouselCards.css";

import Image from "next/image";
import Link from "next/link";

import { productionMap, getSortYear } from "@/lib/productionMap";
import { productionDetailsMap } from "@/lib/productionDetailsMap";

interface AlumniProfileProps {
  data: AlumniRow;
  allStories: StoryRow[];
  offsetTop?: string; // Additional offset for fine-tuning (e.g., "-2rem")
  offsetBottom?: string; // Space below section (e.g., "-6rem")
  minSectionHeight?: string; // Ensures parallax coverage (e.g., "140vh")
}

const HEADER_HEIGHT = "84px"; // ✅ Adjust if your header height changes

function cleanStr(v?: string | null): string | undefined {
  const t = (v ?? "").trim();
  return t.length ? t : undefined;
}

// ---- NEW: robust URL normalizers to prevent "Failed to construct 'URL': Invalid URL" ----
function isHttpUrl(s: string) {
  return /^https?:\/\//i.test(s);
}
function isRootRelative(s: string) {
  return s.startsWith("/");
}

/**
 * Normalize an arbitrary "URL-ish" string into something Next/Image can accept.
 * Returns null if we can't safely use it.
 */
function normalizeImageSrc(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;

  const bad = ["null", "undefined", "n/a", "na", "-"];
  if (bad.includes(s.toLowerCase())) return null;

  // Valid for next/image: http(s) or /root-relative
  if (isHttpUrl(s) || isRootRelative(s)) return s;

  // "www.example.com/..." -> "https://www.example.com/..."
  if (/^www\./i.test(s)) return `https://${s}`;

  // protocol-relative: //cdn.site.com/img.jpg
  if (s.startsWith("//")) return `https:${s}`;

  // Anything else is unsafe (e.g. "images/foo.jpg" without leading slash)
  return null;
}

/**
 * Normalize href for <Link>.
 * - external http(s) stays as-is
 * - /root-relative stays as-is
 * - otherwise coerces to "/..."
 */
function normalizeHref(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "/";

  if (isHttpUrl(s) || isRootRelative(s)) return s;

  // handle "www..." too, just in case
  if (/^www\./i.test(s)) return `https://${s}`;

  return `/${s.replace(/^\/+/, "")}`;
}
// -------------------------------------------------------------------------------

function prodHref(prod: { slug: string; url?: string }) {
  const u = cleanStr(prod.url ?? undefined);
  // if url is an empty string, treat as unset
  if (u) return normalizeHref(u);
  return `/theatre/${prod.slug}`;
}

function displayYear(prod: { year: number | string }) {
  const y = prod.year;
  if (typeof y === "number") return String(y);
  const s = String(y).trim();
  return s.length ? s : "";
}

function pickProdImage(slug: string, fallbackPoster?: string | null) {
  const details = productionDetailsMap?.[slug];
  const hero = cleanStr(details?.heroImageUrl ?? undefined);
  if (hero) return hero;

  const poster = cleanStr(fallbackPoster ?? undefined);
  if (poster) return poster;

  return "/posters/fallback-16x9.jpg";
}

function ProductionGridCard({
  slug,
  title,
  href,
  imageUrl,
  metaLine,
}: {
  slug: string;
  title: string;
  href: string;
  imageUrl: string;
  metaLine?: string;
}) {
  const fallback = "/posters/fallback-16x9.jpg";

  // ✅ sanitize upfront so Next/Image never sees an invalid URL
  const initial = normalizeImageSrc(imageUrl) ?? fallback;
  const [imgSrc, setImgSrc] = useState<string>(initial);

  // Keep state in sync when props change
  useEffect(() => {
    setImgSrc(normalizeImageSrc(imageUrl) ?? fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  const safeHref = normalizeHref(href);

  return (
    <Link href={safeHref} className="related-card no-underline" aria-label={title}>
      <div className="related-image-shell">
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

export default function AlumniProfilePage({
  data,
  allStories,
  offsetTop = "2rem",
  offsetBottom = "15rem",
  minSectionHeight = "100vh",
}: AlumniProfileProps) {
  const {
    slug,
    name,
    roles = [],
    role = "", // legacy fallback
    headshotUrl = "",
    programBadges = [],
    identityTags = [],
    statusFlags = [],
    artistStatement = "",
    backgroundChoice = "kraft",
    location = "",
    email = "",
    website = "",
    socials = [],
    updates = [],
  } = data || {};

  clientDebug("🧪 updates passed to ProfileCard:", updates);

  // ✅ Prefer roles[] if available, otherwise fallback to role
  const displayRole = roles.length > 0 ? roles.join(", ") : role;

  const authorStories = useMemo(
    () => allStories.filter((story) => story.authorSlug === slug),
    [allStories, slug]
  );

  // ✅ Detect mobile viewport
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  // ✅ Build productions list for this alumni slug by scanning productionMap
  const productionsForArtist = useMemo(() => {
    const list = Object.values(productionMap).filter((p) => {
      const artists = p?.artists || {};
      return !!artists?.[slug];
    });

    // newest first (handles number OR string year)
    list.sort((a, b) => {
      const ya = getSortYear(a);
      const yb = getSortYear(b);
      if (yb !== ya) return yb - ya;
      // secondary: season desc
      const sa = Number(a.season) || 0;
      const sb = Number(b.season) || 0;
      return sb - sa;
    });

    return list;
  }, [slug]);

  const hasProductions = productionsForArtist.length > 0;

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
                slug={slug}
                name={name}
                role={displayRole}
                headshotUrl={headshotUrl}
                location={location}
                programBadges={programBadges}
                identityTags={identityTags}
                statusFlags={statusFlags}
                artistStatement={artistStatement}
                stories={authorStories}
                email={email}
                website={website}
                socials={socials}
                updates={updates}
              />

              {/* ✅ Productions grid (3 / 2 / 1) */}
              {hasProductions && (
                <section className="alumni-prod-wrap" aria-label="Productions">
                  <div className="alumni-prod-head">
                    <h2 className="alumni-prod-title">Productions</h2>
                  </div>

                  <div className="alumni-prod-grid" role="list">
                    {productionsForArtist.map((p) => {
                      const details = productionDetailsMap?.[p.slug];
                      const href = prodHref(p);

                      // ✅ sanitize image url before it ever reaches <Image />
                      const rawImageUrl = pickProdImage(p.slug, p.posterUrl ?? "");
                      const imageUrl =
                        normalizeImageSrc(rawImageUrl) ?? "/posters/fallback-16x9.jpg";

                      const yearText = displayYear(p);
                      const city =
                        cleanStr(details?.city ?? undefined) ??
                        cleanStr((p as any).location ?? undefined);
                      const dates = cleanStr(details?.dates ?? undefined);

                      // Prefer dates if present, otherwise year
                      const left = dates ?? yearText;
                      const metaLine = [left, city].filter(Boolean).join(" • ");

                      return (
                        <div key={p.slug} role="listitem">
                          <ProductionGridCard
                            slug={p.slug}
                            title={p.title}
                            href={href}
                            imageUrl={imageUrl}
                            metaLine={metaLine}
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          </section>

          {/* Local page styles (copy/paste-friendly) */}
          <style>{`
            .alumni-prod-wrap{
              margin-top: 28px;
              padding-top: 18px;
              border-top: 1px solid rgba(36,17,35,0.16);
            }

            .alumni-prod-head{
              display:flex;
              align-items: baseline;
              justify-content: space-between;
              gap: 12px;
              padding: 0 18px;
            }

            .alumni-prod-title{
              margin: 0;
              font-family: var(--font-dm-sans, system-ui, sans-serif);
              font-size: .86rem;
              text-transform: uppercase;
              letter-spacing: .22em;
              color: #241123B3;
              font-weight: 300;
            }

            /* ✅ 3 / 2 / 1 grid */
            .alumni-prod-grid{
              margin-top: 16px;
              padding: 0 18px 18px;
              display: grid;
              grid-template-columns: 1fr;
              gap: 14px;
            }

            @media (min-width: 641px){
              .alumni-prod-grid{
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
            }

            @media (min-width: 901px){
              .alumni-prod-grid{
                grid-template-columns: repeat(3, minmax(0, 1fr));
              }
            }

            .alumni-prod-grid > div{
              min-width: 0;
            }

            /* In grid context, don't cap the card width */
            .alumni-prod-grid .related-card{
              width: 100% !important;
            }
          `}</style>
        </AlumniProfileBackdrop>
      </main>
    </>
  );
}
