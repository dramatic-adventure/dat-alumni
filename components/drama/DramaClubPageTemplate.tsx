// components/drama/DramaClubPageTemplate.tsx
"use client";

import { useMemo, useState, useCallback, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import type { DramaClub, DramaClubWorkingLanguages } from "@/lib/dramaClubMap";
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

/* ---------- Types for v2+ content ---------- */

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

type ResolvedCause = { label: string; href: string };

type GalleryItem = { src: string; alt?: string };

type VisitingArtist = { name: string; href?: string; avatarSrc?: string };
type AlumniPathway = { slug: string; name: string; role?: string };

type SnapshotStamp = {
  key: string;
  label: string;
  value: ReactNode;
  variant?: "meta";
  span2?: boolean;
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
}

/* ---------- Helpers ---------- */

const statusSummary: Record<DramaClubStatus, string> = {
  new: "Just launched",
  ongoing: "Rooted and growing",
  legacy: "Seeds planted here continue elsewhere",
};

function toParas(input?: string | string[]): string[] {
  if (!input) return [];
  if (Array.isArray(input))
    return input.map(String).map((s) => s.trim()).filter(Boolean);
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

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function AlumniName({
  name,
  href,
  base = "/alumni",
}: {
  name: string;
  href?: string;
  base?: string;
}) {
  const finalHref = href ?? `${base}/${slugify(name)}`;
  return (
    <Link
      href={finalHref}
      className="namecell no-underline"
      style={{ textDecoration: "none" }}
    >
      {name}
    </Link>
  );
}

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

/* ===================== TEMPLATE ===================== */

export default function DramaClubPageTemplate(
  props: DramaClubPageTemplateProps
) {
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

    // ✅ NEW
    dramaClubLeadTeam = [],
  } = props;

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

  // ✅ UPDATED: section should exist if the lead team exists
  const hasArtistPathways =
    !!(club as unknown as { artistPathwaysBlurb?: string })
      .artistPathwaysBlurb ||
    !!(club as unknown as { currentProjects?: string[] }).currentProjects
      ?.length ||
    !!(club as unknown as { visitingArtists?: VisitingArtist[] })
      .visitingArtists?.length ||
    !!(club as unknown as { alumniPathways?: AlumniPathway[] })
      .alumniPathways?.length ||
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

  // ---- Language rendering (supports legacy + structured object) ----

  type StructuredLanguage = Partial<DramaClubWorkingLanguages> & {
    interpretationLabel?: string;
    note?: string;
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

    if (isStructuredLanguage(lang)) {
      const direct = (lang.direct ?? []).map((t) => t.trim()).filter(Boolean);
      const interp = (lang.interpretation ?? [])
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

  const workingLanguages = (club as unknown as { workingLanguages?: unknown })
    .workingLanguages;
  const legacyLanguage = (club as unknown as { language?: unknown }).language;
  const languageValue = renderLanguageValue(workingLanguages ?? legacyLanguage);

  const roomToneText: string | undefined = (() => {
    const explicit =
      ((club as unknown as { roomFeelsLike?: string }).roomFeelsLike || "")
        .trim() ||
      ((club as unknown as { roomFeelsLikeOverride?: string })
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

  const hasCommunityPartners = effectivePartners.length > 0;

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

  const hasImpactPartners = combinedImpactPartners.length > 0;

  const hasCommunityNeeds = needsSafe.length > 0;
  const hasLocalContext = localContextParas.length > 0;

  const defaultImpactMetrics: DramaClubMetric[] = [];
  if (approxYouth) {
    defaultImpactMetrics.push({
      label: "Youth artists reached",
      value: approxYouth,
      helper: yearsActive
        ? `${yearsActive} year${yearsActive === 1 ? "" : "s"} active`
        : undefined,
    });
  } else if (yearsActive) {
    defaultImpactMetrics.push({ label: "Years active", value: yearsActive });
  }
  if (showcasesCount)
    defaultImpactMetrics.push({
      label: "Community performances",
      value: showcasesCount,
    });
  if (approxAudience)
    defaultImpactMetrics.push({
      label: "Community audience members",
      value: approxAudience,
    });

  const effectiveImpactMetrics = impactMetrics ?? defaultImpactMetrics;
  const hasImpactMetrics = effectiveImpactMetrics.some(
    (m) => !!m.label && !!m.value
  );

  const safeImpactResources: DramaClubResource[] = (impactResources ?? []).filter(
    (r): r is DramaClubResource =>
      !!r && typeof r.href === "string" && typeof r.label === "string"
  );

  const hasImpactResources = safeImpactResources.length > 0;

  const gallery: GalleryItem[] = (
    (club as unknown as { gallery?: GalleryItem[] }).gallery ?? []
  ).filter((g): g is GalleryItem => !!g && typeof g.src === "string");

  const hasGallery = gallery.length > 1;

  const visitingArtists: VisitingArtist[] = ((
    (club as unknown as { visitingArtists?: unknown }).visitingArtists as unknown
  ) ?? []) as VisitingArtist[];

  const alumniPathways: AlumniPathway[] = ((
    (club as unknown as { alumniPathways?: unknown }).alumniPathways as unknown
  ) ?? []) as AlumniPathway[];

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
      label: "Local artists served",
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
      label: "Audience reached",
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
    (((club as unknown as { elderQuote?: EldersQuote }).elderQuote?.text)
      ? {
          text: (club as unknown as { elderQuote?: EldersQuote }).elderQuote!
            .text,
          name: (club as unknown as { elderQuote?: EldersQuote }).elderQuote!
            .name,
          role: (club as unknown as { elderQuote?: EldersQuote }).elderQuote!
            .role,
          avatarSrc: (club as unknown as { elderQuote?: EldersQuote })
            .elderQuote!.avatarSrc,
        }
      : undefined);

  const hasEldersQuote = !!effectiveEldersQuote?.text;

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

  return (
    <div
      className="dc-page-shell font-sans"
      style={{
        minHeight: "100vh",
        backgroundImage: 'url("/texture/kraft-paper.png")',
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundRepeat: "repeat",
      }}
    >
      <main
        className="min-h-screen"
        style={{
          paddingBottom: navTriplet ? 56 : 32, // ✅ ensures footer nav can’t get clipped
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
                <div className="dc-badge-shell">
                  <DramaClubBadge name={club.name} size={150} />
                </div>

                {(approxYouth || showcasesCount) && (
                  <div className="dc-hero-metrics">
                    {approxYouth && (
                      <div className="dc-hero-metric">
                        <span className="dc-hero-metric-label font-sans">
                          Youth artists reached
                        </span>
                        <span className="dc-hero-metric-value font-display">
                          {approxYouth}
                        </span>
                      </div>
                    )}
                    {showcasesCount && (
                      <div className="dc-hero-metric">
                        <span className="dc-hero-metric-label font-sans">
                          Community performances
                        </span>
                        <span className="dc-hero-metric-value font-display">
                          {showcasesCount}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {sponsorLink && (
                  <div
                    className="dc-hero-cta-row"
                    style={{ paddingBottom: 22 }} // ✅ buffer under CTA
                  >
                    <DATButtonLink
                      href={sponsorLink}
                      size="md"
                      className="dc-hero-cta"
                    >
                      Sponsor this Drama Club
                    </DATButtonLink>
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
              ← All Drama Clubs
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
                      className="dc-snapshot-footer-link"
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
            <div className="dc-layout">
              <section className="dc-section">
                <h2 className="dc-section-head font-sans">
                  What happens in this room
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

                {artistProgramsLink && (
                  <div className="dc-inline-cta">
                    <Link
                      href={artistProgramsLink}
                      className="dc-link dc-link--purple font-sans"
                    >
                      I&apos;m an artist → see programs connected to Drama Clubs
                    </Link>
                  </div>
                )}
              </section>

              <aside className="dc-section dc-section--right">
                <h2 className="dc-section-head font-sans">
                  Voices from this club
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
                      role={
                        effectiveEldersQuote.avatarSrc ? "button" : undefined
                      }
                      tabIndex={effectiveEldersQuote.avatarSrc ? 0 : -1}
                      onKeyDown={(e) => {
                        if (
                          !effectiveEldersQuote.avatarSrc ||
                          e.key !== "Enter"
                        )
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
              </aside>
            </div>

            {/* GALLERY */}
            {hasGallery && (
              <DramaClubMomentsGallery images={gallery} clubName={club.name} />
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
                        <div className="dc-needs-block">
                          <p className="dc-mini-label font-sans">
                            Shared community needs
                          </p>
                          <ul className="dc-needs-list font-sans">
                            {needsSafe.map((need: string, i: number) => (
                              <li key={`${need}-${i}`}>{need}</li>
                            ))}
                          </ul>
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
                              className={`partner-bar ${
                                hasLogo ? "" : "partner-no-logo"
                              }`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {content}
                            </a>
                          ) : (
                            <div
                              key={p.name}
                              className={`partner-bar ${
                                hasLogo ? "" : "partner-no-logo"
                              }`}
                            >
                              {content}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </aside>
                )}
              </section>
            )}

            {/* SECTION — Artist pathways */}
            {hasArtistPathways && (
              <section className="dc-artist-section">
                <div className="dc-artist-inner">
                  <div className="dc-artist-left">
                    <h2 className="dc-section-head font-sans">
                      Artist pathways & projects
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

                    {/* ✅ Lead team — tighter spacing + shrink before wrap (NO SCROLL) */}
{dramaClubLeadTeam.length > 0 && (
  <div className="dc-needs-block">
    <p className="dc-mini-label font-sans">Lead team</p>

    <div className="dc-lead-mini-wrap">
      {dramaClubLeadTeam.map((person, idx) => {
        if (!person?.name) return null;

        const href = person.href;

        const slugFromHref =
          typeof href === "string" && href.includes("/alumni/")
            ? href.split("/alumni/")[1]?.split(/[?#]/)[0]
            : undefined;

        const slug = (slugFromHref || slugify(person.name || `artist-${idx}`)).trim();

        // ✅ FIX: MiniProfileCardProps.role is a required string
        const roleSafe = (person.subtitle ?? "").trim();

        return (
          <div key={`${slug}-${idx}`} className="dc-lead-mini-item">
            <MiniProfileCard
              name={person.name}
              role={roleSafe}
              slug={slug}
              headshotUrl={person.avatarSrc}
              variant="light"
            />
          </div>
        );
      })}
    </div>


                      </div>
                    )}

                    {!!(club as unknown as { currentProjects?: string[] })
                      .currentProjects?.length && (
                      <div className="dc-needs-block">
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
                      </div>
                    )}
                  </div>

                  <aside className="dc-artist-right">
                    {!!visitingArtists?.length && (
                      <div className="dc-artist-visiting">
                        <p className="dc-mini-label font-sans">
                          Visiting artists
                        </p>
                        <ul className="dc-avatar-row">
                          {visitingArtists.map((artist: VisitingArtist) => (
                            <li key={artist.name} className="dc-avatar-item">
                              <div className="dc-avatar-circle">
                                {artist.avatarSrc ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={artist.avatarSrc}
                                    alt={artist.name}
                                    className="dc-avatar-img"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                ) : (
                                  <span className="dc-avatar-initial">
                                    {artist.name?.[0] ?? "A"}
                                  </span>
                                )}
                              </div>
                              <span className="dc-avatar-name font-sans">
                                <AlumniName
                                  name={artist.name}
                                  href={artist.href}
                                />
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {!!alumniPathways?.length && (
                      <div className="dc-artist-alumni">
                        <p className="dc-mini-label font-sans">
                          Alumni pathways
                        </p>
                        <div className="dc-alumni-chips">
                          {alumniPathways.map((alum: AlumniPathway) => (
                            <Link
                              key={alum.slug}
                              href={`/alumni/${alum.slug}`}
                              className="dc-alumni-chip font-sans"
                            >
                              <span className="dc-alumni-name">
                                {alum.name}
                              </span>
                              {alum.role && (
                                <span className="dc-alumni-role">
                                  {alum.role}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </aside>
                </div>
              </section>
            )}

            {/* SECTION D — Impact */}
            {(hasImpactMetrics || hasImpactResources || sponsorLink) && (
              <section className="dc-impact-section">
                <div className="dc-impact-inner">
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
                      <div className="dc-impact-cta-row">
                        <a href={sponsorLink} className="dc-cta">
                          Sponsor this Drama Club
                        </a>
                        <Link
                          href="/alumni"
                          className="dc-link dc-link--light font-sans"
                        >
                          Meet the artists behind this work →
                        </Link>
                      </div>
                    )}
                  </div>

                  {(hasImpactMetrics || hasImpactResources) && (
                    <aside className="dc-impact-card">
                      {hasImpactMetrics && (
                        <div className="dc-impact-metric-grid">
                          {effectiveImpactMetrics.map((m: DramaClubMetric) => {
                            if (!m.label || !m.value) return null;
                            return (
                              <div
                                key={m.label}
                                className="dc-impact-metric-item"
                              >
                                <span className="dc-impact-metric-value font-display">
                                  {m.value}
                                </span>
                                <span className="dc-impact-metric-label font-sans">
                                  {m.label}
                                </span>
                                {m.helper && (
                                  <span className="dc-impact-metric-helper font-sans">
                                    {m.helper}
                                  </span>
                                )}
                              </div>
                            );
                          })}
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

                      <Link
                        href="/contact"
                        className="dc-link dc-link--teal font-sans"
                      >
                        Start a conversation about Drama Club sponsorship →
                      </Link>
                    </aside>
                  )}
                </div>
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
            <div className="dc-kraft-footer-inner">
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
                    ({getGeoLine(navTriplet.prev)})
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
                    ({getGeoLine(navTriplet.next)})
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

        {/* ✅ Small, surgical CSS fixes requested (top link alignment + color/hover, footer visibility) */}
        <style jsx global>{`
  /* Match card width feel + align left edge with the card */
  .dc-kraft-topnav {
    position: relative;
    z-index: 2;
    padding-top: 18px; /* more space above the link */
    padding-bottom: 8px; /* less space below the link */
  }

  .dc-kraft-container {
    max-width: 1120px;
    margin: 0 auto;
    padding: 0 24px;
  }

  /* All Drama Clubs link color + hover */
  .dc-kraft-backlink {
    display: inline-block;
    color: #ffcc00;
    text-decoration: none !important;
    font-weight: 600;
    letter-spacing: 0.01em;
    transition: color 180ms ease, transform 180ms ease;
  }
  .dc-kraft-backlink:hover {
    color: #6c00af;
    transform: translateY(1px);
  }

  /* Ensure footer nav is visible and not hidden behind anything */
  .dc-kraft-footer-nav {
    position: relative;
    z-index: 2;
    padding: 18px 0 28px;
  }

  .dc-kraft-footer-inner {
    max-width: 1120px;
    margin: 0 auto;
    padding: 0 24px;
  }

  @media (max-width: 520px) {
    .dc-kraft-container,
    .dc-kraft-footer-inner {
      padding: 0 18px;
    }
  }

  /* =========================
     Lead team mini-cards grid
     (moved here to avoid nested styled-jsx)
     ========================= */
  .dc-lead-mini-wrap {
    display: grid;
    gap: 8px;
    align-items: start;
    justify-items: start;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .dc-lead-mini-item {
    transform: scale(1);
    transform-origin: top left;
  }

  @media (max-width: 880px) {
    .dc-lead-mini-wrap {
      gap: 7px;
      grid-template-columns: repeat(auto-fit, minmax(135px, 1fr));
    }
    .dc-lead-mini-item {
      transform: scale(0.92);
    }
  }

  @media (max-width: 520px) {
    .dc-lead-mini-wrap {
      gap: 6px;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    }
    .dc-lead-mini-item {
      transform: scale(0.81);
    }
  }
`}</style>

      </main>
    </div>
  );
}
