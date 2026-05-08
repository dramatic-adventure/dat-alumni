// components/drama/DramaClubPageTemplate.tsx
"use client";

import {
  useMemo,
  useState,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from "react";

import Image from "next/image";
import Link from "next/link";

import type { DramaClub } from "@/lib/dramaClubMap";
import type { ActiveProgram } from "@/lib/programMap";

import {
  computeDramaClubStatus,
  type DramaClubStatus,
} from "@/lib/dramaClubStatus";
import DramaClubBadge from "@/components/ui/DramaClubBadge";
import { DATButtonLink } from "@/components/ui/DATButton";
import {
  CAUSE_SUBCATEGORIES_BY_CATEGORY,
  type DramaClubCause,
} from "@/lib/causes";
import Lightbox from "@/components/shared/Lightbox";

import {
  DRAMA_CLUB_STATUS_META,
  DRAMA_CLUB_STATUS_LABEL,
} from "@/lib/dramaClubStatusStyles";

import DramaClubMomentsGallery from "@/components/drama/DramaClubMomentsGallery";

import type { PersonRef } from "@/lib/buildDramaClubLeadTeam";
import {
  type DatEvent,
  categoryMeta,
  shortMonth,
  dayOfMonth,
  eventYear,
  getEventImage,
  isCommunityShowcase,
  isElapsed,
} from "@/lib/events";

import MiniProfileCard from "@/components/profile/MiniProfileCard";

import ArtistLineageMarquee from "@/components/drama/ArtistLineageMarquee";

/* ---------- Types for v2+ content ---------- */

type DramaClubWorkingLanguages = {
  direct?: string[];
  interpretation?: string[];
  interpretationLabel?: string;
  note?: string;
};

type EmbeddableVideo = {
  url: string;
  title?: string;
  provider?: "youtube" | "vimeo" | "file" | "other";
};

type EldersQuote = {
  text: string;
  name?: string;
  role?: string;
  avatarSrc?: string;
};

type DramaClubPartner = {
  name: string;
  href?: string;
  kind?: "community" | "school" | "ngo" | "artistic" | "impact";
  logoSrc?: string;
  logoAlt?: string;
};

type DramaClubMetric = {
  label: string;
  value?: number | string;
  helper?: string;
};

type DramaClubResource = {
  label: string;
  href: string;
};

type ImpactBandMetric = {
  id: string;
  label: string;
  value: string;
  helper?: string;
};

type ResolvedCause = { label: string; href: string };

type GalleryItem = { src: string; alt?: string };

type VisitingArtist = {
  name: string;
  href?: string;
  avatarSrc?: string;
  tag?: string;
  role?: string;
  subtitle?: string;
};

type SnapshotStamp = {
  key: string;
  label: string;
  value: ReactNode;
  variant?: "meta";
  span2?: boolean;
};

type LineageArtist = {
  name: string;
  slug: string;
  role: string;
  headshotUrl?: string;
  href?: string;
};

export interface DramaClubPageTemplateProps {
  club: DramaClub;

  /** OPTIONAL: pass the full list so we can render the kraft-paper footer nav */
  allClubs?: DramaClub[];

  // SECTION A — Identity (optional overrides)
  localLanguageName?: string;
  localLanguageLabel?: string;
  heroTextureTagline?: string;
  ageRange?: string;

  // Optional override for *texture/landscape* hero image
  heroImageOverrideSrc?: string;
  heroImageOverrideAlt?: string;

  // SECTION B — Story
  whatHappensCopy?: string | string[];
  eldersQuote?: EldersQuote;
  exchangeSnippet?: string;

  // SECTION C — Community
  communityPartners?: DramaClubPartner[];
  communityNeeds?: string[];
  localContext?: string | string[];

  // SECTION D — Impact
  impactMetrics?: DramaClubMetric[];
  impactResources?: DramaClubResource[];
  sponsorLink?: string;
  artistProgramsLink?: string;
  backToIndexHref?: string;

  // ✅ computed server-side, just render here
  dramaClubLeadTeam?: PersonRef[];

  /**
   * ✅ Optional (recommended): computed server-side from programs/projects.
   * Use this for the Artist Lineage marquee so it can be "right artists → right club".
   */
  lineageArtists?: PersonRef[];

  /** Events linked to this drama club via lib/events.ts (dramaClub field = slug) */
  clubEvents?: DatEvent[];

  /**
   * URL-verified programs directly associated with this club.
   * Computed server-side via getActiveProgramsForClub() — renders nothing when empty.
   */
  activePrograms?: ActiveProgram[];
}

/* ---------- Helpers ---------- */

const EMPTY_VISITING_ARTISTS: VisitingArtist[] = [];

const statusSummary: Record<DramaClubStatus, string> = {
  new: "Just launched",
  ongoing: "Rooted and growing",
  legacy: "Carried forward",
};

function toParas(input?: string | string[]): string[] {
  if (!input) return [];
  if (Array.isArray(input))
    return input
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean);
  return input
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function safeNumber(n: number | undefined | null): string | undefined {
  if (typeof n !== "number" || Number.isNaN(n)) return undefined;
  return n.toLocaleString();
}

function computeYearsActive(opts: {
  foundedYear?: number;
  firstYearActive?: number;
  lastYearActive?: number | "present";
}) {
  const { foundedYear, firstYearActive, lastYearActive } = opts;

  const start = firstYearActive ?? foundedYear;
  if (!start) return undefined;

  const nowYear = new Date().getFullYear();
  const end =
    !lastYearActive || lastYearActive === "present" ? nowYear : lastYearActive;

  if (end < start) return undefined;
  return end - start + 1;
}

/**
 * Slug helper (URL-safe). This *intentionally* strips diacritics for stable paths.
 * IMPORTANT: This does NOT affect what we render on-screen; names keep diacritics.
 */
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function firstString(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function clampLine(text: string, maxLen = 140): string {
  const raw = text.replace(/\s+/g, " ").trim();
  if (!raw) return "";
  if (raw.length <= maxLen) return raw;

  const slice = raw.slice(0, maxLen);
  const lastEnd = Math.max(
    slice.lastIndexOf("."),
    slice.lastIndexOf("!"),
    slice.lastIndexOf("?")
  );
  if (lastEnd > 60) return slice.slice(0, lastEnd + 1).trim();
  return `${slice.trimEnd()}…`;
}

function formatYouthServedLine(n?: number): string | undefined {
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return undefined;
  const rounded = n >= 100 ? Math.round(n / 10) * 10 : Math.round(n);
  return `~${rounded} youth artists`;
}

function getDramaClubHref(club: DramaClub): string {
  const slug =
    (club as unknown as { slug?: string }).slug ||
    (club as unknown as { id?: string }).id ||
    slugify(club.name || "drama-club");
  return `/drama-club/${slug}`;
}

function getGeoLine(club: DramaClub): string | undefined {
  const region = (club as unknown as { region?: string }).region;
  const country = club.country;
  if (country && region) return `${country} – ${region}`;
  return country || region || undefined;
}

function getVoicesFromTagline(input?: string): string | undefined {
  const raw = (input ?? "").trim();
  if (!raw) return undefined;

  // Prefer the bullet separators you’re already using
  const bulletParts = raw
    .split(/\s*[•·|]\s*/g)
    .map((s) => s.trim())
    .filter(Boolean);

  if (bulletParts.length >= 2) return bulletParts[bulletParts.length - 1];

  // Fallback: sometimes people use dashes instead of bullets
  const dashParts = raw
    .split(/\s*(?:—|–|-)\s*/g)
    .map((s) => s.trim())
    .filter(Boolean);

  if (dashParts.length >= 2) return dashParts[dashParts.length - 1];

  return raw;
}

function getPlaceTaglineFallback(club: DramaClub): string | undefined {
  const texture = (club as unknown as { heroTextureTagline?: string }).heroTextureTagline?.trim();
  if (texture) return texture;

  const city = (club as unknown as { city?: string }).city?.trim();
  if (city) return city;

  const region = (club as unknown as { region?: string }).region?.trim();
  if (region) return region;

  const country = club.country?.trim();
  if (country) return country;

  return undefined;
}

function getMomentsHeadline(club: DramaClub): string {
  const name = (club.name || "").trim();
  const city = (club as unknown as { city?: string }).city?.trim();
  const country = club.country?.trim();

  if (name) return `Moments from the ${name} Drama Club`;
  if (city) return `Moments from the DAT Drama Club in ${city}`;
  if (country) return `Moments from a DAT Drama Club in ${country}`;
  return "Moments from a DAT Drama Club";
}


function geoSortKey(club: DramaClub) {
  const country = (club.country || "").trim();
  const region = ((club as unknown as { region?: string }).region || "").trim();
  const name = (club.name || "").trim();
  const fallback = `${country}|||${region}|||${name}`.toLowerCase();

  const cKey = country ? country.toLowerCase() : "zzzz";
  const rKey = region ? region.toLowerCase() : "zzzz";
  const nKey = name ? name.toLowerCase() : "zzzz";
  return `${cKey}|||${rKey}|||${nKey}|||${fallback}`;
}

/**
 * Name key used ONLY for de-duping / comparisons.
 * We normalize to NFC so diacritics remain composed (not accidentally dropped).
 * We do NOT use this for display; display always uses the original name string.
 */
function nameKey(s: string) {
  return s
    .normalize("NFC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();
}

/* ---------- Language helpers (legacy + structured object) ---------- */

type StructuredLanguage = {
  direct?: unknown[];
  interpretation?: unknown[];
  interpretationLabel?: unknown;
  note?: unknown;
};

const isStructuredLanguage = (v: unknown): v is StructuredLanguage => {
  if (!v || typeof v !== "object") return false;
  const anyV = v as Record<string, unknown>;
  return (
    Array.isArray(anyV.direct) ||
    Array.isArray(anyV.interpretation) ||
    typeof anyV.note === "string" ||
    typeof anyV.interpretationLabel === "string"
  );
};

function renderLanguageValue(lang?: unknown): ReactNode | null {
  if (!lang) return null;

  // Legacy string / string[]
  if (typeof lang === "string" || Array.isArray(lang)) {
    const tokens = (Array.isArray(lang) ? lang : [lang])
      .map((t) => String(t).trim())
      .filter(Boolean);

    if (!tokens.length) return null;

    return tokens.map((token, index) => (
      <span key={index}>
        {index > 0 ? " · " : ""}
        {token}
      </span>
    ));
  }

  // Structured { direct?: string[]; interpretation?: string[] }
  if (isStructuredLanguage(lang)) {
    const direct = (lang.direct ?? [])
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim())
      .filter(Boolean);

    const interp = (lang.interpretation ?? [])
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim())
      .filter(Boolean);

    const parts: ReactNode[] = [];

    direct.forEach((d, idx) => {
      parts.push(
        <span key={`d-${idx}`}>
          {parts.length ? " · " : ""}
          {d}
        </span>
      );
    });

    interp.forEach((i, idx) => {
      parts.push(
        <span key={`i-${idx}`}>
          {parts.length ? " · " : ""}
          {i} <em>(via interpreters)</em>
        </span>
      );
    });

    return parts.length ? <>{parts}</> : null;
  }

  return null;
}

/* ---------- Video helpers (inline + resilient) ---------- */

function detectVideoProvider(url: string): EmbeddableVideo["provider"] {
  const u = (url || "").trim().toLowerCase();
  if (!u) return "other";

  if (
    u.includes("youtube.com") ||
    u.includes("youtu.be") ||
    u.includes("youtube-nocookie.com")
  )
    return "youtube";
  if (u.includes("vimeo.com")) return "vimeo";

  const bare = u.split("?")[0].split("#")[0];

  if (
    bare.startsWith("/") ||
    bare.endsWith(".mp4") ||
    bare.endsWith(".webm") ||
    bare.endsWith(".mov") ||
    bare.endsWith(".m4v")
  ) {
    return "file";
  }

  return "other";
}

function extractYouTubeId(url: string): string | undefined {
  const raw = (url || "").trim();
  if (!raw) return undefined;

  // youtu.be/<id>
  const m1 = raw.match(/youtu\.be\/([^/?#]+)/i);
  if (m1?.[1]) return m1[1];

  // youtube.com/watch?v=<id>
  const m2 = raw.match(/[?&]v=([^&]+)/i);
  if (m2?.[1]) return m2[1];

  // youtube.com/embed/<id> OR youtube-nocookie.com/embed/<id>
  const m3 = raw.match(/youtube(?:-nocookie)?\.com\/embed\/([^/?#]+)/i);
  if (m3?.[1]) return m3[1];

  // youtube.com/shorts/<id>
  const m4 = raw.match(/youtube\.com\/shorts\/([^/?#]+)/i);
  if (m4?.[1]) return m4[1];

  return undefined;
}

function extractVimeoId(url: string): string | undefined {
  const raw = (url || "").trim();
  if (!raw) return undefined;

  // vimeo.com/<id>
  const m1 = raw.match(/vimeo\.com\/(\d+)/i);
  if (m1?.[1]) return m1[1];

  // player.vimeo.com/video/<id>
  const m2 = raw.match(/vimeo\.com\/video\/(\d+)/i);
  if (m2?.[1]) return m2[1];

  return undefined;
}

function getEmbedSrc(video: EmbeddableVideo): {
  provider: EmbeddableVideo["provider"];
  src?: string;
} {
  const url = (video?.url || "").trim();
  if (!url) return { provider: "other", src: undefined };

  const provider = (video.provider ||
    detectVideoProvider(url)) as EmbeddableVideo["provider"];

  if (provider === "youtube") {
    const id = extractYouTubeId(url);
    if (!id) return { provider, src: undefined };
    return {
      provider,
      src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`,
    };
  }

  if (provider === "vimeo") {
    const id = extractVimeoId(url);
    if (!id) return { provider, src: undefined };
    return {
      provider,
      src: `https://player.vimeo.com/video/${encodeURIComponent(id)}`,
    };
  }

  if (provider === "file") {
    return { provider, src: url };
  }

  // "other" -> we can't reliably embed; return undefined
  return { provider: "other", src: undefined };
}

function RoomVideoBlock({ video }: { video: EmbeddableVideo }) {
  const titleSafe = (video.title || "Club video").trim();
  const { provider, src } = getEmbedSrc(video);

  if (!src) return null;

  // Responsive frame without needing CSS
  const frameStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    maxWidth: "100%",
    paddingTop: "56.25%", // 16:9
    borderRadius: 16,
    overflow: "hidden",
  };

  const innerStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    border: 0,
  };

  return (
    // ✅ NO heading/label/caption + ✅ space above (between exchange + video)
    <div
      className="dc-room-video"
      style={{
        marginTop: 18,
        width: "100%",
        maxWidth: "100%",
        marginLeft: 0,
        marginRight: 0,
      }}
    >
      {provider === "file" ? (
        <div style={{ width: "100%", borderRadius: 16, overflow: "hidden" }}>
          <video
            src={src}
            controls
            playsInline
            preload="metadata"
            style={{ width: "100%", height: "auto", display: "block" }}
            aria-label={titleSafe}
          />
        </div>
      ) : (
        <div className="dc-room-video-frame" style={frameStyle}>
          <iframe
            src={src}
            title={titleSafe}
            style={innerStyle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}

/* ===================== VOICE PORTRAIT CARD ===================== */

/**
 * 4:5 portrait panel for voices — photo with quote overlaid (semi-transparent scrim),
 * or a dark/kraft panel when no photo is available. Attribution sits beneath.
 */
function VoicePortraitCard({
  imageSrc,
  imageAlt,
  quote,
  attribution,
  onImageClick,
}: {
  imageSrc?: string;
  imageAlt?: string;
  quote: string;
  attribution?: string;
  onImageClick?: () => void;
}) {
  const hasImage = !!imageSrc;
  return (
    <div className="dc-voice-portrait">
      <div
        className={`dc-voice-portrait__panel${hasImage ? " dc-voice-portrait__panel--photo" : " dc-voice-portrait__panel--dark"}`}
        onClick={hasImage && onImageClick ? onImageClick : undefined}
        role={hasImage && onImageClick ? "button" : undefined}
        tabIndex={hasImage && onImageClick ? 0 : -1}
        onKeyDown={
          hasImage && onImageClick
            ? (e) => { if (e.key === "Enter") onImageClick(); }
            : undefined
        }
      >
        {hasImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={imageAlt || ""}
            className="dc-voice-portrait__img"
            loading="lazy"
            decoding="async"
          />
        )}
        <div className="dc-voice-portrait__scrim" />
        <div className="dc-voice-portrait__quote-area">
          <p className="dc-voice-portrait__text font-display">"{quote}"</p>
        </div>
      </div>
      {attribution && (
        <p className="dc-voice-portrait__attribution font-sans">{attribution}</p>
      )}
    </div>
  );
}

/* ===================== TEMPLATE ===================== */


export default function DramaClubPageTemplate(props: DramaClubPageTemplateProps) {
  const {
    club,
    allClubs,

    localLanguageName,
    localLanguageLabel,
    heroTextureTagline: heroTextureTaglineProp,
    ageRange: ageRangeProp,

    heroImageOverrideSrc,
    heroImageOverrideAlt,

    whatHappensCopy,
    eldersQuote,
    exchangeSnippet,

    communityPartners,
    communityNeeds,
    localContext,

    impactMetrics,
    impactResources,
    sponsorLink,
    artistProgramsLink = "/programs",
    backToIndexHref = "/drama-club",

    dramaClubLeadTeam = [],
    lineageArtists = [],
    clubEvents = [],
    activePrograms = [],
  } = props;

  // Upcoming community showcases for this drama club (shown near top)
  const upcomingShowcases = useMemo(
    () => clubEvents.filter((e) => isCommunityShowcase(e) && !isElapsed(e)),
    [clubEvents]
  );

  // Events for the bottom band — exclude upcoming showcases (already shown at top)
  const bandEvents = useMemo(
    () => clubEvents.filter((e) => !(isCommunityShowcase(e) && !isElapsed(e))),
    [clubEvents]
  );

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);


  const ageRange =
    ageRangeProp ?? ((club as unknown as { ageRange?: string }).ageRange);

  const effectiveLocalLanguageName =
    localLanguageName ??
    (club as unknown as { localLanguageName?: string }).localLanguageName;

  const effectiveLocalLanguageLabel = effectiveLocalLanguageName
    ? (localLanguageLabel ??
        (club as unknown as { localLanguageLabel?: string }).localLanguageLabel ??
        "In the local language")
    : undefined;

  const status = computeDramaClubStatus(club);
  const statusMeta = DRAMA_CLUB_STATUS_META[status];
  const statusLabelText = DRAMA_CLUB_STATUS_LABEL[status];

  const heroTextureTagline =
    heroTextureTaglineProp ??
    (club as unknown as { heroTextureTagline?: string }).heroTextureTagline ??
    "";

  const youthTotalRaw =
    (club as unknown as { youthArtistsServed?: number }).youthArtistsServed ??
    (club as unknown as { youthReached?: number }).youthReached ??
    (club as unknown as { approxYouthServed?: number }).approxYouthServed ??
    undefined;

  const approxYouth = safeNumber(
    typeof youthTotalRaw === "number" ? youthTotalRaw : undefined
  );

  const youthServedLine = formatYouthServedLine(
    typeof youthTotalRaw === "number" ? youthTotalRaw : undefined
  );

  const showcasesTotalRaw =
    (club as unknown as { communityShowcases?: number }).communityShowcases ??
    (club as unknown as { showcasesCount?: number }).showcasesCount ??
    undefined;

  const showcasesCount = safeNumber(
    typeof showcasesTotalRaw === "number" ? showcasesTotalRaw : undefined
  );

  const approxAudience = safeNumber(
    typeof (club as unknown as { approxCommunityAudience?: number })
      .approxCommunityAudience === "number"
      ? (club as unknown as { approxCommunityAudience?: number })
          .approxCommunityAudience
      : undefined
  );

  const yearsActive = computeYearsActive({
    foundedYear: (club as unknown as { foundedYear?: number }).foundedYear,
    firstYearActive: (club as unknown as { firstYearActive?: number })
      .firstYearActive,
    lastYearActive: (club as unknown as { lastYearActive?: number | "present" })
      .lastYearActive,
  });

  const timelineLabel = (() => {
    const startYear =
      (club as unknown as { firstYearActive?: number }).firstYearActive ??
      (club as unknown as { foundedYear?: number }).foundedYear;

    if (!startYear) return undefined;

    const last = (club as unknown as { lastYearActive?: number | "present" })
      .lastYearActive;

    const endLabel = !last || last === "present" ? "present" : String(last);

    if (yearsActive) {
      return `${startYear}–${endLabel} (${yearsActive} year${
        yearsActive === 1 ? "" : "s"
      })`;
    }
    return `${startYear}–${endLabel}`;
  })();

  const resolvedCauses: ResolvedCause[] = (
    (club as unknown as { causes?: DramaClubCause[] }).causes ?? []
  )
    .map((cause: DramaClubCause): ResolvedCause | null => {
      const subList = CAUSE_SUBCATEGORIES_BY_CATEGORY[cause.category] || [];
      const meta = subList.find((m) => m.id === cause.subcategory);
      if (!meta) return null;

      const label = meta.shortLabel || meta.label;
      const href = `/cause/${meta.id}`;
      return { label, href };
    })
    .filter((c): c is ResolvedCause => c !== null);

  const hasCauses = resolvedCauses.length > 0;
  const primaryCause = hasCauses ? resolvedCauses[0] : undefined;

  const ceLearn = (club as unknown as { culturalExchangeLearn?: string })
    .culturalExchangeLearn;
  const ceShare = (club as unknown as { culturalExchangeShare?: string })
    .culturalExchangeShare;

  const hasExchangeLearn = !!ceLearn;
  const hasExchangeShare = !!ceShare;
  const hasExchangeBlock =
    !!exchangeSnippet || hasExchangeLearn || hasExchangeShare;

  const alumniQuote = (club as unknown as {
    alumniQuote?: { text: string; name?: string; role?: string };
  }).alumniQuote;
  const hasAlumniQuote = !!alumniQuote?.text;

  const hasArtistPathways =
    !!(club as unknown as { artistPathwaysBlurb?: string }).artistPathwaysBlurb ||
    !!(club as unknown as { currentProjects?: string[] }).currentProjects?.length ||
    dramaClubLeadTeam.length > 0;

  // HERO — landscape/texture
  const heroTextureSrc =
    heroImageOverrideSrc ||
    (club as unknown as { heroTextureSrc?: string }).heroTextureSrc ||
    (club as unknown as { heroImage?: string }).heroImage ||
    (club as unknown as { cardImage?: string }).cardImage ||
    (club as unknown as { gallery?: GalleryItem[] }).gallery?.[0]?.src ||
    (club as unknown as { regionTextureSrc?: string }).regionTextureSrc ||
    "/images/drama-clubs/hero-texture-default.jpg";

  const heroTextureAlt =
    heroImageOverrideAlt ||
    `${club.name} drama club hero image (${
      (club as unknown as { city?: string }).city ||
      (club as unknown as { region?: string }).region ||
      club.country ||
      "DAT"
    })`;

  // CARD HERO IMAGE
  const cardHeroSrc =
    (club as unknown as { heroImage?: string }).heroImage ||
    (club as unknown as { cardImage?: string }).cardImage ||
    (club as unknown as { gallery?: GalleryItem[] }).gallery?.[0]?.src ||
    "/images/drama-clubs/club-fallback.jpg";

  const cardHeroAlt =
    (club as unknown as { gallery?: GalleryItem[] }).gallery?.[0]?.alt ||
    heroTextureAlt ||
    `Youth artists at ${club.name} Drama Club`;

  // Lightbox image set
  const lightboxImages = useMemo(() => {
    const gallery = (
      (club as unknown as { gallery?: GalleryItem[] }).gallery ?? []
    ).map((g) => g.src);

    const all = [cardHeroSrc, heroTextureSrc, ...gallery].filter(
      (s): s is string => typeof s === "string" && s.trim().length > 0
    );

    return Array.from(new Set(all));
  }, [club, cardHeroSrc, heroTextureSrc]);

  const openLightboxFor = useCallback(
    (src?: string) => {
      if (!src || lightboxImages.length === 0) return;
      const idx = lightboxImages.indexOf(src);
      setLightboxIndex(idx >= 0 ? idx : 0);
      setLightboxOpen(true);
    },
    [lightboxImages]
  );

  const locationLine = (() => {
    const loc = (club as unknown as { location?: string }).location;
    if (loc) return loc;
    const city = (club as unknown as { city?: string }).city;
    const region = (club as unknown as { region?: string }).region;
    return [city, region, club.country]
      .filter((v): v is string => !!v)
      .join(" • ");
  })();

  const heroRegionLine =
    (club as unknown as { region?: string }).region?.trim() || undefined;

  const heroCityCountryLine = (() => {
    const city = (club as unknown as { city?: string }).city?.trim();
    const country = club.country?.trim();
    const line = [city, country]
      .filter((v): v is string => !!v && v.trim().length > 0)
      .join(", ");
    return line || undefined;
  })();

  const showHeroRegionLine =
    !!heroRegionLine &&
    (!heroTextureTagline ||
      !heroTextureTagline.toLowerCase().includes(heroRegionLine.toLowerCase()));

  const whatHappensParas = toParas(
    whatHappensCopy ??
      (club as unknown as { whatHappens?: string | string[] }).whatHappens ??
      (club as unknown as { description?: string }).description ??
      ""
  );

  const localContextParas = toParas(
    localContext ??
      (club as unknown as { localContext?: string | string[] }).localContext
  );

  const hasWhatHappens = whatHappensParas.length > 0;

  const workingLanguages = (club as unknown as { workingLanguages?: unknown })
    .workingLanguages;
  const legacyLanguage = (club as unknown as { language?: unknown }).language;

  const languageValue = renderLanguageValue(workingLanguages ?? legacyLanguage);

  const roomToneText: string | undefined = (() => {
    const explicit =
      (
        (club as unknown as { roomFeelsLike?: string }).roomFeelsLike || ""
      ).trim() ||
      (
        (club as unknown as { roomFeelsLikeOverride?: string })
          .roomFeelsLikeOverride || ""
      ).trim();

    if (explicit) return explicit;

    if (!whatHappensParas.length) return undefined;
    return clampLine(whatHappensParas[0], 140) || undefined;
  })();


  const communityIdentity = firstString(
    (club as unknown as { communityIdentity?: string }).communityIdentity,
    (club as unknown as { whoWeServe?: string }).whoWeServe,
    (club as unknown as { community?: string }).community,
    (club as unknown as { communityName?: string }).communityName
  );

  const ageMin = (club as unknown as { ageMin?: number }).ageMin;
  const ageMax = (club as unknown as { ageMax?: number }).ageMax;

  const computedAgeRange =
    typeof ageMin === "number" && typeof ageMax === "number"
      ? `${ageMin}–${ageMax}`
      : undefined;

  const rawAgeRange =
    (ageRange && ageRange.trim().length > 0 ? ageRange.trim() : undefined) ||
    computedAgeRange;

  const ageLabel = rawAgeRange
    ? rawAgeRange.replace(/^\s*(ages?|edades)\s*/i, "").trim()
    : undefined;

  const whoDescription =
    (communityIdentity && communityIdentity.trim().length > 0
      ? communityIdentity.trim()
      : locationLine
      ? `Youth artists in ${locationLine}`
      : undefined) || "Youth artists";

  const whoSupportLine =
    (club as unknown as { whoSupportLine?: string }).whoSupportLine ??
    "With support from DAT & friends";

  const hasWhoStrip = !!(whoDescription || ageLabel);

  const anchorPartnerName =
    firstString(
      (club as unknown as { communityAnchor?: string }).communityAnchor,
      (club as unknown as { leadPartner?: string }).leadPartner,
      (club as unknown as { leadInstitution?: string }).leadInstitution,
      (club as unknown as { anchorPartner?: string }).anchorPartner
    ) || undefined;

  const anchorPartnerHref =
    firstString(
      (club as unknown as { communityAnchorHref?: string }).communityAnchorHref,
      (club as unknown as { leadPartnerHref?: string }).leadPartnerHref,
      (club as unknown as { anchorPartnerHref?: string }).anchorPartnerHref
    ) || undefined;

  const rawPartners = (
    communityPartners ??
    (club as unknown as { communityPartners?: unknown }).communityPartners ??
    []
  ) as unknown[];

  const effectivePartners: DramaClubPartner[] = rawPartners.filter(
    (p: unknown): p is DramaClubPartner =>
      !!p &&
      typeof p === "object" &&
      typeof (p as { name?: unknown }).name === "string" &&
      (p as { name: string }).name.trim().length > 0
  );

  const rawNeeds = (
    communityNeeds ??
    (club as unknown as { communityNeeds?: unknown }).communityNeeds ??
    []
  ) as unknown[];

  const needsSafe: string[] = rawNeeds.filter(
    (n: unknown): n is string => typeof n === "string" && n.trim().length > 0
  );

  const rawImpactPartners = (
    (club as unknown as { impactPartners?: unknown }).impactPartners ?? []
  ) as unknown[];

  const impactPartners: DramaClubPartner[] = rawImpactPartners.filter(
    (p: unknown): p is DramaClubPartner =>
      !!p &&
      typeof p === "object" &&
      typeof (p as { name?: unknown }).name === "string" &&
      (p as { name: string }).name.trim().length > 0
  );

  const combinedImpactPartners =
    impactPartners.length > 0 ? impactPartners : effectivePartners;

  const hasCommunityPartners = effectivePartners.length > 0;
  const hasImpactPartners = combinedImpactPartners.length > 0;

  const hasCommunityNeeds = needsSafe.length > 0;
  const hasLocalContext = localContextParas.length > 0;

  // ✅ Impact metrics – capped at FOUR headline stats (youth, audience, showcases, plays)
  const defaultImpactMetrics: DramaClubMetric[] = [];

  // 1) Club artists served (primary stat)
  if (approxYouth) {
    defaultImpactMetrics.push({
      label: "Club artists served",
      value: approxYouth,
      helper: yearsActive
        ? `${yearsActive} year${yearsActive === 1 ? "" : "s"} active`
        : undefined,
    });
  } else if (yearsActive) {
    // Fallback if we *don’t* have a youth count yet
    defaultImpactMetrics.push({
      label: "Years active",
      value: yearsActive,
    });
  }

  // 2) Local audience reached (secondary stat)
  if (approxAudience) {
    defaultImpactMetrics.push({
      label: "Local audience reached",
      value: approxAudience,
    });
  }

  // 3) Community showcases (separate from plays)
  const showcasesForMetric = showcasesCount ?? undefined;
  if (typeof showcasesForMetric === "number" && showcasesForMetric > 0) {
    defaultImpactMetrics.push({
      label: "Community showcases",
      value: showcasesForMetric,
      helper: "Public sharings for the whole community",
    });
  }

  // 4) Original plays staged
  const playsForMetric = (club as unknown as { playsCount?: number }).playsCount;
  if (typeof playsForMetric === "number" && playsForMetric > 0) {
    defaultImpactMetrics.push({
      label: "Original plays",
      value: playsForMetric,
      helper: "Full productions created and performed",
    });
  }

  // ✅ If the DramaClub has currentImpactStats defined, prefer those
  const statsFromClub: DramaClubMetric[] = (() => {
    const raw =
      (club as unknown as {
        currentImpactStats?: {
          value: number | string;
          label: string;
          meta?: string;
        }[];
      }).currentImpactStats ?? [];

    if (!Array.isArray(raw) || raw.length === 0) return [];

    return raw
      .filter(
        (s) =>
          !!s &&
          typeof s.label === "string" &&
          s.label.trim().length > 0 &&
          (typeof s.value === "number" || typeof s.value === "string")
      )
      .map((s) => {
        const valueStr =
          typeof s.value === "number"
            ? s.value.toLocaleString()
            : String(s.value).trim();

        return {
          label: s.label.trim(),
          value: valueStr,
          helper:
            typeof s.meta === "string" && s.meta.trim()
              ? s.meta.trim()
              : undefined,
        } satisfies DramaClubMetric;
      });
  })();

  // If custom metrics are passed, it wins; else club stats; else defaults
  const rawImpactMetrics: DramaClubMetric[] = (
    impactMetrics ?? (statsFromClub.length ? statsFromClub : defaultImpactMetrics)
  ).filter((m) => !!m?.label && !!m?.value);

  const effectiveImpactMetrics = rawImpactMetrics.slice(0, 4);
  const hasImpactMetrics = effectiveImpactMetrics.length > 0;


  // ✅ Impact band cards (3 per row max, 2 rows: "Right now" + "With your sponsorship")
  const impactBandNowCards: ImpactBandMetric[] = useMemo(() => {
    // Prefer per-club currentImpactStats if present
    const rawFromClub =
      (club as unknown as {
        currentImpactStats?: {
          value: number | string;
          label: string;
          meta?: string;
        }[];
      }).currentImpactStats ?? [];

    const fromClub: ImpactBandMetric[] = Array.isArray(rawFromClub)
      ? rawFromClub
          .filter(
            (s) =>
              !!s &&
              typeof s.label === "string" &&
              s.label.trim().length > 0 &&
              (typeof s.value === "number" || typeof s.value === "string")
          )
          .map((s, index) => {
            const valueStr =
              typeof s.value === "number"
                ? s.value.toLocaleString()
                : String(s.value).trim();
            if (!valueStr) return null;

            return {
              id: `now-${index}-${s.label}`,
              value: valueStr,
              label: s.label.trim(),
              helper:
                typeof s.meta === "string" && s.meta.trim()
                  ? s.meta.trim()
                  : undefined,
            } as ImpactBandMetric;
          })
          .filter((c): c is ImpactBandMetric => !!c)
      : [];

    if (fromClub.length > 0) {
      return fromClub.slice(0, 3);
    }

    // Fallback to derived numbers
    const cards: ImpactBandMetric[] = [];

    if (approxYouth) {
      cards.push({
        id: "artists-served",
        value: approxYouth,
        label: "Youth artists",
        helper: "Across workshops and drama club sessions",
      });
    }

    if (approxAudience) {
      cards.push({
        id: "local-audience",
        value: approxAudience,
        label: "Audience reached",
        helper: "School and community performances in the territory",
      });
    }

    if (yearsActive) {
      cards.push({
        id: "years-with-community",
        value: yearsActive.toString(),
        label: "Years running",
        helper: "A partnership that grows deeper each season",
      });
    }

    return cards.slice(0, 3);
  }, [club, approxYouth, approxAudience, yearsActive]);

  const impactBandUnlockCards: ImpactBandMetric[] = useMemo(() => {
    // Prefer per-club sponsorshipUnlockStats if present
    const rawFromClub =
      (club as unknown as {
        sponsorshipUnlockStats?: {
          value: number | string;
          label: string;
          meta?: string;
        }[];
      }).sponsorshipUnlockStats ?? [];

    const fromClub: ImpactBandMetric[] = Array.isArray(rawFromClub)
      ? rawFromClub
          .filter(
            (s) =>
              !!s &&
              typeof s.label === "string" &&
              s.label.trim().length > 0 &&
              (typeof s.value === "number" || typeof s.value === "string")
          )
          .map((s, index) => {
            const valueStr =
              typeof s.value === "number"
                ? s.value.toLocaleString()
                : String(s.value).trim();
            if (!valueStr) return null;

            return {
              id: `unlock-${index}-${s.label}`,
              value: valueStr,
              label: s.label.trim(),
              helper:
                typeof s.meta === "string" && s.meta.trim()
                  ? s.meta.trim()
                  : undefined,
            } as ImpactBandMetric;
          })
          .filter((c): c is ImpactBandMetric => !!c)
      : [];

    if (fromClub.length > 0) {
      return fromClub.slice(0, 3);
    }

    // Fallback to generic target fields
    const c = club as any;

    const weeksRaw =
      typeof c?.targetWeeksPerYear === "number"
        ? (c.targetWeeksPerYear as number)
        : undefined;

    const showcasesRaw =
      typeof c?.targetShowcasesPerYear === "number"
        ? (c.targetShowcasesPerYear as number)
        : undefined;

    const facilitatorsLabelRaw =
      typeof c?.targetFacilitatorsLabel === "string"
        ? ((c.targetFacilitatorsLabel as string) || "").trim()
        : undefined;

    const weeks = weeksRaw ?? 32;
    const showcases = showcasesRaw ?? 4;
    const facilitatorsLabel = facilitatorsLabelRaw || "2–3";

    const cards: ImpactBandMetric[] = [
      {
        id: "weeks-per-year",
        value: weeks.toString(),
        label: "Weeks of Drama Club per year",
        helper: "Consistent sessions where youth can gather, create, and be seen.",
      },
      {
        id: "local-facilitators",
        value: facilitatorsLabel,
        label: "Youth & local facilitators",
        helper: "Paid roles for emerging leaders from this community.",
      },
      {
        id: "community-showcases",
        value: showcases.toString(),
        label: "Community showcases",
        helper: "Moments when the whole community gathers to witness their youth.",
      },
    ];

    return cards.filter((card) => !!card.value).slice(0, 3);
  }, [club]);

  const hasImpactBandNow = impactBandNowCards.length > 0;
  const hasImpactBandUnlock = impactBandUnlockCards.length > 0;

  const gallery: GalleryItem[] = (
    (club as unknown as { gallery?: GalleryItem[] }).gallery ?? []
  ).filter((g): g is GalleryItem => !!g && typeof g.src === "string");

  const hasGallery = gallery.length > 1;

  // ✅ FIX: stable visitingArtists ref for useMemo deps
  const rawVisitingArtists = (club as unknown as { visitingArtists?: unknown })
    .visitingArtists;

  const visitingArtists: VisitingArtist[] = useMemo(() => {
    if (Array.isArray(rawVisitingArtists))
      return rawVisitingArtists as VisitingArtist[];
    return EMPTY_VISITING_ARTISTS;
  }, [rawVisitingArtists]);

  // ✅ club video for "The place where it happens"
  const clubVideo = (club as unknown as { video?: EmbeddableVideo }).video;
  const hasClubVideo = !!clubVideo?.url?.trim();

  const snapshotStamps: SnapshotStamp[] = [];

  if (primaryCause) {
    snapshotStamps.push({
      key: "primary-cause",
      label: "Primary cause",
      value: primaryCause.label,
      span2: true,
    });
  }

  if (heroCityCountryLine) {
    snapshotStamps.push({
      key: "based",
      label: "Based in and around",
      value: heroCityCountryLine,
      span2: true,
    });
  }

  if (timelineLabel) {
    snapshotStamps.push({
      key: "timeline",
      label: "Timeline",
      value: timelineLabel,
      variant: "meta",
    });
  }

  if (youthServedLine) {
    snapshotStamps.push({
      key: "youth-served",
      label: "Club artists served",
      value: youthServedLine,
      variant: "meta",
    });
  }

  if (showcasesCount) {
    snapshotStamps.push({
      key: "performances",
      label: "Community performances",
      value: showcasesCount,
      variant: "meta",
    });
  }

  if (approxAudience) {
    snapshotStamps.push({
      key: "audience",
      label: "Local audience reached",
      value: approxAudience,
      variant: "meta",
    });
  }

  if (languageValue) {
    snapshotStamps.push({
      key: "language",
      label: "Working language(s)",
      value: languageValue,
      span2: true,
    });
  }

  const anchorName =
    anchorPartnerName ||
    (!anchorPartnerName
      ? effectivePartners.find((p) => p?.name?.trim())?.name
      : undefined);

  const anchorHref =
    anchorPartnerHref ||
    (!anchorPartnerHref
      ? effectivePartners.find((p) => p?.href?.trim())?.href
      : undefined);

  if (anchorName) {
    snapshotStamps.push({
      key: "anchor",
      label: "Community anchor / lead partner",
      value: anchorHref ? (
        <a
          href={anchorHref}
          target="_blank"
          rel="noreferrer"
          className="dc-link dc-link--purple font-sans"
        >
          {anchorName}
        </a>
      ) : (
        anchorName
      ),
      span2: true,
    });
  }

  const compactStamps = snapshotStamps.slice(0, 8);

  const storyMapHref =
    firstString(
      (club as unknown as { storyMapHref?: string }).storyMapHref,
      (club as unknown as { storyMapLink?: string }).storyMapLink,
      (club as unknown as { mapHref?: string }).mapHref
    ) || undefined;

  const storyMapLinkHref = storyMapHref || backToIndexHref;

  const effectiveEldersQuote: EldersQuote | undefined =
    eldersQuote ||
    ((club as unknown as { elderQuote?: EldersQuote }).elderQuote?.text
      ? {
          text: (club as unknown as { elderQuote?: EldersQuote }).elderQuote!.text,
          name: (club as unknown as { elderQuote?: EldersQuote }).elderQuote!.name,
          role: (club as unknown as { elderQuote?: EldersQuote }).elderQuote!.role,
          avatarSrc: (club as unknown as { elderQuote?: EldersQuote }).elderQuote!
            .avatarSrc,
        }
      : undefined);

  const hasEldersQuote = !!effectiveEldersQuote?.text;

  // ✅ Voices section should be skipped entirely if there’s nothing to show
  // Only show Voices column if there are actual quotes — sponsor link lives elsewhere on the page
  const hasVoicesSection = hasEldersQuote || hasAlumniQuote;

  // ======================
  // Kraft-paper footer nav
  // ======================

  const currentHref = getDramaClubHref(club);

  const sortedAllClubs = useMemo(() => {
    const list = (allClubs ?? []).filter((c) => !!c?.name);
    if (!list.length) return [];
    return [...list].sort((a, b) => {
      const ak = geoSortKey(a);
      const bk = geoSortKey(b);
      if (ak < bk) return -1;
      if (ak > bk) return 1;
      return 0;
    });
  }, [allClubs]);

  // Three "Other Drama Clubs" cards — different-country, deterministically selected
  const otherClubs = useMemo(() => {
    if (!sortedAllClubs.length) return [];
    const diffCountry = sortedAllClubs.filter(
      (c) => c.country !== club.country && getDramaClubHref(c) !== currentHref
    );
    if (diffCountry.length === 0) return [];
    if (diffCountry.length <= 3) return diffCountry;
    // Evenly-spaced indices for cacheability and predictability
    const n = diffCountry.length;
    return [
      diffCountry[0],
      diffCountry[Math.floor(n / 3)],
      diffCountry[Math.floor((2 * n) / 3)],
    ];
  }, [sortedAllClubs, currentHref, club.country]);

  // ======================
  // Artist lineage marquee data
  // ======================

  const marqueeItems: LineageArtist[] = useMemo(() => {
    // We'll collect meta for sorting, then return plain LineageArtist[]
    const out: Array<{
      item: LineageArtist;
      manual: boolean;
      ts: number;
      i: number;
    }> = [];

    const seen = new Set<string>();

    const normHref = (href?: string) => (href || "").trim().toLowerCase();

    const alumniSlugFromHref = (href?: string) => {
      const h = (href || "").trim();
      if (!h) return undefined;
      const m = h.match(/\/alumni\/([^/?#]+)/i);
      return m?.[1] ? decodeURIComponent(m[1]) : undefined;
    };

    // Build "lead team" exclusion sets (by href + by normalized name)
    const leadHrefSet = new Set(
      (dramaClubLeadTeam ?? [])
        .map((p) => normHref((p as any)?.href))
        .filter(Boolean)
    );

    const leadNameSet = new Set(
      (dramaClubLeadTeam ?? [])
        .map((p) => (p?.name || "").trim())
        .filter(Boolean)
        .map(nameKey)
    );

    const makeKey = (x: { href?: string; slug?: string; name?: string }) => {
      const h = normHref(x.href);
      if (h) return `href:${h}`;
      const s = (x.slug || "").trim().toLowerCase();
      if (s) return `slug:${s}`;
      const n = (x.name || "").trim();
      return `name:${nameKey(n)}`;
    };

    // Date-ish parsing (supports ISO strings, "YYYY", numbers, etc.)
    const toTs = (v: unknown): number => {
      if (typeof v === "number" && Number.isFinite(v)) {
        // If it looks like a year, treat as Jan 1 of that year
        if (v >= 1900 && v <= 2100) return new Date(v, 0, 1).getTime();
        return v;
      }

      if (typeof v === "string") {
        const s = v.trim();
        if (!s) return 0;

        // "2024" style year string
        const asYear = Number.parseInt(s, 10);
        if (
          !Number.isNaN(asYear) &&
          String(asYear) === s &&
          asYear >= 1900 &&
          asYear <= 2100
        ) {
          return new Date(asYear, 0, 1).getTime();
        }

        const parsed = Date.parse(s);
        return Number.isNaN(parsed) ? 0 : parsed;
      }

      return 0;
    };

    const extractRecencyTs = (x: any): number => {
      // prefer endDate-ish fields, then startDate-ish, then year-ish
      return (
        toTs(x?.endDate) ||
        toTs(x?.endedAt) ||
        toTs(x?.lastDate) ||
        toTs(x?.date) ||
        toTs(x?.startDate) ||
        toTs(x?.startedAt) ||
        toTs(x?.year) ||
        toTs(x?.seasonYear) ||
        0
      );
    };

    const push = (x: any, opts: { manual: boolean; orderIndex: number }) => {
      const name = (x?.name || "").trim();
      if (!name) return;

      const href = (x?.href || "").trim() || undefined;

      const slug = (
        String(x?.slug || "").trim() ||
        alumniSlugFromHref(href) ||
        (name ? slugify(name) : "")
      ).trim();
      if (!slug) return;

      const role = (
        String(x?.role || "").trim() ||
        String(x?.subtitle || "").trim() ||
        (Array.isArray(x?.roles) ? x.roles.filter(Boolean).join(", ").trim() : "") ||
        "Visiting artist"
      ).trim() || "Visiting artist";

      const headshotUrl =
        String(x?.headshotUrl || "").trim() ||
        String(x?.avatarSrc || "").trim() ||
        undefined;

      // ✅ Exclude lead team from lineage marquee
      const hKey = normHref(href);
      if (hKey && leadHrefSet.has(hKey)) return;
      if (leadNameSet.has(nameKey(name))) return;

      const key = makeKey({ href, slug, name });
      if (seen.has(key)) return;
      seen.add(key);

      const ts = extractRecencyTs(x);

      out.push({
        item: { name, slug, role, headshotUrl, href },
        manual: opts.manual,
        ts,
        i: opts.orderIndex,
      });
    };

    // 1) ✅ Manual visiting artists FIRST (always included)
    (visitingArtists ?? []).forEach((a: any, idx: number) =>
      push(a, { manual: true, orderIndex: idx })
    );

    // 2) ✅ Program-derived lineage
    (lineageArtists ?? []).forEach((p: any, idx: number) =>
      push(p, { manual: false, orderIndex: idx })
    );

    // Sort:
    // - manual first
    // - then most recent first (ts desc)
    // - then stable original order
    // - then name as final tie-break
    out.sort((A, B) => {
      if (A.manual !== B.manual) return A.manual ? -1 : 1;
      if (B.ts !== A.ts) return B.ts - A.ts;
      if (A.i !== B.i) return A.i - B.i;
      return A.item.name.localeCompare(B.item.name);
    });

    return out.map((x) => x.item);
  }, [lineageArtists, visitingArtists, dramaClubLeadTeam]);

  const visibleLeadTeam = dramaClubLeadTeam.slice(0, 5);
  const hasMoreLeadTeam = dramaClubLeadTeam.length > 5;
  const firstProgram = activePrograms[0] ?? null;
  // Cap marquee at 8 unique artists; fewer than 4 renders as a static row
  const marqueeItemsCapped = marqueeItems.slice(0, 8);

  const layoutClass = ["dc-layout", !hasVoicesSection ? "dc-layout--single" : ""]
    .filter(Boolean)
    .join(" ");

  const voicesFromRaw = heroTextureTagline || getPlaceTaglineFallback(club) || "";
const voicesFrom = getVoicesFromTagline(voicesFromRaw) || "this place";
const voicesHeading = `Voices from ${voicesFrom}`;

  const momentsHeading = getMomentsHeadline(club);


  
  return (
    <div className="dc-page-shell font-sans">
      <main
        className="min-h-screen"
        style={{ paddingBottom: 64 }}
      >
        {/* HERO — landscape / texture */}
        <section className="dc-hero">
          <Image
            src={heroTextureSrc}
            alt={heroTextureAlt}
            fill
            priority
            className="object-cover object-center"
          />

          <div className="dc-hero-overlay" />

          <div className="dc-hero-content">
            <div className="dc-hero-main">
              <div className="dc-hero-left">
                <p className="dc-eyebrow font-sans">DAT DRAMA CLUB</p>

                <h1 className="dc-hero-title font-display">
                  <span>{club.name}</span>
                </h1>

                {effectiveLocalLanguageName && effectiveLocalLanguageLabel && (
                  <p className="dc-local-name font-sans">
                    <span className="dc-local-label">
                      {effectiveLocalLanguageLabel}:
                    </span>{" "}
                    <span className="dc-local-text">
                      {effectiveLocalLanguageName}
                    </span>
                  </p>
                )}

                {heroCityCountryLine && (
                  <p className="dc-hero-location dc-hero-location--city font-sans">
                    {heroCityCountryLine}
                  </p>
                )}

                {showHeroRegionLine && (
                  <p className="dc-hero-location dc-hero-location--region font-sans">
                    {heroRegionLine}
                  </p>
                )}

                {heroTextureTagline && (
                  <div className="dc-hero-status-row">
                    <span className="dc-hero-tagline font-sans">
                      {heroTextureTagline}
                    </span>
                  </div>
                )}
              </div>

              {sponsorLink && (
                <div className="dc-hero-right">
                  <div className="dc-hero-cta-row">
                    <DATButtonLink
                      href={sponsorLink}
                      size="md"
                      className="dc-hero-cta"
                    >
                      Sponsor this Drama Club
                    </DATButtonLink>
                    <div className="dc-hero-cta-buffer" aria-hidden="true" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ABOVE THE CARD (on kraft paper): All Drama Clubs link (no background) */}
        <div className="dc-kraft-topnav">
          <div className="dc-kraft-container">
            <Link href={backToIndexHref} className="dc-kraft-backlink font-sans">
              All Drama Clubs
            </Link>
          </div>
        </div>

        {/* WHITE CARD CONTENT */}
        <section className="dc-card-shell">
          <article className="dc-card">
            {/* SUPER-SIZED MICRO CARD */}
            <div
              className="dc-microcard-shell"
              style={{
                border: `1px solid ${statusMeta.border}`,
              }}
            >
              <div className="dc-microcard-inner">
                {/* LEFT: image */}
                <div className="dc-microcard-media">
                  <div className="dc-microcard-media-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cardHeroSrc}
                      alt={cardHeroAlt}
                      className="dc-microcard-img dc-clickable-img"
                      loading="lazy"
                      decoding="async"
                      onClick={() => openLightboxFor(cardHeroSrc)}
                    />

                    <span
                      className="dc-status-pill dc-status-pill--card font-sans"
                      style={{
                        backgroundColor: statusMeta.bg,
                        color: statusMeta.text,
                        border: `1px solid ${statusMeta.border}`,
                      }}
                    >
                      {statusLabelText}
                    </span>

                    <div className="dc-photo-stamp" aria-hidden="true">
                      <DramaClubBadge name={club.name} size={120} />
                    </div>
                  </div>
                </div>

                {/* RIGHT: COMPACT SNAPSHOT */}
                <aside
                  className={`dc-snapshot-panel dc-snapshot-panel--${status}`}
                >
                  <div
                    className="dc-snapshot-pill"
                    style={{
                      backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.98) 0%, ${statusMeta.bg} 88%)`,
                      borderColor: statusMeta.border,
                    }}
                  >
                    <span className="dc-snapshot-strip-label font-sans">
                      Club snapshot
                    </span>
                    <span
                      className="dc-snapshot-strip-status font-sans"
                      style={{ color: statusMeta.text }}
                    >
                      {statusSummary[status]}
                    </span>
                  </div>

                  {hasWhoStrip && (
                    <div className="dc-snapshot-strip-who">
                      <div className="dc-snapshot-who-text">
                        <p className="dc-snapshot-who-eyebrow font-sans">
                          Built by and for
                        </p>

                        {whoDescription && (
                          <p className="dc-snapshot-who-main font-display">
                            {whoDescription}
                          </p>
                        )}

                        {whoSupportLine && (
                          <p className="dc-snapshot-who-lowbrow font-sans">
                            {whoSupportLine}
                          </p>
                        )}
                      </div>

                      {ageLabel && (
                        <div className="dc-snapshot-who-age-card font-sans">
                          <span className="dc-snapshot-who-age-label">
                            Age range
                          </span>
                          <span className="dc-snapshot-who-age-value">
                            {ageLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {compactStamps.length > 0 && (
                    <dl className="dc-snapshot-stamps">
                      {compactStamps.map((s) => (
                        <div
                          key={s.key}
                          className={[
                            "dc-snapshot-stamp",
                            s.variant === "meta"
                              ? "dc-snapshot-stamp--meta"
                              : "",
                            s.span2 ? "dc-snapshot-stamp--span2" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          <dt className="font-sans">{s.label}</dt>
                          <dd className="font-sans">{s.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </aside>
              </div>
            </div>

            {/* Story map text link beneath the snapshot card */}
            <div className="dc-snapshot-map-row">
              <Link
                href={storyMapLinkHref}
                className="dc-snapshot-map-link dc-link font-sans"
                aria-label={`Explore the Story Map for ${club.name || "this Drama Club"}`}
              >
                Explore the Story Map →
              </Link>
            </div>

            {/* UPCOMING COMMUNITY SHOWCASES — compact inline row */}
            {upcomingShowcases.length > 0 && (
              <div className="dc-upcoming-row">
                {upcomingShowcases.map((ev) => (
                  <div key={ev.id} className="dc-upcoming-row__item">
                    <span className="dc-upcoming-row__date font-sans">
                      {ev.endDate
                        ? `${shortMonth(ev.date)} ${dayOfMonth(ev.date)}–${dayOfMonth(ev.endDate)}, ${eventYear(ev.date)}`
                        : `${shortMonth(ev.date)} ${dayOfMonth(ev.date)}, ${eventYear(ev.date)}`}
                    </span>
                    <span className="dc-upcoming-row__sep" aria-hidden="true">·</span>
                    <span className="dc-upcoming-row__title font-sans">{ev.title}</span>
                    {(ev.venue || ev.city) && (
                      <>
                        <span className="dc-upcoming-row__sep" aria-hidden="true">·</span>
                        <span className="dc-upcoming-row__venue font-sans">
                          {[ev.venue, ev.city].filter(Boolean).join(", ")}
                        </span>
                      </>
                    )}
                    {ev.ticketUrl ? (
                      <a
                        href={ev.ticketUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="dc-upcoming-row__link dc-link font-sans"
                      >
                        {ev.ticketPrice ?? "Tickets →"}
                      </a>
                    ) : ev.contactEmail ? (
                      <a
                        href={`mailto:${ev.contactEmail}?subject=${encodeURIComponent(`Attendance Request: ${ev.title}`)}`}
                        className="dc-upcoming-row__link dc-link font-sans"
                      >
                        Request invite →
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            {/* ── STORY GROUPING ───────────────────────────────── */}
            <div className="dc-group-gap" aria-hidden="true" />

            {/* The place where it happens + Voices */}
            <div className={layoutClass}>
              <section className="dc-section">
                <h2 className="dc-section-head font-sans">
                  The place where it happens
                </h2>

                {hasWhatHappens ? (
                  whatHappensParas.map((p: string, i: number) => (
                    <p key={i} className="dc-body font-sans">
                      {p}
                    </p>
                  ))
                ) : (
                  <p className="dc-body dc-body--placeholder font-sans">
                    This Drama Club is where young artists gather to explore
                    their stories, rehearse new work, and build community
                    together. (Add a custom description when you’re ready.)
                  </p>
                )}

                {hasExchangeBlock && (
                  <div className="dc-exchange-block">
                    <p className="dc-exchange-label font-sans">
                      Cultural exchange
                    </p>

                    {exchangeSnippet ? (
                      <p className="dc-exchange-body font-sans">
                        {exchangeSnippet}
                      </p>
                    ) : (
                      <div className="dc-exchange-columns">
                        {hasExchangeLearn && (
                          <div className="dc-exchange-col">
                            <p className="dc-exchange-subhead font-sans">
                              What we learn
                            </p>
                            <p className="dc-exchange-body font-sans">
                              {ceLearn}
                            </p>
                          </div>
                        )}

                        {hasExchangeShare && (
                          <div className="dc-exchange-col">
                            <p className="dc-exchange-subhead font-sans">
                              What we share
                            </p>
                            <p className="dc-exchange-body font-sans">
                              {ceShare}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ✅ VIDEO: under the Cultural Exchange block (with spacing; no label/caption) */}
                {hasClubVideo && clubVideo && <RoomVideoBlock video={clubVideo} />}
              </section>

              {/* Voices: 4:5 portrait cards — skip column entirely if nothing to show */}
              {hasVoicesSection && (
                <aside className="dc-section dc-section--right">
                  <h2 className="dc-section-head font-sans">
                    {voicesHeading}
                  </h2>

                  <div className="dc-voices-grid">
                    {hasEldersQuote && effectiveEldersQuote && (
                      <VoicePortraitCard
                        imageSrc={effectiveEldersQuote.avatarSrc}
                        imageAlt={effectiveEldersQuote.name || "Community elder"}
                        quote={effectiveEldersQuote.text}
                        attribution={[
                          effectiveEldersQuote.name,
                          effectiveEldersQuote.role,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                        onImageClick={() =>
                          effectiveEldersQuote.avatarSrc &&
                          openLightboxFor(effectiveEldersQuote.avatarSrc)
                        }
                      />
                    )}

                    {hasAlumniQuote && alumniQuote && (
                      <VoicePortraitCard
                        imageSrc={(alumniQuote as any).avatarSrc}
                        imageAlt={alumniQuote.name}
                        quote={alumniQuote.text}
                        attribution={[
                          alumniQuote.name
                            ? `— ${alumniQuote.name}`
                            : undefined,
                          alumniQuote.role,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      />
                    )}
                  </div>
                </aside>
              )}
            </div>

            {/* GALLERY — moments from this drama club */}
            {hasGallery && (
              <DramaClubMomentsGallery
                images={gallery}
                clubName={club.name}
                headline={momentsHeading}
              />
            )}

            {/* COMMUNITY & CONTEXT */}
            {(hasCommunityPartners || hasCommunityNeeds || hasLocalContext || hasCauses) && (
              <section className="dc-community-row">
                <section className="dc-section">
                  <h2 className="dc-section-head font-sans">
                    Community &amp; context
                  </h2>

                  {hasLocalContext &&
                    localContextParas.map((p: string, i: number) => (
                      <p key={i} className="dc-body font-sans">
                        {p}
                      </p>
                    ))}

                  {hasCommunityNeeds && (
                    <div className="dc-needs-block dc-needs-block--community-needs dc-needs-block--community">
                      <p className="dc-mini-label font-sans">
                        Shared community needs
                      </p>
                      <ul className="dc-needs-list font-sans">
                        {needsSafe.map((need: string, i: number) => (
                          <li key={`${need}-${i}`}>{need}</li>
                        ))}
                      </ul>

                      {sponsorLink && (
                        <div className="dc-inline-cta">
                          <a
                            href={sponsorLink}
                            className="dc-link dc-link--yellow-pink font-sans"
                          >
                            See how your support can meet these needs →
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {hasCauses && (
                    <div id="dc-causes" className="dc-cause-block">
                      <p className="dc-mini-label font-sans">
                        Causes we champion
                      </p>
                      <div className="dc-cause-chips">
                        {resolvedCauses.map((cause) => (
                          <Link
                            key={cause.href}
                            href={cause.href}
                            className="dc-cause-chip font-sans"
                          >
                            {cause.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              </section>
            )}

            {/* ── ACTION grouping separator ───────────────────── */}
            <div className="dc-group-gap" />

            {/* ── FOOTPRINT BAND — typographic stats, kraft/dark, full width ── */}
            {hasImpactBandNow && (
              <section className="dc-footprint-band" aria-label="Current footprint">
                <div className="dc-footprint-band__inner">
                  {impactBandNowCards.map((card, i) => (
                    <div key={card.id} className="dc-footprint-band__stat">
                      {i > 0 && <span className="dc-footprint-band__divider" aria-hidden="true" />}
                      <span className="dc-footprint-band__value font-display">{card.value}</span>
                      <span className="dc-footprint-band__label font-sans">{card.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── STAND WITH — two columns: left CTA + unlock list / right impact partners ── */}
            {(hasImpactBandUnlock || hasImpactPartners || sponsorLink) && (
              <section className="dc-stand-with">
                <div className="dc-stand-with__inner">
                  {/* LEFT */}
                  <div className="dc-stand-with__left">
                    <p className="dc-mini-label dc-stand-with__eyebrow font-sans">
                      Support this Drama Club
                    </p>

                    <h2 className="dc-stand-with__title font-display">
                      <span className="dc-stand-with-full">Stand with {club.name || "this Drama Club"}.</span>
                      <span className="dc-stand-with-short">Support.</span>
                    </h2>

                    <p className="dc-stand-with__body font-sans">
                      Your support helps young artists access mentorship, arts
                      education, and a creative home where they can process
                      real-world challenges and imagine new futures rooted in
                      their own culture and community.
                    </p>

                    {sponsorLink && (
                      <div className="dc-stand-with__cta-row">
                        <a href={sponsorLink} className="dc-cta dc-stand-with__cta">
                          Sponsor this Drama Club
                        </a>
                        <p className="dc-stand-with__fineprint font-sans">
                          501(c)(3) · Donations are tax-deductible
                        </p>
                      </div>
                    )}

                    {hasImpactBandUnlock && (
                      <div className="dc-unlock-list">
                        <p className="dc-mini-label dc-unlock-list__label font-sans">
                          What your sponsorship makes possible
                        </p>
                        <ul className="dc-unlock-items font-sans">
                          {impactBandUnlockCards.map((card) => (
                            <li key={card.id} className="dc-unlock-items__item">
                              <span className="dc-unlock-items__value font-display">{card.value}</span>
                              <span className="dc-unlock-items__text">{card.label}{card.helper ? ` — ${card.helper}` : ""}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* RIGHT — impact partners */}
                  {hasImpactPartners && (
                    <aside className="dc-stand-with__partners">
                      <p className="dc-mini-label font-sans">Impact partners</p>
                      <ul className="dc-partners-list font-sans">
                        {combinedImpactPartners.map((p) => (
                          <li key={p.name}>
                            {p.href ? (
                              <a href={p.href} target="_blank" rel="noreferrer" className="dc-link dc-link--purple-pink">
                                {p.name}
                              </a>
                            ) : (
                              <span>{p.name}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href="/partners/propose-project?type=drama-club"
                        className="dc-link dc-link--teal font-sans dc-stand-with__propose"
                      >
                        Propose a partnership →
                      </Link>
                    </aside>
                  )}
                </div>
              </section>
            )}

            {/* SECTION — Artist pathways (full-width) */}
            {hasArtistPathways && (
              <section className="dc-artist-section dc-artist-section--full">
                <div className="dc-artist-full">
                  <h2 className="dc-section-head font-sans">
                    Artist pathways &amp; projects
                  </h2>

                  {(club as unknown as { artistPathwaysBlurb?: string })
                    .artistPathwaysBlurb && (
                    <p className="dc-body font-sans dc-artist-full__intro">
                      {
                        (club as unknown as { artistPathwaysBlurb?: string })
                          .artistPathwaysBlurb
                      }
                    </p>
                  )}

                  <div className="dc-inline-cta dc-inline-cta--artists">
                    <a
                      href="https://www.dramaticadventure.com/get-involved"
                      target="_blank"
                      rel="noreferrer"
                      className="dc-link dc-link--artist font-sans"
                    >
                      Artists — see how you can work with DAT’s Drama Clubs →
                    </a>
                  </div>

                  {/* First active program only */}
                  {firstProgram && (
                    <div className="dc-active-programs">
                      <a
                        href={firstProgram.displayUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`dc-active-program-card${firstProgram.isPast ? " dc-active-program-card--past" : ""}`}
                      >
                        <span className={`dc-active-program-tag${firstProgram.isPast ? " dc-active-program-tag--past" : ""}`}>
                          {firstProgram.isPast ? "Past Program" : "Now Accepting"}
                        </span>
                        <span className="dc-active-program-title font-display">
                          {firstProgram.title}
                        </span>
                        <span className="dc-active-program-meta font-sans">
                          Season {firstProgram.season} &middot; {firstProgram.year}
                        </span>
                        <span className="dc-active-program-cta font-sans">
                          {firstProgram.isPast
                            ? "Find a similar program ↗"
                            : "Learn more & apply ↗"}
                        </span>
                      </a>
                    </div>
                  )}

                  {/* Lead team — capped at 5 */}
                  {visibleLeadTeam.length > 0 && (
                    <div className="dc-needs-block">
                      <p className="dc-mini-label font-sans">Lead team</p>
                      <div className="dc-lead-mini-wrap">
                        {visibleLeadTeam.map((person, idx) => {
                          if (!person?.name) return null;
                          const personHref = (person as any).href as string | undefined;
                          const slugFromHref =
                            typeof personHref === "string" && personHref.includes("/alumni/")
                              ? personHref.split("/alumni/")[1]?.split(/[?#]/)[0]
                              : undefined;
                          const slug = (
                            slugFromHref || slugify(person.name || `artist-${idx}`)
                          ).trim();
                          const roleSafe = (((person as any).subtitle ?? "") as string).trim();
                          return (
                            <div key={`${slug}-${idx}`} className="dc-lead-mini-item">
                              <MiniProfileCard
                                name={person.name}
                                role={roleSafe}
                                slug={slug}
                                headshotUrl={(person as any).avatarSrc}
                                variant="light"
                                nameFontSize={12}
                                roleFontSize={11}
                              />
                            </div>
                          );
                        })}
                      </div>
                      {hasMoreLeadTeam && (
                        <Link
                          href={`/alumni?dramaClub=${encodeURIComponent(club.slug)}`}
                          className="dc-link dc-link--artist font-sans dc-lead-mini-more"
                        >
                          {/* TODO: link will show all alumni when dramaClub filter is supported */}
                          See all team &amp; alumni &#8594;
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Lineage — visiting artists merged; static row for <4, marquee for 4+ */}
                  {marqueeItemsCapped.length > 0 && (
                    <div className="dc-artist-full__marquee">
                      <p className="dc-mini-label font-sans">Artists who&#8217;ve worked here</p>
                      {marqueeItemsCapped.length < 4 ? (
                        <div className="dc-lineage-static-row">
                          {marqueeItemsCapped.map((a, idx) => {
                            const aSlug = (a.slug || "").trim() || `artist-${idx}`;
                            const aRole = (a.role || "").trim();
                            const aHeadshot = (a.headshotUrl || "").trim() || undefined;
                            const aHref = (a.href || "").trim() || undefined;
                            return (
                              <div key={`${aSlug}-${idx}`} className="dc-lineage-static-item">
                                <MiniProfileCard
                                  name={a.name}
                                  role={aRole}
                                  slug={aSlug}
                                  headshotUrl={aHeadshot}
                                  href={aHref}
                                  variant="light"
                                  nameFontSize={12}
                                  roleFontSize={11}
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <ArtistLineageMarquee
                          showHeader={false}
                          artists={marqueeItemsCapped}
                          pinLocalMastersCount={2}
                        />
                      )}
                      <div className="dc-inline-cta dc-inline-cta--alumni">
                        <Link
                          href="/alumni"
                          className="dc-link dc-link--artist font-sans"
                        >
                          Meet the full DAT alumni community &#8594;
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </article>
        </section>

        {/* BELOW THE CARD (on kraft paper): linked events (upcoming showcases excluded — shown near top) */}
        {bandEvents.length > 0 && (
          <section className="dc-events-band" aria-label="Linked events">
            <div className="dc-kraft-container">
              <div className="dc-events-heading-group">
                <p className="dc-events-eyebrow">On Stage</p>
                <h2 className="dc-events-title">Events Featuring This Club</h2>
              </div>
              <div className="dc-events-list">
                {bandEvents.map((ev) => {
                  const meta = categoryMeta[ev.category];
                  const isPast = ev.status !== "upcoming";
                  const img = getEventImage(ev);
                  return (
                    <div key={ev.id} className={`dc-event-row ${isPast ? "dc-event-row--past" : ""}`}>
                      {img && (
                        <div
                          className="dc-event-thumb"
                          style={{ backgroundImage: `url('${img}')` }}
                          aria-hidden="true"
                        />
                      )}
                      <div className="dc-event-body">
                        <div className="dc-event-meta">
                          <span className="dc-event-cat" style={{ color: meta.color }}>{meta.eyebrow}</span>
                          <span className="dc-event-date-str">
                            {ev.endDate
                              ? `${shortMonth(ev.date)} ${dayOfMonth(ev.date)}–${dayOfMonth(ev.endDate)}, ${eventYear(ev.date)}`
                              : `${shortMonth(ev.date)} ${dayOfMonth(ev.date)}, ${eventYear(ev.date)}`}
                          </span>
                          {isPast && <span className="dc-event-past-badge">Past</span>}
                        </div>
                        <h3 className="dc-event-name">{ev.title}</h3>
                        <p className="dc-event-loc">{[ev.venue, ev.city, ev.country].filter(Boolean).join(" · ")}</p>
                        {ev.description && (
                          <p className="dc-event-desc">{ev.description}</p>
                        )}
                        {ev.ticketUrl && !isPast && (
                          <div className="dc-event-actions">
                            <a
                              href={ev.ticketUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="dc-event-ticket-btn"
                              style={{ background: meta.color }}
                            >
                              {ev.ticketPrice ?? "Get Tickets →"}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link href="/events" className="dc-events-all-link">
                All DAT Events →
              </Link>
            </div>
          </section>
        )}

        {/* BELOW THE CARD (on kraft paper): other drama clubs + story map link */}
        {otherClubs.length > 0 && (
          <section className="dc-other-clubs" aria-label="Other Drama Clubs">
            <div className="dc-kraft-container">
              <p className="dc-mini-label dc-other-clubs__eyebrow font-sans">
                More Drama Clubs
              </p>
              <div className="dc-other-clubs__grid">
                {otherClubs.map((c) => {
                  const rawImg = (c as unknown as { cardImage?: string; heroImage?: string }).cardImage
                    || (c as unknown as { heroImage?: string }).heroImage;
                  // Never show the shared fallback image across cards — treat it as no image
                  const CLUB_FALLBACK = "/images/drama-clubs/club-fallback.jpg";
                  const img = rawImg && rawImg !== CLUB_FALLBACK ? rawImg : undefined;
                  const geo = getGeoLine(c);
                  return (
                    <Link
                      key={c.slug}
                      href={getDramaClubHref(c)}
                      className={`dc-other-clubs__card${img ? "" : " dc-other-clubs__card--noimg"}`}
                    >
                      {img ? (
                        <div
                          className="dc-other-clubs__img"
                          style={{ backgroundImage: `url('${img}')` }}
                          aria-hidden="true"
                        />
                      ) : (
                        <div className="dc-other-clubs__img dc-other-clubs__img--kraft" aria-hidden="true" />
                      )}
                      <div className="dc-other-clubs__info">
                        {geo && (
                          <p className="dc-other-clubs__geo font-sans">{geo}</p>
                        )}
                        <p className="dc-other-clubs__name font-display">{c.name}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <Link href="/story-map" className="dc-other-clubs__map-link font-sans">
                Explore all clubs on the Story Map →
              </Link>
            </div>
          </section>
        )}

        {lightboxOpen && lightboxImages.length > 0 && (
          <Lightbox
            images={lightboxImages}
            startIndex={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
          />
        )}

        {/* styles moved to components/drama/dramaClubPage.css */}
        {/* ✅ minimal "notes fixes" shipped here so they work immediately */}
        <style jsx global>{`
          /* Global inline link behavior */
          .dc-link {
            text-decoration: none;
            text-underline-offset: 3px;
            transition: color 180ms ease, letter-spacing 180ms ease,
              opacity 180ms ease, transform 180ms ease;
          }
          .dc-link:hover {
            letter-spacing: 0.02em;
          }

          /* "teal → pink hover" CTAs */
          .dc-link--purple-pink {
            color: #2493a9;
          }
          .dc-link--pink:hover,
          .dc-link--purple-pink:hover {
            color: #f23359;
          }

          /* Explore the Story Map — make the pulse visible (no font/hover changes) */
          .dc-snapshot-footer-link--pulse {
            display: inline-block;
            animation: dcStoryMapPulse 1.15s ease-in-out infinite;
            will-change: transform, opacity;
          }
          @keyframes dcStoryMapPulse {
            0%,
            100% {
              transform: translateY(0);
              opacity: 1;
            }
            50% {
              transform: translateY(-0.1px);
              opacity: 0.72;
            }
          }

          /* Impact email capture — smaller + subtler + button on the right */
          .dc-impact-updates-spacer {
            height: 12px;
          }
          .dc-impact-updates-form--compact .dc-impact-updates-label {
            display: block;
            font-size: 0.78rem;
            opacity: 0.82;
            margin-bottom: 6px;
          }
          .dc-impact-updates-form--compact .dc-impact-updates-fields {
            display: flex;
            gap: 8px;
            align-items: stretch;
          }
          .dc-impact-updates-form--compact .dc-impact-email-input {
            flex: 1;
            padding: 8px 10px;
            font-size: 0.85rem;
            border-radius: 10px;
            opacity: 0.92;
          }
          .dc-impact-updates-form--compact .dc-impact-email-button {
            padding: 8px 10px;
            font-size: 0.82rem;
            border-radius: 10px;
            opacity: 0.9;
            white-space: nowrap;
          }

          /* If voices column is missing, let the left column span cleanly */
          @media (min-width: 900px) {
            .dc-layout--single {
              grid-template-columns: 1fr !important;
            }
          }

          /* Footer nav: keep it centered; left/right aligned with container edges */
          .dc-kraft-footer-inner {
            align-items: center;
          }

          /* Footer nav geo line: opacity goes 0.4 → 0.65 on hover */
          .dc-kraft-nav-geo {
            opacity: 0.4;
            transition: opacity 180ms ease;
          }
          .dc-kraft-nav-item:hover .dc-kraft-nav-geo,
          .dc-kraft-nav-item:focus-visible .dc-kraft-nav-geo {
            opacity: 0.65;
          }

          /* ── Upcoming community showcase callout ──────────────── */
          .dc-upcoming-showcases {
            margin: 2rem 0 2.5rem;
          }
          .dc-showcase-callout {
            position: relative;
            overflow: hidden;
            background: #1a0d1a;
            border-top: 3px solid #2FA873;
            border-bottom: 3px solid #2FA873;
          }
          .dc-showcase-callout__bg {
            position: absolute;
            inset: 0;
            background-image: var(--showcase-bg);
            background-size: cover;
            background-position: center;
            opacity: 0.18;
          }
          .dc-showcase-callout__inner {
            position: relative;
            z-index: 1;
            max-width: 780px;
            margin: 0 auto;
            padding: clamp(1.75rem, 4vw, 3rem) clamp(1.25rem, 5vw, 2.5rem);
          }
          .dc-showcase-callout__label-row {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
            margin-bottom: 0.5rem;
          }
          .dc-showcase-callout__eyebrow {
            font-family: var(--font-dm-sans, 'DM Sans', sans-serif);
            font-size: 0.7rem;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #2FA873;
            background: rgba(47,168,115,0.12);
            border: 1px solid rgba(47,168,115,0.4);
            padding: 0.2em 0.7em;
            border-radius: 999px;
          }
          .dc-showcase-callout__date {
            font-family: var(--font-dm-sans, 'DM Sans', sans-serif);
            font-size: 0.75rem;
            font-weight: 600;
            letter-spacing: 0.04em;
            color: rgba(246,228,193,0.75);
            text-transform: uppercase;
          }
          .dc-showcase-callout__title {
            font-size: clamp(1.4rem, 3.5vw, 2rem);
            font-weight: 900;
            color: #f6e4c1;
            margin: 0 0 0.4rem;
            line-height: 1.1;
          }
          .dc-showcase-callout__venue {
            font-size: 0.85rem;
            color: rgba(246,228,193,0.65);
            margin: 0 0 0.75rem;
          }
          .dc-showcase-callout__desc {
            font-size: 0.9rem;
            color: rgba(246,228,193,0.8);
            margin: 0 0 1rem;
            max-width: 55ch;
            line-height: 1.55;
          }
          .dc-showcase-callout__actions {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
          }

          /* ── Club events band ─────────────────────────────────── */
          .dc-events-band {
            padding: clamp(2.5rem, 5vw, 4rem) 0;
            background: transparent;
          }
          .dc-events-heading-group {
            display: inline-flex;
            flex-direction: column;
            gap: 0.2rem;
            background: rgba(36,17,35,0.28);
            border-left: 4px solid #F23359;
            padding: 0.65rem 1.5rem 0.65rem 0.9rem;
            border-radius: 0 10px 10px 0;
            margin-bottom: 1.75rem;
          }
          .dc-events-eyebrow {
            font-family: "DM Sans", sans-serif;
            font-size: 0.68rem;
            font-weight: 700;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: #F23359;
            margin: 0;
          }
          .dc-events-title {
            font-family: "Anton", sans-serif;
            font-size: clamp(1.6rem, 3vw, 2.4rem);
            color: #241123;
            margin: 0;
            line-height: 1;
          }
          .dc-events-list {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
            border-radius: 0;
            background: transparent;
            border: none;
            overflow: hidden;
            border: 1.5px solid rgba(242,51,89,0.15);
            background: rgba(255,255,255,0.55);
            margin-bottom: 1rem;
          }
          /* ── Event row — poster/card style ───────────────────────── */
          .dc-event-row {
            display: grid;
            grid-template-columns: 220px 1fr;
            border-radius: 14px;
            overflow: hidden;
            background: rgba(255,255,255,0.7);
            border: 1.5px solid rgba(242,51,89,0.15);
            box-shadow: 0 2px 16px rgba(36,17,35,0.07);
            transition: box-shadow 0.18s, transform 0.18s;
            position: relative;
          }
          .dc-event-row:hover { box-shadow: 0 6px 28px rgba(36,17,35,0.14); transform: translateY(-2px); }
          .dc-event-row--past { opacity: 0.6; }
          .dc-event-thumb {
            width: 100%;
            min-height: 200px;
            background-size: cover;
            background-position: center;
            position: relative;
          }
          .dc-event-thumb::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(to right, transparent 60%, rgba(255,255,255,0.15) 100%);
          }
          .dc-event-body {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding: 1.5rem 1.5rem 1.25rem;
            min-width: 0;
          }
          .dc-event-meta {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            flex-wrap: wrap;
          }
          .dc-event-cat {
            font-family: "DM Sans", sans-serif;
            font-size: 0.65rem;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
          }
          .dc-event-date-str {
            font-family: "DM Sans", sans-serif;
            font-size: 0.72rem;
            font-weight: 600;
            color: rgba(36,17,35,0.45);
          }
          .dc-event-name {
            font-family: "Anton", sans-serif;
            font-size: clamp(1.3rem, 2.5vw, 1.8rem);
            font-weight: 400;
            color: #241123;
            margin: 0;
            line-height: 1.05;
          }
          .dc-event-loc {
            font-family: "Space Grotesk", sans-serif;
            font-size: 0.82rem;
            color: rgba(36,17,35,0.5);
            margin: 0;
          }
          .dc-event-desc {
            font-family: "Space Grotesk", sans-serif;
            font-size: 0.88rem;
            color: rgba(36,17,35,0.72);
            margin: 0;
            line-height: 1.6;
          }
          .dc-event-actions {
            margin-top: auto;
            padding-top: 0.75rem;
          }
          .dc-event-ticket-btn {
            font-family: "DM Sans", sans-serif;
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #fff;
            text-decoration: none;
            padding: 0.45rem 0.9rem;
            border-radius: 6px;
            white-space: nowrap;
            transition: opacity 0.15s;
          }
          .dc-event-ticket-btn:hover { opacity: 0.85; }
          .dc-event-past-badge {
            font-family: "DM Sans", sans-serif;
            font-size: 0.65rem;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: rgba(36,17,35,0.35);
            border: 1px solid rgba(36,17,35,0.15);
            padding: 0.25rem 0.6rem;
            border-radius: 4px;
          }
          .dc-events-all-link {
            font-family: "DM Sans", sans-serif;
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: rgba(242,51,89,0.7);
            text-decoration: none;
            transition: color 0.15s;
          }
          .dc-events-all-link:hover { color: #F23359; }
          @media (max-width: 600px) {
            .dc-event-row { grid-template-columns: 1fr; }
            .dc-event-thumb { min-height: 160px; width: 100%; }
          }
        `}</style>
      </main>
    </div>
  );
}
