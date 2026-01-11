// components/drama/DramaClubPageTemplate.tsx
"use client";

import {
  useMemo,
  useState,
  useCallback,
  type ReactNode,
  type CSSProperties,
  type FormEvent,
} from "react";

import Image from "next/image";
import Link from "next/link";

import type { DramaClub } from "@/lib/dramaClubMap";

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
   * Use this for the Artist Lineage marquee so it can be “right artists → right club”.
   */
  lineageArtists?: PersonRef[];
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
  } = props;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // EMAIL UPDATES (right column, below the dark teal card)
  const [updatesEmail, setUpdatesEmail] = useState("");
  const [updatesStatus, setUpdatesStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [updatesMessage, setUpdatesMessage] = useState<string>("");

  const handleUpdatesSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const email = updatesEmail.trim().toLowerCase();
      if (!email || !email.includes("@")) {
        setUpdatesStatus("error");
        setUpdatesMessage("Please enter a valid email.");
        return;
      }

      setUpdatesStatus("loading");
      setUpdatesMessage("");

      try {
        const payload = {
          email,
          clubName: (club?.name ?? "").trim(),
          clubSlug: (club as any)?.slug ? String((club as any).slug).trim() : "",
          pagePath: typeof window !== "undefined" ? window.location.pathname : "",
          source: "drama_club_updates_form",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        };

        const res = await fetch("/api/drama-club-updates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || "Signup failed");
        }

        setUpdatesStatus("success");
        setUpdatesMessage("You’re on the list.");
        setUpdatesEmail("");
      } catch {
        setUpdatesStatus("error");
        setUpdatesMessage("Something went wrong. Please try again.");
      }
    },
    [updatesEmail, club]
  );

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

  const storyMapSummary: string | undefined = (() => {
    const region = (club as unknown as { region?: string }).region;
    const rawLabel = (club as unknown as { youthCountLabel?: string })
      .youthCountLabel;
    const youthLabel = rawLabel?.trim();

    const hasYouth =
      typeof youthTotalRaw === "number" &&
      Number.isFinite(youthTotalRaw) &&
      youthTotalRaw > 0;

    const hasYouthLabel = !!youthLabel;

    if (
      !hasYouth &&
      !hasYouthLabel &&
      !locationLine &&
      !region &&
      !club.country &&
      !roomToneText
    ) {
      return undefined;
    }

    const place =
      region && club.country
        ? `${region}, ${club.country}`
        : locationLine || club.country || "this community";

    if (hasYouth || hasYouthLabel) {
      const youthText = hasYouth ? `~${youthTotalRaw}` : youthLabel || "local";
      return `Keeps ${youthText} youth artists gathering regularly in ${place}.`;
    }

    return roomToneText || undefined;
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

  // ✅ Impact metrics – intentionally capped at TWO headline stats
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

  const effectiveImpactMetrics = rawImpactMetrics.slice(0, 2);
  const hasImpactMetrics = effectiveImpactMetrics.length > 0;

  // ✅ hero metrics (subset of impact metrics, for the hero band)
  const heroMetrics = effectiveImpactMetrics
    .filter((m) => !!m.label && !!m.value)
    .slice(0, 3);
  const hasHeroMetrics = heroMetrics.length > 0;

  const safeImpactResources: DramaClubResource[] = (impactResources ?? []).filter(
    (r): r is DramaClubResource =>
      !!r && typeof r.href === "string" && typeof r.label === "string"
  );

  const hasImpactResources = safeImpactResources.length > 0;

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
        label: "Club artists served",
        helper: "Across workshops and drama club sessions",
      });
    }

    if (approxAudience) {
      cards.push({
        id: "local-audience",
        value: approxAudience,
        label: "Local audience reached",
        helper: "School and community performances in the territory",
      });
    }

    if (yearsActive) {
      cards.push({
        id: "years-with-community",
        value: yearsActive.toString(),
        label: "Years with this community",
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
  const hasVoicesSection = hasEldersQuote || hasAlumniQuote || !!sponsorLink;

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

  const navTriplet = useMemo(() => {
    if (!sortedAllClubs.length) return null;

    const index = sortedAllClubs.findIndex(
      (c) => getDramaClubHref(c) === currentHref
    );
    if (index < 0) return null;

    const prev =
      sortedAllClubs[
        (index - 1 + sortedAllClubs.length) % sortedAllClubs.length
      ];
    const next = sortedAllClubs[(index + 1) % sortedAllClubs.length];

    return { prev, current: sortedAllClubs[index], next };
  }, [sortedAllClubs, currentHref]);

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

    // Build “lead team” exclusion sets (by href + by normalized name)
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
        style={{
          // ✅ extra room so the kraft footer nav cannot get clipped on shorter viewports
          paddingBottom: navTriplet ? 96 : 40,
        }}
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

              <div className="dc-hero-right">
                {/* ✅ HERO METRICS — above the CTA (no helper/meta line) */}
                {hasHeroMetrics && (
                  <div
                    className="dc-hero-metrics"
                    aria-label="Drama Club impact highlights"
                  >
                    {heroMetrics.map((m) => (
                      <div key={m.label} className="dc-hero-metric">
                        <span className="dc-hero-metric-value font-display">
                          {m.value}
                        </span>
                        <span className="dc-hero-metric-label font-sans">
                          {m.label}
                        </span>
                        {/* ✅ intentionally NO helper line in hero */}
                      </div>
                    ))}
                  </div>
                )}

                {sponsorLink && (
                  <div className="dc-hero-cta-row">
                    <DATButtonLink
                      href={sponsorLink}
                      size="md"
                      className="dc-hero-cta"
                    >
                      Sponsor this Drama Club
                    </DATButtonLink>

                    {/* buffer under CTA */}
                    <div className="dc-hero-cta-buffer" aria-hidden="true" />
                  </div>
                )}
              </div>
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
                border: `0.25px solid ${statusMeta.border}`,
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

                  <footer className="dc-snapshot-footer">
                    <Link
                      href={storyMapLinkHref}
                      className="dc-snapshot-footer-link dc-snapshot-footer-link--pulse"
                      aria-label={
                        storyMapSummary ??
                        `Open the Story Map for ${
                          club.name || "this Drama Club"
                        }`
                      }
                    >
                      Explore the Story Map →
                    </Link>
                  </footer>
                </aside>
              </div>
            </div>

            {/* SECTION A + B */}
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

              {/* ✅ Voices section: skip the ENTIRE column + header if there’s nothing inside */}
              {hasVoicesSection && (
                <aside className="dc-section dc-section--right">
                  <h2 className="dc-section-head font-sans">
                    {voicesHeading}
                  </h2>

                  {hasEldersQuote && effectiveEldersQuote && (
                    <section className="elder-quote-block">
                      <div
                        className={`elder-quote-shell ${
                          effectiveEldersQuote.avatarSrc
                            ? "elder-quote-shell--has-image"
                            : "elder-quote-shell--no-image"
                        }`}
                        onClick={() =>
                          effectiveEldersQuote.avatarSrc &&
                          openLightboxFor(effectiveEldersQuote.avatarSrc)
                        }
                        role={effectiveEldersQuote.avatarSrc ? "button" : undefined}
                        tabIndex={effectiveEldersQuote.avatarSrc ? 0 : -1}
                        onKeyDown={(e) => {
                          if (!effectiveEldersQuote.avatarSrc || e.key !== "Enter")
                            return;
                          openLightboxFor(effectiveEldersQuote.avatarSrc);
                        }}
                      >
                        {effectiveEldersQuote.avatarSrc && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={effectiveEldersQuote.avatarSrc}
                            alt={effectiveEldersQuote.name || "Community elder"}
                            className="elder-quote-bg"
                            loading="lazy"
                            decoding="async"
                          />
                        )}

                        <div className="elder-quote-overlay" />

                        <div className="elder-quote-content">
                          <p className="elder-quote-label font-sans">
                            From a community elder
                          </p>
                          <p className="elder-quote-text font-display">
                            “{effectiveEldersQuote.text}”
                          </p>

                          {(effectiveEldersQuote.name ||
                            effectiveEldersQuote.role) && (
                            <p className="elder-quote-meta">
                              {effectiveEldersQuote.name && (
                                <span className="elder-name">
                                  {effectiveEldersQuote.name}
                                </span>
                              )}
                              {effectiveEldersQuote.role && (
                                <span className="elder-role">
                                  , {effectiveEldersQuote.role}
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  {hasAlumniQuote && alumniQuote && (
                    <figure className="dc-quote-block dc-quote-block--alumni">
                      <blockquote className="font-display">
                        “{alumniQuote.text}”
                      </blockquote>
                      <figcaption className="font-sans">
                        {alumniQuote.name && <>— {alumniQuote.name}</>}
                        {alumniQuote.role && (
                          <span className="dc-alumni-quote-role">
                            {" "}
                            · {alumniQuote.role}
                          </span>
                        )}
                      </figcaption>
                    </figure>
                  )}

                  {/* ✅ subtle sponsor CTA under quotes */}
                  {sponsorLink && (
                    <div className="dc-inline-cta dc-inline-cta--voices">
                      <a
                        href={sponsorLink}
                        className="dc-link dc-link--artist font-sans"
                      >
                        Help this community keep telling their stories → Sponsor
                        this drama club
                      </a>
                    </div>
                  )}
                </aside>
              )}
            </div>

            {/* GALLERY */}
            {hasGallery && (
  <DramaClubMomentsGallery
    images={gallery}
    clubName={club.name}
    headline={momentsHeading}
  />
)}


            {/* COMMUNITY & CONTEXT + IMPACT PARTNERS */}
            {(hasCommunityPartners ||
              hasCommunityNeeds ||
              hasLocalContext ||
              hasCauses ||
              hasImpactPartners) && (
              <section className="dc-community-row">
                {(hasCommunityPartners ||
                  hasCommunityNeeds ||
                  hasLocalContext ||
                  hasCauses) && (
                  <div className="dc-community-main">
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

                          {/* ✅ CTA under needs (yellow → purple hover) */}
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
                  </div>
                )}

                {hasImpactPartners && (
                  <aside className="dc-impact-col">
                    <div className="impact-partners-block">
                      <p className="support-eyebrow-tight">IMPACT PARTNERS</p>

                      <div className="partner-list">
                        {combinedImpactPartners.map((p: DramaClubPartner) => {
                          if (!p?.name) return null;

                          const hasLogo =
                            typeof p.logoSrc === "string" &&
                            p.logoSrc.trim().length > 0;

                          const content = (
                            <>
                              {hasLogo && (
                                <div className="partner-logo-shell">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={p.logoSrc!}
                                    alt={p.logoAlt || p.name}
                                    className="partner-logo"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                </div>
                              )}

                              <div className="partner-text">
                                <span className="partner-name">{p.name}</span>
                                {p.kind && (
                                  <span className="partner-kind">{p.kind}</span>
                                )}
                              </div>
                            </>
                          );

                          return p.href ? (
                            <a
                              key={p.name}
                              href={p.href}
                              className={`partner-bar ${hasLogo ? "" : "partner-no-logo"}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {content}
                            </a>
                          ) : (
                            <div
                              key={p.name}
                              className={`partner-bar ${hasLogo ? "" : "partner-no-logo"}`}
                            >
                              {content}
                            </div>
                          );
                        })}
                      </div>

                      {/* ✅ partnership CTA (purple → pink hover) */}
                      <div className="dc-inline-cta dc-inline-cta--partners">
                        <Link
                          href="/contact"
                          className="dc-link dc-link--artist font-sans"
                        >
                          Institution, foundation, or community leader? Start a
                          conversation about partnering with DAT →
                        </Link>
                      </div>
                    </div>
                  </aside>
                )}
              </section>
            )}

            {/* SECTION D — Impact */}
            {(hasImpactBandNow ||
              hasImpactBandUnlock ||
              hasImpactResources ||
              sponsorLink) && (
              <section className="dc-impact-section">
                <div className="dc-impact-inner">
                  {/* LEFT COLUMN */}
                  <div className="dc-impact-left">
                    <p className="dc-mini-label dc-impact-eyebrow font-sans">
                      Support this Drama Club
                    </p>

                    <h2 className="dc-impact-title font-display">
                      Stand with {club.name || "this Drama Club"}.
                    </h2>

                    <p className="dc-impact-body font-sans">
                      Your support helps young artists access mentorship, arts
                      education, and a creative home where they can process
                      real-world challenges and imagine new futures rooted in
                      their own culture and community.
                    </p>

                    {sponsorLink && (
                      <div className="dc-impact-cta-stack">
                        <a href={sponsorLink} className="dc-cta dc-impact-cta">
                          Sponsor this Drama Club
                        </a>

                        <p className="dc-impact-fineprint font-sans">
                          501(c)(3) • Donations are tax-deductible
                        </p>
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN (dark teal card) + (moved) email below on light teal */}
                  {(hasImpactBandNow ||
                    hasImpactBandUnlock ||
                    hasImpactResources ||
                    sponsorLink) && (
                    <div className="dc-impact-right">
                      <aside className="dc-impact-card">
                        {hasImpactBandNow && (
                          <div className="dc-impact-band-block dc-impact-band-block--muted">
                            <p className="dc-impact-band-eyebrow font-sans">
                              Current footprint
                            </p>

                            <div className="dc-impact-band-grid">
                              {impactBandNowCards.map((card) => (
                                <article
                                  key={card.id}
                                  className="dc-impact-band-card"
                                >
                                  <p className="dc-impact-band-value font-display">
                                    {card.value}
                                  </p>
                                  <p className="dc-impact-band-label font-sans">
                                    {card.label}
                                  </p>
                                </article>
                              ))}
                            </div>
                          </div>
                        )}

                        {hasImpactBandUnlock && (
                          <div className="dc-impact-band-block dc-impact-band-block--bottom">
                            <p className="dc-impact-band-eyebrow font-sans">
                              What your sponsorship makes possible
                            </p>

                            <div className="dc-impact-band-grid">
                              {impactBandUnlockCards.map((card) => (
                                <article
                                  key={card.id}
                                  className="dc-impact-band-card"
                                >
                                  <p className="dc-impact-band-value font-display">
                                    {card.value}
                                  </p>
                                  <p className="dc-impact-band-label font-sans">
                                    {card.label}
                                  </p>
                                  {card.helper && (
                                    <p className="dc-impact-band-helper font-sans">
                                      {card.helper}
                                    </p>
                                  )}
                                </article>
                              ))}
                            </div>
                          </div>
                        )}

                        {hasImpactResources && (
                          <div className="dc-impact-resources">
                            <p className="dc-mini-label font-sans">
                              Learn more about this work
                            </p>
                            <ul>
                              {safeImpactResources.map((r: DramaClubResource) => (
                                <li key={r.href}>
                                  <a
                                    href={r.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="dc-resource-link font-sans"
                                  >
                                    {r.label}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* keep in the dark teal card; just normalize size via CSS below */}
                        <Link
                          href="/contact"
                          className="dc-link dc-link--teal font-sans"
                        >
                          Start a conversation about Drama Club sponsorship →
                        </Link>
                      </aside>

                      {/* EMAIL SIGNUP — now below the dark teal card, sitting in the light teal */}
                      {sponsorLink && (
                        <form
                          className="dc-impact-updates-form dc-impact-updates-form--below-card dc-impact-updates-form--compact"
                          onSubmit={handleUpdatesSubmit}
                        >
                          <label className="dc-impact-updates-label dc-impact-updates-label--grotesk">
                            Get updates on {club?.name || "this Drama Club"}
                          </label>

                          <div className="dc-impact-updates-fields">
                            <input
                              type="email"
                              name="email"
                              className="dc-input dc-impact-email-input font-sans"
                              placeholder="Your email"
                              aria-label="Email address"
                              autoComplete="email"
                              inputMode="email"
                              value={updatesEmail}
                              onChange={(e) => {
                                setUpdatesEmail(e.target.value);
                                if (updatesStatus !== "idle") {
                                  setUpdatesStatus("idle");
                                  setUpdatesMessage("");
                                }
                              }}
                            />

                            <button
                              type="submit"
                              className="dc-impact-email-button dc-impact-email-button--grotesk"
                              disabled={updatesStatus === "loading"}
                              aria-disabled={updatesStatus === "loading"}
                            >
                              SIGN UP
                            </button>
                          </div>

                          {/* Subtle status line (renders only when needed) */}
                          {updatesMessage ? (
                            <p
                              className="dc-impact-updates-status font-sans"
                              role="status"
                              aria-live="polite"
                            >
                              {updatesMessage}
                            </p>
                          ) : null}
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* SECTION — Artist pathways */}
            {hasArtistPathways && (
              <section className="dc-artist-section">
                <div className="dc-artist-inner">
                  <div className="dc-artist-left">
                    <h2 className="dc-section-head font-sans">
                      Artist pathways &amp; projects
                    </h2>

                    {(club as unknown as { artistPathwaysBlurb?: string })
                      .artistPathwaysBlurb && (
                      <p className="dc-body font-sans">
                        {
                          (club as unknown as { artistPathwaysBlurb?: string })
                            .artistPathwaysBlurb
                        }
                      </p>
                    )}

                    {/* ✅ MOVED + UPDATED: artist CTA under intro paragraph and ABOVE Lead Team */}
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

                    {/* Lead team */}
                    {dramaClubLeadTeam.length > 0 && (
                      <div className="dc-needs-block">
                        <p className="dc-mini-label font-sans">Lead team</p>

                        <div className="dc-lead-mini-wrap">
                          {dramaClubLeadTeam.map((person, idx) => {
                            if (!person?.name) return null;

                            const href = (person as any).href as
                              | string
                              | undefined;

                            const slugFromHref =
                              typeof href === "string" &&
                              href.includes("/alumni/")
                                ? href
                                    .split("/alumni/")[1]
                                    ?.split(/[?#]/)[0]
                                : undefined;

                            const slug = (
                              slugFromHref ||
                              slugify(person.name || `artist-${idx}`)
                            ).trim();

                            const roleSafe = (
                              ((person as any).subtitle ?? "") as string
                            ).trim();

                            return (
                              <div
                                key={`${slug}-${idx}`}
                                className="dc-lead-mini-item"
                              >
                                <MiniProfileCard
                                  name={person.name}
                                  role={roleSafe}
                                  slug={slug}
                                  headshotUrl={(person as any).avatarSrc}
                                  variant="light"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ✅ Current projects block + sponsor CTA (purple → pink hover) */}
                    {!!(club as unknown as { currentProjects?: string[] })
                      .currentProjects?.length && (
                      <div className="dc-needs-block dc-needs-block--current-projects dc-needs-block--projects">
                        <p className="dc-mini-label font-sans">
                          Current projects
                        </p>
                        <ul className="dc-needs-list font-sans">
                          {(
                            club as unknown as { currentProjects?: string[] }
                          ).currentProjects!.map((proj: string) => (
                            <li key={proj}>{proj}</li>
                          ))}
                        </ul>

                        {sponsorLink && (
                          <div className="dc-inline-cta">
                            <a
                              href={sponsorLink}
                              className="dc-link dc-link--yellow-pink font-sans"
                            >
                              See how your support can move these projects
                              forward →
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <aside className="dc-artist-right">
                    {(() => {
                      // Local stewardship + “How it works” data
                      const stewardshipBlurb =
                        (
                          (club as any).localStewardshipBlurb ||
                          (club as any).stewardshipBlurb ||
                          (club as any).localStewardshipCopy ||
                          ""
                        )
                          .toString()
                          .trim() ||
                        `This Drama Club is stewarded locally by youth leaders and community partners${
                          anchorName ? ` in collaboration with ${anchorName}` : ""
                        }. DAT supports with training, playmaking toolkits, and periodic visiting artists — but the heartbeat of the club lives here.`;

                      const rawRoles = (
                        (club as any).localStewardshipRoles ||
                        (club as any).stewardshipRoles ||
                        (club as any).howItWorksRoles ||
                        []
                      ) as unknown[];

                      const rawProtocols = (
                        (club as any).localStewardshipProtocols ||
                        (club as any).stewardshipProtocols ||
                        (club as any).howItWorksProtocols ||
                        []
                      ) as unknown[];

                      const safeRoles = rawRoles
                        .filter(
                          (x): x is string =>
                            typeof x === "string" && x.trim().length > 0
                        )
                        .map((s) => s.trim());

                      const safeProtocols = rawProtocols
                        .filter(
                          (x): x is string =>
                            typeof x === "string" && x.trim().length > 0
                        )
                        .map((s) => s.trim());

                      const roles =
                        safeRoles.length > 0
                          ? safeRoles
                          : [
                              "Youth leaders host sessions and guide rehearsal culture",
                              "A local steward coordinates space, schedules, and community communication",
                              "DAT provides mentorship, tools, and periodic artist visits",
                            ];

                      const protocols =
                        safeProtocols.length > 0
                          ? safeProtocols
                          : [
                              "Consent-first storytelling and documentation",
                              "Respect for local elders, customs, and community protocols",
                              "Care-first rehearsal norms (safety, inclusion, accountability)",
                            ];

                      return (
                        <>
                          {/* Local stewardship (no shaded panel) */}
                          <section className="dc-stewardship-block">
                            <p className="dc-mini-label font-sans">
                              Local stewardship
                            </p>
                            <p className="dc-body font-sans dc-stewardship-body">
                              {stewardshipBlurb}
                            </p>
                          </section>

                          {/* How it works here */}
                          <div className="dc-needs-block">
                            <p className="dc-mini-label font-sans">
                              How it works here
                            </p>

                            <div className="dc-how-grid">
                              <div className="dc-how-col">
                                <p className="dc-how-subhead font-sans">
                                  Roles
                                </p>
                                <ul className="dc-needs-list font-sans">
                                  {roles.map((r) => (
                                    <li key={r}>{r}</li>
                                  ))}
                                </ul>
                              </div>

                              <div className="dc-how-col">
                                <p className="dc-how-subhead font-sans">
                                  Protocols
                                </p>
                                <ul className="dc-needs-list font-sans">
                                  {protocols.map((p) => (
                                    <li key={p}>{p}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </aside>
                </div>
              </section>
            )}

            {/* SECTION — Visiting artists (header + paragraph + “meet all alumni” + marquee) */}
            {marqueeItems.length > 0 && (
              <section className="dc-artist-section dc-artist-section--visiting">
                <div className="dc-artist-inner">
                  <div className="dc-artist-left">
                    <h2 className="dc-section-head font-sans">Visiting artists</h2>
                    <p className="dc-body font-sans">
                      A living lineage of artists who’ve made work with this club.
                    </p>

                    <div className="dc-inline-cta dc-inline-cta--alumni">
                      <Link
                        href="/alumni"
                        className="dc-link dc-link--artist font-sans"
                      >
                        Meet the full DAT alumni community →
                      </Link>
                    </div>
                  </div>
                </div>

                <ArtistLineageMarquee
                  showHeader={false}
                  artists={marqueeItems}
                  pinLocalMastersCount={2}
                />
              </section>
            )}
          </article>
        </section>

        {/* BELOW THE CARD (on kraft paper): footer nav */}
        {navTriplet && (
          <section
            className="dc-kraft-footer-nav"
            aria-label="Drama Club navigation"
          >
            {/* ✅ centered + aligned to card width via container class */}
            <div className="dc-kraft-container dc-kraft-footer-inner">
              {/* LEFT: Prev */}
              <Link
                href={getDramaClubHref(navTriplet.prev)}
                className="dc-kraft-nav-item dc-kraft-nav-item--prev"
              >
                <span className="dc-kraft-nav-pill">
                  ← {navTriplet.prev.name}
                </span>
                {getGeoLine(navTriplet.prev) && (
                  <span className="dc-kraft-nav-geo font-sans">
                    {getGeoLine(navTriplet.prev)}
                  </span>
                )}
              </Link>

              {/* CENTER: Index */}
              <Link href={backToIndexHref} className="dc-kraft-nav-index">
                All Drama Clubs
              </Link>

              {/* RIGHT: Next */}
              <Link
                href={getDramaClubHref(navTriplet.next)}
                className="dc-kraft-nav-item dc-kraft-nav-item--next"
              >
                <span className="dc-kraft-nav-pill">
                  {navTriplet.next.name} →
                </span>
                {getGeoLine(navTriplet.next) && (
                  <span className="dc-kraft-nav-geo font-sans">
                    {getGeoLine(navTriplet.next)}
                  </span>
                )}
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
        {/* ✅ minimal “notes fixes” shipped here so they work immediately */}
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

          /* “DAT purple → pink hover” CTAs */
          .dc-link--purple-pink {
            color: #6c00af;
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
        `}</style>
      </main>
    </div>
  );
}
