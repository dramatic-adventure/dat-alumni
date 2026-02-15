/* components/donate/DonationPageTemplate.tsx */

"use client";

import "./donationPage.css";
import "./donationPage.restore.css";
import { LEFT_COLUMN_BY_MODE } from "@/lib/donate/leftColumnContent";


import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition, useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type React from "react";

import type {
  DonationCampaign,
  DonationFrequency,
  DonationModeId,
  DonationSelectOption,
  DonationTier,
} from "@/lib/donations";
import {
  DONATION_MODE_LABELS,
  DONATION_MODE_ORDER,
  getDonationCampaign,
} from "@/lib/donations";

import type {
  DramaClubCauseCategory,
  DramaClubCauseSubcategory,
} from "@/lib/causes";
import { CAUSE_CATEGORIES, CAUSE_SUBCATEGORIES_BY_CATEGORY } from "@/lib/causes";

// ✅ Pull country/city/region for clubs from the canonical map
import { dramaClubMap } from "@/lib/dramaClubMap";

type ArtistImpactFocus =
  | "all"
  | "equitable_access"
  | "sustained_participation"
  | "creative_breakthrough"
  | "artist_leadership"
  | "long_term_fellowship";

const ARTIST_FOCUS_OPTIONS: { id: ArtistImpactFocus; label: string; blurb: string }[] = [
  { id: "all", label: "All artist support", blurb: "We steward funds across access, stipends, mentorship, and long-term pathways." },
  { id: "equitable_access", label: "Equitable access", blurb: "Remove financial barriers so under-resourced artists can participate." },
  { id: "sustained_participation", label: "Sustained participation", blurb: "Help artists stay in the work long enough to grow and contribute deeply." },
  { id: "creative_breakthrough", label: "Creative breakthrough", blurb: "Enable artistic risk, new work development, and expanded responsibility." },
  { id: "artist_leadership", label: "Artist leadership", blurb: "Support mentors and ensemble anchors who build culture and capacity." },
  { id: "long_term_fellowship", label: "Long-term fellowship", blurb: "Invest in future co-creators and sustained artistic partnerships." },
];

function prettyArtistFocus(focus: ArtistImpactFocus | null | undefined) {
  const hit = ARTIST_FOCUS_OPTIONS.find((o) => o.id === focus);
  return hit?.label ?? "All artist support";
}

type Props = {
  campaign: DonationCampaign;
  initial: {
    mode: DonationModeId;
    frequency: DonationFrequency;

    club?: string;

    /** ✅ allow selecting “country bucket” (no specific club) */
    clubCountry?: string;

    cause?: string; // allow "category" or "category::subcategory"
    production?: string;
    project?: string;
    tier?: string;

    artistFocus?: ArtistImpactFocus | string;
  };

  activeProductions?: DonationSelectOption[];
  activeSpecialProjects?: DonationSelectOption[];
  activeClubs?: DonationSelectOption[];
};

type CheckoutResponse = {
  id?: string;
  url?: string | null;
  clientSecret?: string | null;
  error?: string;
};

type Receipt = {
  sessionId: string;
  mode: "payment" | "subscription";
  status: string | null;
  paymentStatus: string | null;

  donorEmail: string | null;
  donorKey: string | null;

  amountMinor: number | null;
  currency: string | null;

  campaignSlug: string | null;
  contextType: string | null;
  contextId: string | null;
  tierId: string | null;
  amountType: string | null;

  stripeCustomerId: string | null;
  stripePaymentIntentId: string | null;
  stripeSubscriptionId: string | null;
  stripeInvoiceId: string | null;

  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
};

type CheckoutBannerKind = "success" | "canceled";

/** Turn "sponsor-the-story" → "Sponsor the Story" */
function titleizeLoose(input: string) {
  const t = (input ?? "").trim();
  if (!t) return "";
  const words = t
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");
  return words
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");
}

function formatMoney(n: number) {
  const isWhole = Number.isFinite(n) && Math.round(n) === n;

  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  });
}


function formatMoneyMinor(amountMinor: number | null, currency: string | null) {
  if (amountMinor == null || !currency) return "—";
  const amt = amountMinor / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amt);
  } catch {
    return `${amt.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function refContextCode(heroMode: DonationModeId) {
  // heroMode is already normalized (general / drama-club / artist / new-work / special-project / cause)
  switch (heroMode) {
    case "drama-club":
      return "DC";
    case "artist":
      return "AR";
    case "new-work":
      return "NW";
    case "special-project":
      return "SP";
    case "cause":
      return "CA";
    case "general":
    default:
      return "ST"; // Sponsor the Story
  }
}


type StartCheckoutPayload = {
  amount: number;
  frequency: DonationFrequency;
  mode?: DonationModeId;
  tierId?: string;

  club?: string;

  /** ✅ country bucket selection (when no specific club selected) */
  clubCountry?: string;
  
  artistFocus?: ArtistImpactFocus;

  // Prefer the compact `cause` string (category or category::subcategory),
  // but keep category/subcategory for backwards compatibility with existing API handlers.
  cause?: string;
  causeCategory?: string;
  causeSubcategory?: string;

  production?: string;
  project?: string;

  /** Stripe display only (keep it short). */
  contextLabel?: string;
  checkoutTitle?: string;
};

async function startCheckout(payload: StartCheckoutPayload) {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // 🔁 Explicitly copy fields instead of using `...payload`
      amount: payload.amount,
      frequency: payload.frequency,
      mode: payload.mode,
      tierId: payload.tierId,
      club: payload.club,
      clubCountry: payload.clubCountry,
      artistFocus: payload.artistFocus,
      cause: payload.cause,
      causeCategory: payload.causeCategory,
      causeSubcategory: payload.causeSubcategory,
      production: payload.production,
      project: payload.project,
      contextLabel: payload.contextLabel,
      checkoutTitle: payload.checkoutTitle,
      uiMode: "hosted",
    }),
  });

  const data = (await res.json().catch(() => ({}))) as CheckoutResponse;

  if (!res.ok) throw new Error(data?.error || "Checkout failed.");
  if (!data?.url) throw new Error("No Stripe Checkout URL returned.");
  window.location.href = data.url;
}

function buildQuery(params: Record<string, string | undefined>) {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    const t = (v ?? "").trim();
    if (t) qp.set(k, t);
  });
  const qs = qp.toString();
  return qs ? `?${qs}` : "";
}

function safeModeNavList(): DonationModeId[] {
  return DONATION_MODE_ORDER.filter(
    (m) => m !== "new-work-specific" && m !== "special-project-specific"
  );
}

function normalizeHeroMode(mode: DonationModeId) {
  if (mode === "new-work-specific") return "new-work";
  if (mode === "special-project-specific") return "special-project";
  return mode;
}

/** Pill labels: “the story”, “the cause”, etc. */
const MODE_PILL_LABELS: Partial<Record<DonationModeId, string>> = {
  general: "the story",
  "drama-club": "a drama club",
  artist: "an artist",
  "new-work": "a new work",
  "special-project": "a special project",
  cause: "the cause",
};

const HERO_FALLBACKS: Partial<
  Record<DonationModeId, { src: string; alt: string }>
> = {
  "drama-club": {
    src: "/images/donate/hero-drama-club.jpg",
    alt: "Youth drama club in session",
  },
  artist: {
    src: "/images/donate/hero-artist.jpg",
    alt: "Teaching artist mentorship and rehearsal",
  },
  "new-work": {
    src: "/images/donate/hero-new-work.jpg",
    alt: "New work rehearsal and creation",
  },
  "new-work-specific": {
    src: "/images/donate/hero-new-work.jpg",
    alt: "New work rehearsal and creation",
  },
  "special-project": {
    src: "/images/donate/hero-special.jpg",
    alt: "Special project in the field",
  },
  "special-project-specific": {
    src: "/images/donate/hero-special.jpg",
    alt: "Special project in the field",
  },
  cause: {
    src: "/images/donate/hero-cause.jpg",
    alt: "Cause-aligned theatre and community impact",
  },
  general: {
    src: "/images/donate/hero-general.jpg",
    alt: "Global storytelling and community connection",
  },
};

function parseArtistFocus(raw?: string): ArtistImpactFocus {
  const t = (raw ?? "").trim().toLowerCase();
  const allowed = new Set<ArtistImpactFocus>([
    "all",
    "equitable_access",
    "sustained_participation",
    "creative_breakthrough",
    "artist_leadership",
    "long_term_fellowship",
  ]);

  return (allowed.has(t as ArtistImpactFocus) ? (t as ArtistImpactFocus) : "all");
}

function parseCause(raw?: string): {
  category?: DramaClubCauseCategory;
  subcategory?: DramaClubCauseSubcategory;
} {
  const t = (raw ?? "").trim();
  if (!t) return {};
  if (t.includes("::")) {
    const [cat, sub] = t.split("::");
    return {
      category: cat as DramaClubCauseCategory,
      subcategory: sub as DramaClubCauseSubcategory,
    };
  }
  return { category: t as DramaClubCauseCategory };
}

function clubFromMapId(optOrId: DonationSelectOption | string | undefined) {
  const id =
    typeof optOrId === "string"
      ? optOrId
      : String((optOrId as any)?.id ?? (optOrId as any)?.slug ?? "");
  if (!id) return null;
  return (dramaClubMap as any)?.[id] ?? null;
}

function optionCountry(opt: DonationSelectOption): string {
  const anyOpt = opt as any;
  const fromMap = clubFromMapId(opt);
  return (
    anyOpt?.country ||
    anyOpt?.meta?.country ||
    fromMap?.country ||
    anyOpt?.group ||
    anyOpt?.meta?.group ||
    "Other"
  );
}

/** Pull a city / region string if available for club pills. */
function optionCity(opt: DonationSelectOption): string | null {
  const anyOpt = opt as any;
  const fromMap = clubFromMapId(opt);

  const city =
    anyOpt?.city ||
    anyOpt?.meta?.city ||
    fromMap?.city ||
    anyOpt?.meta?.location;

  const region =
    anyOpt?.region ||
    anyOpt?.meta?.region ||
    fromMap?.region ||
    anyOpt?.meta?.area;

  if (city && region) {
    const c = String(city).trim();
    const r = String(region).trim();
    if (!c || !r) return c || r || null;
    const lowC = c.toLowerCase();
    const lowR = r.toLowerCase();
    if (lowC.includes(lowR)) return c;
    return `${c} • ${r}`;
  }

  return (city ?? region ?? null) as any;
}

function neutralizeCauseEyebrow(eyebrow: string) {
  return eyebrow
    .replace(/advancing\s+[^.]+/gi, "advancing your cause")
    .replace(/advance\s+[^.]+/gi, "advance your cause")
    .replace(/advances\s+[^.]+/gi, "advances your cause");
}

function normalizeCheckoutKind(raw: string | null): CheckoutBannerKind | null {
  const t = (raw ?? "").trim().toLowerCase();
  if (t === "success") return "success";
  if (t === "canceled" || t === "cancelled" || t === "cancel") return "canceled";
  return null;
}

function prettyContextType(t: string) {
  const x = (t ?? "").trim().toLowerCase();
  if (x === "drama_club") return "Drama Club";
  if (x === "artist") return "Artist";
  if (x === "special_project") return "Special Project";
  if (x === "new_work") return "Production";
  if (x === "production") return "Production";
  if (x === "cause") return "Cause";
  if (x === "campaign") return "Campaign";
  return titleizeLoose(x.replace(/_/g, " "));
}

function findOptionLabel(
  options: DonationSelectOption[],
  idOrSlug: string | undefined
): string | null {
  const t = (idOrSlug ?? "").trim();
  if (!t) return null;
  const hit = options.find((o: any) => String(o?.id ?? o?.slug ?? "") === t);
  return (hit as any)?.label ?? null;
}

function getCauseDisplayLabel(
  category?: DramaClubCauseCategory,
  subcategory?: DramaClubCauseSubcategory
): string | null {
  if (!category && !subcategory) return null;

  const catId = (category ?? "").trim();
  const subId = (subcategory ?? "").trim();

  const catMeta =
    (CAUSE_CATEGORIES as any[])?.find(
      (c) => c?.id === catId || c?.slug === catId || c?.key === catId
    ) ?? null;

  if (subId && catId) {
    const subs = (CAUSE_SUBCATEGORIES_BY_CATEGORY as any)?.[catId] ?? [];
    const subMeta =
      (subs as any[])?.find(
        (s) => s?.id === subId || s?.slug === subId || s?.key === subId
      ) ?? null;

    return (subMeta?.label as string) || titleizeLoose(subId);
  }

  return (catMeta?.label as string) || titleizeLoose(catId);
}

/**
 * ✅ Dashboard headline rules:
 * - Drama clubs:
 *   - country bucket → Sponsor Drama Clubs in {Country}
 *   - nothing picked → Sponsor Drama Clubs around the World
 *   - specific club → “club name” in quotes
 */
function buildDashboardHeadline(args: {
  heroMode: DonationModeId;
  clubSlug?: string;
  clubCountry?: string | null;

  artistFocus?: ArtistImpactFocus;

  productionSlug?: string;
  projectId?: string;
  causeCategory?: DramaClubCauseCategory;
  causeSubcategory?: DramaClubCauseSubcategory;

  clubOptions: DonationSelectOption[];
  activeProductions: DonationSelectOption[];
  activeSpecialProjects: DonationSelectOption[];
}) {
  const {
    heroMode,
    clubSlug,
    clubCountry,
    productionSlug,
    projectId,
    causeCategory,
    causeSubcategory,
    clubOptions,
    activeProductions,
    activeSpecialProjects,
  } = args;

  if (heroMode === "general") return "Sponsor the Story";

  if (heroMode === "drama-club") {
    if (!clubSlug && clubCountry) return `Sponsor Drama Clubs in ${clubCountry}`;
    if (!clubSlug && !clubCountry) return "Sponsor Drama Clubs around the World";

    const fromMap = clubFromMapId(clubSlug);
    const label =
      fromMap?.name ||
      findOptionLabel(clubOptions, clubSlug) ||
      (clubSlug ? titleizeLoose(clubSlug) : null);

    return label ? `Sponsor the “${label}” Drama Club` : "Sponsor a Drama Club";
  }

  if (heroMode === "new-work") {
    const label =
      findOptionLabel(activeProductions, productionSlug) ||
      (productionSlug ? titleizeLoose(productionSlug) : null);

    return label ? `Sponsor the New Work, “${label}”` : "Sponsor a New Work";
  }

  if (heroMode === "special-project") {
    const label =
      findOptionLabel(activeSpecialProjects, projectId) ||
      (projectId ? titleizeLoose(projectId) : null);

    return label
      ? `Sponsor the Special Project, “${label}”`
      : "Sponsor a Special Project";
  }

  if (heroMode === "cause") {
    const label = getCauseDisplayLabel(causeCategory, causeSubcategory);
    return label ? `Sponsor Work Centered Around “${label}”` : "Sponsor the Cause";
  }

    if (heroMode === "artist") {
    const focus =
      args.artistFocus && args.artistFocus !== "all"
        ? ` — ${prettyArtistFocus(args.artistFocus)}`
        : "";
    return `Sponsor an Artist${focus}`;
  }

  return "Sponsor the Story";
}


/** Full-width hero above the card */
type DonationHeroProps = {
  src: string;
  alt: string;
  headline: string;
  body: React.ReactNode;
};

function DonationHero({ src, alt, headline, body }: DonationHeroProps) {
  return (
    <section className="donateHero" aria-label="Sponsor the Story hero">
      <div className="donateHeroFrame">
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes="100vw"
          className="donateHeroImg"
        />

        <div className="donateHeroOverlay" />

        <div className="donateHeroStack">
          <span className="donateHeroEyebrow">Dramatic Adventure Theatre</span>
          <h1 className="donateHeroTitle">{headline}</h1>
          <div className="donateHeroBody">{body}</div>
        </div>
      </div>
    </section>
  );
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}


export default function DonationPageTemplate({
  campaign: initialCampaignFromServer,
  initial,
  activeProductions = [],
  activeSpecialProjects = [],
  activeClubs = [],
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isUrlPending, startTransition] = useTransition();
  const lastUrlRef = useRef<string | null>(null);
  const tierGridRef = useRef<HTMLDivElement | null>(null);
  const ctaBtnRef = useRef<HTMLButtonElement | null>(null);

  // ---------- LOGIC ZONE: state, derived values, Stripe wiring, URL sync ----------

  // Initial context → mode / cause
  const initialCause = parseCause(initial.cause);

  const initialMode: DonationModeId =
    initial.mode ||
    (initial.club || initial.clubCountry
      ? "drama-club"
      : initial.cause
      ? "cause"
      : initial.production
      ? "new-work"
      : initial.project
      ? "special-project"
      : "general");

  const [mode, setMode] = useState<DonationModeId>(initialMode);

  const [frequency, setFrequency] = useState<DonationFrequency>(
    initial.frequency || "monthly"
  );

  const [club, setClub] = useState<string | undefined>(initial.club);
  
  const [production, setProduction] = useState<string | undefined>(
    initial.production
  );
  const [project, setProject] = useState<string | undefined>(initial.project);

const [artistFocus, setArtistFocus] = useState<ArtistImpactFocus>(() =>
  parseArtistFocus(initial.artistFocus)
);



  // ALL-state toggles for each category
const [allNewWorks, setAllNewWorks] = useState(() => !initial.production);
const [allSpecialProjects, setAllSpecialProjects] = useState(() => !initial.project);
const [allCauses, setAllCauses] = useState(() => !initialCause.category);


  const [causeCategory, setCauseCategory] = useState<
    DramaClubCauseCategory | undefined
  >(initialCause.category);
  const [causeSubcategory, setCauseSubcategory] = useState<
    DramaClubCauseSubcategory | undefined
  >(initialCause.subcategory);

  const [selectedTierId, setSelectedTierId] = useState<string | undefined>(
    initial.tier
  );

  const [customAmount, setCustomAmount] = useState<number | null>(null);


  const [error, setError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // If server doesn't pass activeClubs (or it’s empty), build options from dramaClubMap.
  const clubOptions = useMemo<DonationSelectOption[]>(() => {
    if (activeClubs?.length) return activeClubs;

    const clubs = Object.values(dramaClubMap as any)
      .filter(
        (c: any) =>
          c?.slug && c?.name && String(c.slug).trim() && String(c.name).trim()
      )
      .map((c: any) => ({
        id: c.slug,
        label: c.name,
        meta: {
          country: c.country,
          city: c.city,
          region: c.region,
        },
      }));

    return clubs;
  }, [activeClubs]);

  // ✅ Country-bucket selection for drama clubs (bucket itself selectable)
  const [selectedClubCountry, setSelectedClubCountry] = useState<string | null>(
    () => {
      if (initial.clubCountry) return initial.clubCountry;
      if (initial.club) {
        const m = clubFromMapId(initial.club);
        return m?.country ?? null;
      }
      return null;
    }
  );

  // Recompute campaign dynamically (lets hero image + tiers react to selection)
  const campaign = useMemo(() => {
    try {
      return getDonationCampaign({
        mode,
        causeCategory: causeCategory as any,
        clubSlug: club,
        productionSlug: production,
        specialProjectId: project,
        activeProductions,
        activeSpecialProjects,
        activeClubs: clubOptions,
      });
    } catch {
      return initialCampaignFromServer;
    }
  }, [
    mode,
    causeCategory,
    club,
    production,
    project,
    activeProductions,
    activeSpecialProjects,
    clubOptions,
    initialCampaignFromServer,
  ]);


  // ---------- HERO (image dynamic, copy locked) ----------
  const heroMode = normalizeHeroMode(mode);

  const artistFocusParam = heroMode === "artist" ? artistFocus : undefined;
  
  // ✅ Left column content (dynamic by sponsor mode)
const leftContent = useMemo(() => {
  let key: keyof typeof LEFT_COLUMN_BY_MODE = "story";

  switch (heroMode) {
    case "general":
      key = "story";
      break;
    case "drama-club":
      key = "drama_club";
      break;
    case "new-work":
      key = "new_work";
      break;
    case "special-project":
      key = "special_project";
      break;
    case "artist":
      key = "artist";
      break;
    case "cause":
      key = "cause";
      break;
    default:
      key = "story";
      break;
  }

  return LEFT_COLUMN_BY_MODE[key];
}, [heroMode]);


  const fallbackHero =
    HERO_FALLBACKS[heroMode] ?? HERO_FALLBACKS.general ?? {
      src: "/images/donate/hero-general.jpg",
      alt: "Global storytelling and community connection",
    };

  const heroSrc = (campaign as any)?.heroImageUrl?.trim?.() || fallbackHero.src;
  const heroAlt = (campaign as any)?.heroImageAlt?.trim?.() || fallbackHero.alt;

  // ✅ LOCKED HERO COPY
  const heroHeadline = "Sponsor the Story";
  const heroBody = (
  <>
    Where a child claims their voice, an artist discovers their purpose, and an
    audience finds new meaning.{" "}
    <span className="donateHeroAccent">These are the stories that move.</span>
  </>
);

  // ✅ Enforce one-time only for production/project-specific modes (prevents invalid combos)
  useEffect(() => {
    if (mode === "new-work-specific" || mode === "special-project-specific") {
      if (frequency !== "one_time") {
        setFrequency("one_time");
        setSelectedTierId(undefined);
        setCustomAmount(null);
      }
    }
  }, [mode, frequency]);

  // ✅ Dashboard headline (dynamic)
  const dashHeadline = useMemo(() => {
    return buildDashboardHeadline({
      heroMode,
      clubSlug: club,
      clubCountry: selectedClubCountry,
      artistFocus,
      productionSlug: production,
      projectId: project,
      causeCategory,
      causeSubcategory,
      clubOptions,
      activeProductions,
      activeSpecialProjects,
    });
  }, [
  heroMode,
  artistFocus,
  club,
  production,
  project,
  causeCategory,
  causeSubcategory,
  clubOptions,
  activeProductions,
  activeSpecialProjects,
  selectedClubCountry,
]);


  // ---------- CHECKOUT RETURN (success/cancel) ----------
  const checkoutKind = useMemo(() => {
    // Old behavior: Stripe-style success/canceled flags
    const success = searchParams.get("success");
    const canceled =
      searchParams.get("canceled") ?? searchParams.get("cancelled");

    if (success) return "success";
    if (canceled) return "canceled";

    // Fallbacks in case we ever use explicit checkout/status params
    const explicit =
      searchParams.get("checkout") ?? searchParams.get("status") ?? null;
    return normalizeCheckoutKind(explicit);
  }, [searchParams]);

  const returnSessionId =
    searchParams.get("session_id") ?? searchParams.get("sessionId");

  const [dismissedReturn, setDismissedReturn] = useState(false);

  const showReturnCard = Boolean(checkoutKind) && !dismissedReturn;

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [isReceiptLoading, setIsReceiptLoading] = useState(false);

  const fetchReceipt = useCallback(async () => {
    if (!returnSessionId) return;
    setIsReceiptLoading(true);
    setReceiptError(null);

    try {
      const res = await fetch(
        `/api/stripe/session?session_id=${encodeURIComponent(returnSessionId)}`,
        { cache: "no-store" }
      );
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setReceipt(null);
        setReceiptError(data?.error ?? "Failed to load receipt details.");
      } else {
        setReceipt(data as Receipt);
      }
    } catch (e: any) {
      setReceipt(null);
      setReceiptError(e?.message ?? "Failed to load receipt details.");
    } finally {
      setIsReceiptLoading(false);
    }
  }, [returnSessionId]);

  useEffect(() => {
    if (!showReturnCard) return;
    if (checkoutKind !== "success") return;

    if (!returnSessionId) {
      setReceipt(null);
      setReceiptError("Missing session_id.");
      return;
    }
    if (returnSessionId.includes("CHECKOUT_SESSION_ID")) {
      setReceipt(null);
      setReceiptError("Invalid session_id.");
      return;
    }

    void fetchReceipt();
  }, [showReturnCard, checkoutKind, returnSessionId, fetchReceipt]);

  const dismissReturnCard = useCallback(() => {
  setDismissedReturn(true);
  setReceipt(null);
  setReceiptError(null);

  // strip return params
  const qs = buildQuery({
    mode,
    freq: frequency,
    tier: selectedTierId,
    club,
    clubCountry: heroMode === "drama-club" && !club ? selectedClubCountry ?? undefined : undefined,
    production,
    project,
    cause: causeCategory && causeSubcategory ? `${causeCategory}::${causeSubcategory}` : causeCategory ? String(causeCategory) : undefined,
    artistFocus: heroMode === "artist" ? artistFocus : undefined,
  });

  const nextUrl = `${pathname}${qs}`;
  router.replace(nextUrl, { scroll: false });
}, [
  mode, frequency, selectedTierId, club, selectedClubCountry,
  production, project, causeCategory, causeSubcategory,
  heroMode, artistFocus, pathname, router
]);


  const tryAgainFromCancel = useCallback(() => {
  dismissReturnCard();

  setTimeout(() => {
    const el = ctaBtnRef.current;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 50);
}, [dismissReturnCard]);


  // ---------- TIERS (NO spread) ----------
  const tiers = useMemo(() => {
    const base = ((campaign as any)?.tiers?.[frequency] ?? []) as DonationTier[];

    // If we're not in cause mode, or we have a specific cause, just return base.
    if (heroMode !== "cause" || causeCategory) {
      return base;
    }

    // “All causes we champion” → neutralize any cause-specific eyebrow language.
    return base.map((tier) => {
      const t: any = tier as any;
      const rawEyebrow = t.eyebrow;
      const eyebrow =
        typeof rawEyebrow === "string"
          ? neutralizeCauseEyebrow(rawEyebrow)
          : rawEyebrow;

      // Avoid `...t` – construct a shallow copy manually.
      const copy: any = {
        id: t.id,
        title: t.title,
        amount: t.amount,
        bullets: t.bullets,
        featured: t.featured,
        frequency: t.frequency,
        eyebrow,
      };

      // If DonationTier ever has extra fields, preserve them best-effort:
      if ("shortLabel" in t) copy.shortLabel = t.shortLabel;
      if ("description" in t) copy.description = t.description;

      return copy as DonationTier;
    });
  }, [campaign, frequency, heroMode, causeCategory]);

  const selectedTier = useMemo<DonationTier | undefined>(() => {
    if (!selectedTierId) return undefined;
    return tiers.find((t: any) => String((t as any)?.id) === selectedTierId);
  }, [tiers, selectedTierId]);

// ✅ Auto-select the featured tier ONCE on initial load (only if nothing is selected)
const didAutoSelectFeatured = useRef(false);

useEffect(() => {
  if (didAutoSelectFeatured.current) return;

  // If URL/server gave us a tier, respect it and stop.
    if (selectedTierId && selectedTierId !== "custom") {
    didAutoSelectFeatured.current = true;
    return;
  }
  if (selectedTierId === "custom") {
    didAutoSelectFeatured.current = true;
    return;
  }


  const featured = (tiers as any[]).find((t) => t?.featured);
  if (featured?.id) {
    setSelectedTierId(String(featured.id));
  }

  didAutoSelectFeatured.current = true;
}, [tiers, selectedTierId]);

  // ✅ URL sync — includes success/canceled + session_id when return card is visible
  useEffect(() => {
    const causeParam =
      causeCategory && causeSubcategory
        ? `${causeCategory}::${causeSubcategory}`
        : causeCategory
        ? String(causeCategory)
        : undefined;

    const clubCountryParam =
      heroMode === "drama-club" && !club
        ? selectedClubCountry ?? undefined
        : undefined;

    const qs = buildQuery({
      mode,
      freq: frequency,
      tier: selectedTierId,
      club,
      clubCountry: clubCountryParam,
      production,
      project,
      cause: causeParam,
      artistFocus: artistFocusParam,

      // Replicate old behavior: use Stripe-style flags
      success:
        showReturnCard && checkoutKind === "success" ? "true" : undefined,
      canceled:
        showReturnCard && checkoutKind === "canceled" ? "true" : undefined,
      session_id:
        showReturnCard && checkoutKind === "success"
          ? returnSessionId ?? undefined
          : undefined,
    });

    const nextUrl = `${pathname}${qs}`;
if (lastUrlRef.current === nextUrl) return;
lastUrlRef.current = nextUrl;

startTransition(() => {
  router.replace(nextUrl, { scroll: false });
});

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mode,
    frequency,
    selectedTierId,
    club,
    selectedClubCountry,
    production,
    project,
    causeCategory,
    causeSubcategory,
    pathname,
    showReturnCard,
    checkoutKind,
    returnSessionId,
    heroMode,
    artistFocus,
  ]);

  // ---------- Sponsor copy ----------
  const sponsorCopy = useMemo(() => {
    const clubLabel = club
      ? clubOptions.find((c: any) => String(c.id) === club)?.label
      : undefined;
    const prodLabel = production
      ? activeProductions.find((p: any) => String(p.id) === production)?.label
      : undefined;
    const projLabel = project
      ? activeSpecialProjects.find((p: any) => String(p.id) === project)?.label
      : undefined;

    const catMeta = causeCategory
      ? (CAUSE_CATEGORIES as any[]).find((c) => c.id === causeCategory)
      : undefined;

    const catLabel =
      (catMeta as any)?.shortLabel ??
      (catMeta as any)?.label ??
      (causeCategory ? String(causeCategory) : undefined);

    const subMeta =
      causeCategory && causeSubcategory
        ? ((CAUSE_SUBCATEGORIES_BY_CATEGORY as any)[causeCategory] ?? []).find(
            (s: any) => s.id === causeSubcategory
          )
        : undefined;

    const subLabel =
      (subMeta as any)?.label ??
      (causeSubcategory ? String(causeSubcategory) : undefined);

    if (heroMode === "cause") {
      const causeText = subLabel ?? catLabel;

      const headline = causeText
        ? `Sponsor Work Centered Around “${causeText}”`
        : "Sponsor the Cause";

      const description = causeText
        ? "Your gift routes to DAT work aligned with this focus—funding artists, partners, travel, materials, and youth-led storytelling where it matters most."
        : "Your gift supports DAT’s cause-aligned portfolio—directing resources to the communities and partners doing urgent work on the ground.";

      return { headline, description };
    }

    if (heroMode === "drama-club") {
      const headline = clubLabel
        ? `Sponsor the “${clubLabel}” Drama Club`
        : selectedClubCountry
        ? `Sponsor Drama Clubs in ${selectedClubCountry}`
        : "Sponsor Drama Clubs around the World";

      const description = clubLabel
        ? "Your gift strengthens this club’s rehearsals, mentorship, and showcases—helping young artists build confidence, craft, and community."
        : selectedClubCountry
        ? "Your gift strengthens drama clubs in this country—supporting youth leadership, local mentorship, and community sharings."
        : "Your gift strengthens drama clubs across our global network—youth-led theatre, local mentorship, and community showcases.";

      return { headline, description };
    }

    if (heroMode === "new-work") {
      const headline = prodLabel
        ? `Sponsor the New Work, “${prodLabel}”`
        : "Sponsor a New Work";
      const description = prodLabel
        ? "Your gift backs this production’s creation—rehearsal time, collaborators, design, and performance life."
        : "Your gift fuels the development of bold new plays—research, rehearsal, designers, and the first audiences who bring a story to life.";
      return { headline, description };
    }

    if (heroMode === "special-project") {
      const headline = projLabel
        ? `Sponsor the Special Project, “${projLabel}”`
        : "Sponsor a Special Project";
      const description = projLabel
        ? "Your gift funds this focused push—local partnership costs, travel logistics, artist support, and a clear, tangible outcome."
        : "Your gift powers focused, time-bound projects—high-impact moments that move a community forward without creating ongoing overhead.";
      return { headline, description };
    }

    if (heroMode === "artist") {
  const focus =
    artistFocus && artistFocus !== "all" ? ` — ${prettyArtistFocus(artistFocus)}` : "";
  return {
    headline: `Sponsor an Artist${focus}`,
    description:
      "Your gift invests directly in artists—mentorship, training, rehearsal support, and the conditions for exceptional work to emerge.",
  };
}

    return {
      headline: "Sponsor the Story",
      description:
        "Your gift gives DAT flexible fuel—directed where it’s needed most to keep stories moving and communities supported.",
    };
  }, [
    heroMode,
    artistFocus,
    club,
    production,
    project,
    causeCategory,
    causeSubcategory,
    clubOptions,
    activeProductions,
    activeSpecialProjects,
    selectedClubCountry,
  ]);

  // ---------- Stripe Checkout title (short + colon separators) ----------
  const checkoutTitle = useMemo(() => {
    const clubLabel = club
      ? clubOptions.find((c: any) => String(c.id) === club)?.label
      : undefined;
    const prodLabel = production
      ? activeProductions.find((p: any) => String(p.id) === production)?.label
      : undefined;
    const projLabel = project
      ? activeSpecialProjects.find((p: any) => String(p.id) === project)?.label
      : undefined;

    const catMeta = causeCategory
      ? (CAUSE_CATEGORIES as any[]).find((c) => c.id === causeCategory)
      : undefined;

    const catLabel =
      (catMeta as any)?.shortLabel ??
      (catMeta as any)?.label ??
      (causeCategory ? String(causeCategory) : undefined);

    const subMeta =
      causeCategory && causeSubcategory
        ? ((CAUSE_SUBCATEGORIES_BY_CATEGORY as any)[causeCategory] ?? []).find(
            (s: any) => s.id === causeSubcategory
          )
        : undefined;

    const subLabel =
      (subMeta as any)?.label ??
      (causeSubcategory ? String(causeSubcategory) : undefined);

    const prefix = frequency === "monthly" ? "Monthly Sponsorship" : "Sponsorship";

    if (heroMode === "cause") {
      const focus = subLabel ?? catLabel ?? "All Causes We Champion";
      return `${prefix}: Cause: ${focus}`;
    }

    if (heroMode === "drama-club") {
      const focus = clubLabel
        ? clubLabel
        : selectedClubCountry
        ? `Drama Clubs in ${selectedClubCountry}`
        : "Drama Clubs Around the World";
      return `${prefix}: Drama Club: ${focus}`;
    }

if (heroMode === "artist") {
  const focus =
    artistFocus && artistFocus !== "all" ? prettyArtistFocus(artistFocus) : "All artist support";
  return `${prefix}: Artist Sponsorship: ${focus}`;
}

    if (heroMode === "new-work") {
      const focus = prodLabel ?? "New Work";
      return `${prefix}: Production: ${focus}`;
    }

    if (heroMode === "special-project") {
      const focus = projLabel ?? "Special Projects";
      return `${prefix}: Special Project: ${focus}`;
    }

    return `${prefix}: Sponsor the Story`;
  }, [
  frequency,
  heroMode,
  artistFocus,
  club,
  production,
  project,
  causeCategory,
  causeSubcategory,
  clubOptions,
  activeProductions,
  activeSpecialProjects,
  selectedClubCountry,
]);


  // ---------- Bottom transparent chip text ----------
  const bottomSummaryPrimary = useMemo(() => {
    const freqText = frequency === "monthly" ? "MONTHLY" : "ONE-TIME";

    const clubLabel = club
      ? clubOptions.find((c: any) => String(c.id) === club)?.label
      : undefined;
    const prodLabel = production
      ? activeProductions.find((p: any) => String(p.id) === production)?.label
      : undefined;
    const projLabel = project
      ? activeSpecialProjects.find((p: any) => String(p.id) === project)?.label
      : undefined;

    const catMeta = causeCategory
      ? (CAUSE_CATEGORIES as any[]).find((c) => c.id === causeCategory)
      : undefined;

    const catLabel =
      (catMeta as any)?.shortLabel ??
      (catMeta as any)?.label ??
      (causeCategory ? String(causeCategory) : undefined);

    const subMeta =
      causeCategory && causeSubcategory
        ? ((CAUSE_SUBCATEGORIES_BY_CATEGORY as any)[causeCategory] ?? []).find(
            (s: any) => s.id === causeSubcategory
          )
        : undefined;

    const subLabel =
      (subMeta as any)?.label ??
      (causeSubcategory ? String(causeSubcategory) : undefined);

    let base: string;

    if (heroMode === "drama-club") {
      if (clubLabel) base = `"${clubLabel}" DRAMA CLUB SPONSORSHIP`;
      else if (selectedClubCountry)
        base = `${selectedClubCountry} DRAMA CLUB SPONSORSHIP`;
      else base = "DRAMA CLUB SPONSORSHIP";
    } else if (heroMode === "artist") {
  const focus =
    artistFocus && artistFocus !== "all" ? ` • ${prettyArtistFocus(artistFocus)}` : "";
  base = `ARTIST SPONSORSHIP${focus}`;  
    } else if (heroMode === "new-work") {
      base = prodLabel ? `${prodLabel} NEW WORK SPONSORSHIP` : "NEW WORK SPONSORSHIP";
    } else if (heroMode === "special-project") {
      base = projLabel
        ? `${projLabel} SPECIAL PROJECT SPONSORSHIP`
        : "SPECIAL PROJECT SPONSORSHIP";
    } else if (heroMode === "cause") {
      const focus = subLabel ?? catLabel;
      base = focus ? `${focus} CAUSE SPONSORSHIP` : "CAUSE SPONSORSHIP";
    } else {
      base = "STORY SPONSORSHIP";
    }

    return `${freqText} ${base}`.toUpperCase();
  }, [
  frequency,
  heroMode,
  artistFocus,
  club,
  production,
  project,
  causeCategory,
  causeSubcategory,
  clubOptions,
  activeProductions,
  activeSpecialProjects,
  selectedClubCountry,
]);

const scrollToCtaIfNeeded = useCallback(() => {
  const el = ctaBtnRef.current;
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;

  // how much "air" you want *below* the CTA after scrolling
  const bottomGap = Math.round(vh * 0.24); // try 0.10–0.18

  // If CTA bottom is already above the "safe line", don't scroll
  const safeBottom = vh - bottomGap;
  if (rect.bottom <= safeBottom) return;

  // Target scroll so CTA bottom lands at `safeBottom`
  const delta = rect.bottom - safeBottom;
  const targetY = window.scrollY + delta;

  // Respect reduced motion
  const reduce =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  window.scrollTo({
    top: targetY,
    behavior: reduce ? "auto" : "smooth",
  });
}, []);







  const beginCheckout = useCallback(async () => {
  setError(null);

  if (!selectedTierId) {
    setError("Please select a tier.");
    return;
  }

  if (selectedTierId !== "custom" && !selectedTier) {
    setError("Please select a tier.");
    return;
  }

  if (selectedTierId === "custom" && (!customAmount || customAmount <= 0)) {
    setError("Please enter an amount.");
    return;
  }

const artistFocusParam = heroMode === "artist" ? artistFocus : undefined;

  const causeParam =
    heroMode === "cause"
      ? causeCategory && causeSubcategory
        ? `${causeCategory}::${causeSubcategory}`
        : causeCategory
        ? String(causeCategory)
        : undefined
      : undefined;

  setIsCheckingOut(true);

  try {
    await startCheckout({
      amount:
        selectedTierId === "custom"
          ? Number(customAmount)
          : Number((selectedTier as any).amount),
      frequency,
      mode,
      tierId:
        selectedTierId === "custom" ? "custom" : String((selectedTier as any).id),

      club,
      clubCountry:
        heroMode === "drama-club" && !club ? selectedClubCountry ?? undefined : undefined,

      artistFocus: artistFocusParam,

      cause: causeParam,
      causeCategory: causeCategory ? String(causeCategory) : undefined,
      causeSubcategory: causeSubcategory ? String(causeSubcategory) : undefined,

      production,
      project,

      contextLabel: sponsorCopy.headline,
      checkoutTitle,
    });
  } catch (e: any) {
    setError(e?.message || "Network error starting checkout.");
    setIsCheckingOut(false);
  }
}, [
  selectedTierId,
  customAmount,
  selectedTier,
  frequency,
  mode,
  club,
  selectedClubCountry,
  production,
  project,
  causeCategory,
  causeSubcategory,
  checkoutTitle,
  sponsorCopy.headline,
  heroMode,
  artistFocus,
]);



  // ---------- CAUSE LIST STATE ----------
  const [openCauseCat, setOpenCauseCat] = useState<DramaClubCauseCategory | null>(
    (initialCause.category as any) ?? null
  );

  useEffect(() => {
    if (heroMode !== "cause") return;
    if (causeCategory) setOpenCauseCat(causeCategory);
  }, [heroMode, causeCategory]);

  // ---------- CLUB LIST STATE ----------
  const clubsByCountry = useMemo(() => {
    const map = new Map<string, DonationSelectOption[]>();

    clubOptions.forEach((c) => {
      const country = optionCountry(c);
      const arr = map.get(country) ?? [];
      arr.push(c);
      map.set(country, arr);
    });

    for (const [country, arr] of map.entries()) {
      arr.sort((a, b) => {
        const ca = optionCity(a) ?? "";
        const cb = optionCity(b) ?? "";
        if (ca !== cb) return ca.localeCompare(cb);
        return String((a as any)?.label ?? "").localeCompare(
          String((b as any)?.label ?? "")
        );
      });
      map.set(country, arr);
    }

    const countries = Array.from(map.keys()).sort((a, b) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return a.localeCompare(b);
    });

    return { map, countries };
  }, [clubOptions]);

  const [openClubCountry, setOpenClubCountry] = useState<string | null>(() => {
    if (initial.clubCountry) return initial.clubCountry;
    return null;
  });

// ✅ Updated setModeFromLeftLink (no `as any`, explicit mapping, consistent resets)
const setModeFromLeftLink = useCallback(
  (
    id:
      | "drama_club"
      | "artist"
      | "new_work"
      | "special_project"
      | "cause"
      | "story"
  ) => {
    const nextMode: DonationModeId =
      id === "story"
        ? "general"
        : id === "drama_club"
        ? "drama-club"
        : id === "new_work"
        ? "new-work"
        : id === "special_project"
        ? "special-project"
        : id === "artist"
        ? "artist"
        : "cause";

    // mirror pill behavior + reset context that doesn't belong
    setError(null);
    setSelectedTierId(undefined);
    setCustomAmount(null);

    if (nextMode !== "drama-club") {
      setClub(undefined);
      setSelectedClubCountry(null);
      setOpenClubCountry(null);
    }

    if (nextMode !== "artist") {
  setArtistFocus("all");
}

    if (nextMode !== "cause") {
      setAllCauses(true);
      setCauseCategory(undefined);
      setCauseSubcategory(undefined);
      setOpenCauseCat(null);
    }

    if (nextMode !== "new-work") {
      setAllNewWorks(true);
      setProduction(undefined);
    }

    if (nextMode !== "special-project") {
      setAllSpecialProjects(true);
      setProject(undefined);
    }

    const nextCampaign = getDonationCampaign({
      mode: nextMode,
      causeCategory: undefined,
      clubSlug: undefined,
      productionSlug: undefined,
      specialProjectId: undefined,
      activeProductions,
      activeSpecialProjects,
      activeClubs: clubOptions,
    });

    setMode(nextMode);
    setFrequency(nextCampaign.defaultFrequency);
  },
  [
    activeProductions,
    activeSpecialProjects,
    clubOptions,
    setMode,
    setFrequency,
  ]
);


  // When a specific club is selected, open + select its country bucket.
  useEffect(() => {
    if (heroMode !== "drama-club") return;
    if (!club) return;

    const hit = clubOptions.find((c: any) => String(c.id) === club);
    const country = hit ? optionCountry(hit) : clubFromMapId(club)?.country;
    if (!country) return;

    setSelectedClubCountry(country);
    setOpenClubCountry(country);
  }, [heroMode, club, clubOptions]);

  // ✅ “ALL DRAMA CLUBS WE SUPPORT” behaves like a Select-All (no specifics)
  const allClubsSelected = useMemo(
    () => heroMode === "drama-club" && !club && !selectedClubCountry,
    [heroMode, club, selectedClubCountry]
  );

  // ---------- PRODUCTION / PROJECT SEARCH ----------
  const [prodSearch, setProdSearch] = useState("");
  const [projSearch, setProjSearch] = useState("");

  const productionOptions = useMemo(() => {
    const q = prodSearch.trim().toLowerCase();
    if (!q) return activeProductions;
    return activeProductions.filter((p: any) =>
      String(p.label ?? "").toLowerCase().includes(q)
    );
  }, [activeProductions, prodSearch]);

  const projectOptions = useMemo(() => {
    const q = projSearch.trim().toLowerCase();
    if (!q) return activeSpecialProjects;
    return activeSpecialProjects.filter((p: any) =>
      String(p.label ?? "").toLowerCase().includes(q)
    );
  }, [activeSpecialProjects, projSearch]);

  const selectedAmountText = useMemo(() => {
  if (!selectedTierId) return null;

  if (selectedTierId === "custom") {
    if (!customAmount || customAmount <= 0) return null;
    const amt = formatMoney(Number(customAmount));
    return frequency === "monthly" ? `${amt}/mo` : amt;
  }

  if (!selectedTier) return null;
  const amt = formatMoney(Number((selectedTier as any).amount));
  return frequency === "monthly" ? `${amt}/mo` : amt;
}, [selectedTierId, selectedTier, customAmount, frequency]);

const ctaDisabled =
  isCheckingOut ||
  !selectedTierId ||
  (selectedTierId !== "custom" && !selectedTier) ||
  (selectedTierId === "custom" && (!customAmount || customAmount <= 0));


  const cancelTierTitle =
  selectedTierId === "custom"
    ? "Custom amount"
    : (selectedTier as any)?.title ?? (selectedTierId ?? "—");

  const cancelAmountText =
  selectedTierId === "custom"
    ? customAmount && customAmount > 0
      ? frequency === "monthly"
        ? `${formatMoney(Number(customAmount))}/mo`
        : formatMoney(Number(customAmount))
      : "—"
    : selectedTier && selectedTierId
    ? frequency === "monthly"
      ? `${formatMoney(Number((selectedTier as any).amount))}/mo`
      : formatMoney(Number((selectedTier as any).amount))
    : "—";


  const receiptTierLabel = useMemo(() => {
    if (!receipt?.tierId) return null;
    return (
      (tiers as any[]).find((t: any) => String(t.id) === receipt.tierId)?.title ??
      receipt.tierId
    );
  }, [receipt?.tierId, tiers]);

  const receiptContextText = useMemo(() => {
  if (!receipt?.contextType && !receipt?.contextId) return null;

  // ✅ normalize (handles weird casing/spacing)
  const t = (receipt?.contextType ?? "").trim().toLowerCase();
  const rawId = (receipt?.contextId ?? "").trim();
  const typeLabel = t ? prettyContextType(t) : "Context";

  // ✅ special-case: drama club country bucket
  const COUNTRY_PREFIX = "country::";
  const isClubCountryBucket =
    t === "drama_club" && rawId.toLowerCase().startsWith(COUNTRY_PREFIX);
  const id = isClubCountryBucket ? rawId.slice(COUNTRY_PREFIX.length) : rawId;

  if (!id) return `${typeLabel}`;

    if (t === "artist") {
  const focus = parseArtistFocus(id);
  return `Artist Focus: ${prettyArtistFocus(focus)}`;
}
    
    if (t === "cause") {
      const parsed = parseCause(id);
      const cat = parsed.category;
      const sub = parsed.subcategory;

      const catMeta = cat
        ? (CAUSE_CATEGORIES as any[]).find((c) => c.id === cat)
        : undefined;
      const catLabel =
        (catMeta as any)?.shortLabel ??
        (catMeta as any)?.label ??
        (cat ? String(cat) : "");

      if (sub && cat) {
        const subs = ((CAUSE_SUBCATEGORIES_BY_CATEGORY as any)[cat] ?? []) as any[];
        const subMeta = subs.find((s) => s.id === sub);
        const subLabel = (subMeta as any)?.label ?? String(sub);
        return `Cause: ${subLabel}`;
      }

      if (catLabel) return `Cause: ${catLabel}`;
      return `Cause: ${titleizeLoose(id)}`;
    }

    if (t === "drama_club") {
  // country bucket: "country::Ecuador" → "Drama Clubs: Ecuador"
  if (isClubCountryBucket) {
    const country = id; // already sliced
    return country
      ? `Drama Clubs: ${titleizeLoose(country)}`
      : "Drama Clubs: Around the World";
  }

  // specific club slug → label lookup
  const hit = clubOptions.find((c: any) => String(c.id) === id)?.label;
  return `Drama Club: ${hit ?? titleizeLoose(id)}`;
}


    if (t === "production") {
      const hit = activeProductions.find((p: any) => String(p.id) === id)?.label;
      return `Production: ${hit ?? titleizeLoose(id)}`;
    }

    if (t === "special_project") {
      const hit = activeSpecialProjects.find((p: any) => String(p.id) === id)?.label;
      return `Special Project: ${hit ?? titleizeLoose(id)}`;
    }

    if (t === "campaign") {
      const nice = id === "sponsor-the-story" ? "Sponsor the Story" : titleizeLoose(id);
      return `Campaign: ${nice}`;
    }

    return `${typeLabel}: ${titleizeLoose(id)}`;
  }, [receipt, clubOptions, activeProductions, activeSpecialProjects]);

  // ---------- LAYOUT ZONE: JSX & classNames (safe to reskin) ----------

  return (
    <main className="donation-page donatePage">
      {/* Full-bleed hero above the card */}
      <DonationHero
        src={heroSrc}
        alt={heroAlt}
        headline={heroHeadline}
        body={heroBody}
      />

      {/* Kraft-paper background handled by .donation-page in donationPage.css */}
      <div className="donation-page__inner">
        <section className="donation-page__card">
          {/* ========================= BODY ========================= */}
          <section className="donateBody" aria-label="Donation controls">
            <div className="donateColumn">
              {/* ✅ RETURN CARD (success / cancel) */}
              {showReturnCard ? (
                <section
                  className="donateReturnCard"
                  aria-label="Checkout result"
                  data-kind={checkoutKind ?? "success"}
                >
                  <div className="donateReturnTopbar">
                    <div className="donateReturnKicker font-sans">
                      {checkoutKind === "success"
                        ? "DONATION COMPLETE"
                        : "CHECKOUT CANCELED"}
                    </div>

                    <button
                      type="button"
                      className="donateReturnClose donateFocusRing"
                      onClick={dismissReturnCard}
                      aria-label="Dismiss"
                      title="Dismiss"
                    >
                      ×
                    </button>
                  </div>

                  <div className="donateReturnBody">
                    {checkoutKind === "success" ? (
                      <>
                        <h2 className="donateReturnTitle font-grotesk">
                          {receipt?.mode === "subscription"
                            ? "Thank you for your monthly gift."
                            : "Thank you."}
                        </h2>

                  <div className="donateReturnSub font-sans">
                    {receipt?.mode === "subscription" ? (
                      <p className="donateReceiptHelp font-sans">
                        Need to change or cancel your monthly sponsorship? Email{" "}
                        <a className="donateReceiptHelpLink" href="mailto:support@dramaticadventure.com">
                          support@dramaticadventure.com
                        </a>
                        .
                      </p>
                    ) : null}
                  </div>


                        <p className="donateReturnSub font-sans">
                          {receipt ? (
                            receipt.mode === "subscription" ? (
                              <span className="donateSubActive">Your subscription is active.</span>
                            ) : receipt.paymentStatus === "paid" ? (
                              "Your donation is confirmed."
                            ) : (
                              "Your donation is processing."
                            )
                          ) : receiptError ? (
                            "We couldn’t load the receipt details yet — your gift may still be confirmed in Stripe."
                          ) : (
                            "Loading your receipt…"
                          )}
                        </p>


                        <div className="donateReturnRefRow">
                          <div className="donateReturnRefLabel font-sans">
                            Receipt reference
                          </div>
                          <div className="donateReturnRefValue font-sans">
                            {returnSessionId ?? "—"}
                          </div>
                        </div>

                        {receiptError ? (
                          <div className="donateReturnAlert font-sans">
                            {receiptError}
                            <div className="donateReturnAlertActions">
                              <button
                                type="button"
                                className="donateReturnBtn donateFocusRing font-sans"
                                onClick={() => void fetchReceipt()}
                                disabled={isReceiptLoading}
                              >
                                {isReceiptLoading ? "Retrying…" : "Retry"}
                              </button>
                            </div>
                          </div>
                        ) : null}

                        {receipt ? (
                          <div className="donateReturnGrid">
                            <div className="donateReturnRow">
                              <span className="donateReturnKey font-sans">
                                Frequency
                              </span>
                              <span className="donateReturnVal font-sans">
                                {receipt.mode === "subscription"
                                  ? "Monthly"
                                  : "One-time"}
                              </span>
                            </div>

                            <div className="donateReturnRow">
                              <span className="donateReturnKey font-sans">
                                Amount
                              </span>
                              <span className="donateReturnVal font-sans">
                                {formatMoneyMinor(
                                  receipt.amountMinor,
                                  receipt.currency
                                )}
                              </span>
                            </div>

                            {receiptContextText ? (
                              <div className="donateReturnRow">
                                <span className="donateReturnKey font-sans">
                                  Context
                                </span>
                                <span className="donateReturnVal font-sans">
                                  {receiptContextText}
                                </span>
                              </div>
                            ) : null}

                            {receipt.tierId && (
                              <div className="donateReturnRow">
                                <span className="donateReturnKey font-sans">
                                  Tier
                                </span>
                                <span className="donateReturnVal font-sans">
                                  {receiptTierLabel ?? receipt.tierId}
                                </span>
                              </div>
                            )}

                            {receipt.donorEmail && (
                              <div className="donateReturnRow">
                                <span className="donateReturnKey font-sans">
                                  Email
                                </span>
                                <span className="donateReturnVal font-sans">
                                  {receipt.donorEmail}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : null}

                        {receipt?.hostedInvoiceUrl || receipt?.invoicePdf ? (
                          <div className="donateReturnActions">
                            {receipt.hostedInvoiceUrl ? (
                              <a
                                className="donateReturnBtn donateFocusRing font-sans"
                                href={receipt.hostedInvoiceUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View invoice
                              </a>
                            ) : null}
                            {receipt.invoicePdf ? (
                              <a
                                className="donateReturnBtn donateFocusRing font-sans"
                                href={receipt.invoicePdf}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Invoice PDF
                              </a>
                            ) : null}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <h2 className="donateReturnTitle font-grotesk">
                          Checkout canceled.
                        </h2>
                        <p className="donateReturnSub font-sans">
                          Nothing was charged. You can adjust your sponsorship and try
                          again anytime.
                        </p>

                        <div className="donateReturnGrid">
                          <div className="donateReturnRow">
                            <span className="donateReturnKey font-sans">
                              You were sponsoring
                            </span>
                            <span className="donateReturnVal font-sans">
                              {sponsorCopy.headline}
                            </span>
                          </div>

                          <div className="donateReturnRow">
                            <span className="donateReturnKey font-sans">
                              Frequency
                            </span>
                            <span className="donateReturnVal font-sans">
                              {frequency === "monthly" ? "Monthly" : "One-time"}
                            </span>
                          </div>

                          <div className="donateReturnRow">
                            <span className="donateReturnKey font-sans">Tier</span>
                            <span className="donateReturnVal font-sans">
                              {cancelTierTitle}
                            </span>
                          </div>

                          <div className="donateReturnRow">
                            <span className="donateReturnKey font-sans">Amount</span>
                            <span className="donateReturnVal font-sans">
                              {cancelAmountText}
                            </span>
                          </div>
                        </div>

                        <div className="donateReturnActions">
                          <button
                            type="button"
                            className="donateReturnBtn donateFocusRing font-sans"
                            onClick={tryAgainFromCancel}
                          >
                            Try again
                          </button>
                          <button
                            type="button"
                            className="donateReturnBtn donateFocusRing font-sans"
                            onClick={dismissReturnCard}
                          >
                            Dismiss
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </section>
              ) : null}

              {/* ✅ Kraft-paper dynamic heading centered above dashboard */}
              <section className="donateDynamicHeading isCentered" aria-label="Sponsorship dashboard headline">
  <h2 className="donateDashHeadline font-anton">{dashHeadline}</h2>
  <p className="donateDashSub font-sans">{sponsorCopy.description}</p>
</section>


              {/* =========================
                  CHOOSER: mode pills + refine accordions
                 ========================= */}
              <section
                className="donateDash"
                aria-label="Choose your sponsorship focus"
              >
                {/* ✅ Toggle band */}
<div className="donateDashToggleBand">
  <div className="donateModeWrapper">
    <div className="donateModeRow" role="tablist" aria-label="Donation focus">
      <span className="donateModeLabel font-sans">Sponsor:</span>

      <div className="donateChipRow">
        {safeModeNavList().map((m) => {
          const pillLabel =
            MODE_PILL_LABELS[m] ?? DONATION_MODE_LABELS[m] ?? m.replace(/-/g, " ");

          const active =
            m === mode ||
            (m === "new-work" && mode === "new-work-specific") ||
            (m === "special-project" && mode === "special-project-specific");

          return (
  <button
    key={m}
    type="button"
    className="donateChip donateFocusRing"
    data-mode={m}
    data-active={active ? "true" : "false"}
    aria-pressed={active}
    onClick={() => {
      // ✅ Hard reset tier selection any time we change modes
      setError(null);
      setSelectedTierId(undefined);
      setCustomAmount(null);

      // ✅ Reset context that doesn't belong to the next mode
      if (m !== "drama-club") {
        setClub(undefined);
        setSelectedClubCountry(null);
        setOpenClubCountry(null);
      }

      if (m !== "artist") {
        setArtistFocus("all");
      }

      if (m !== "cause") {
        setAllCauses(true);
        setCauseCategory(undefined);
        setCauseSubcategory(undefined);
        setOpenCauseCat(null);
      }

      if (m !== "new-work") {
        setAllNewWorks(true);
        setProduction(undefined);
      }

      if (m !== "special-project") {
        setAllSpecialProjects(true);
        setProject(undefined);
      }

      // ✅ Pull default frequency for the next mode (keeps things consistent)
      const nextCampaign = getDonationCampaign({
        mode: m,
        causeCategory: undefined,
        clubSlug: undefined,
        productionSlug: undefined,
        specialProjectId: undefined,
        activeProductions,
        activeSpecialProjects,
        activeClubs: clubOptions,
      });

      setMode(m);
      setFrequency(nextCampaign.defaultFrequency);
    }}
  >
    <span className="donateChipLabel">{pillLabel}</span>
  </button>
);

        })}
      </div>
    </div>
  </div>
</div>


                {/* ✅ Details band */}
                <div className="donateDashDetailsBand">
                  {heroMode === "artist" ? (
  <div className="donateRefineBlock" aria-label="Choose artist support focus">
    <button
      type="button"
      className="donateOutlineTag donateFocusRing font-sans"
      data-selected={artistFocus === "all" ? "true" : "false"}
      onClick={() => {
        setArtistFocus("all");
        setSelectedTierId(undefined);
        setCustomAmount(null);
      }}
    >
      ALL ARTIST SUPPORT
    </button>

    <div className="donatePillRow donatePillRowDense">
      {ARTIST_FOCUS_OPTIONS.filter((o) => o.id !== "all").map((opt) => {
        const selected = artistFocus === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            className="donatePill donateFocusRing font-sans"
            data-selected={selected ? "true" : "false"}
            onClick={() => {
              setArtistFocus(opt.id);
              setSelectedTierId(undefined);
              setCustomAmount(null);
            }}
            aria-pressed={selected}
            title={opt.blurb}
          >
            {opt.label}
          </button>
        );
      })}
    </div>

    <div className="donateMicroNote font-sans">
      {ARTIST_FOCUS_OPTIONS.find((o) => o.id === artistFocus)?.blurb ??
        "We steward artist support across access, stipends, mentorship, and long-term pathways."}
    </div>
  </div>
) : null}

                  {/* =========================
                      REFINE: Causes (accordion styled same as clubs via CSS)
                     ========================= */}
                  {heroMode === "cause" ? (
                    <div
                      className="donateRefineBlock"
                      aria-label="Choose a cause"
                    >
                     <button
  type="button"
  className="donateOutlineTag donateFocusRing font-sans"
  data-selected={allCauses ? "true" : "false"}
  onClick={() => {
    setAllCauses(true);

    setCauseCategory(undefined);
    setCauseSubcategory(undefined);
    setOpenCauseCat(null);
    setSelectedTierId(undefined);
    setCustomAmount(null);
  }}
>
  ALL CAUSES WE CHAMPION
</button>


                      <div className="donateList" role="list">
                        {(CAUSE_CATEGORIES as any[]).map((cat: any) => {
                          const label = cat.shortLabel || cat.label;
                          const subs =
                            ((CAUSE_SUBCATEGORIES_BY_CATEGORY as any)[cat.id] ??
                              []) as any[];
                          const canOpen = subs.length > 0;
                          const isOpen = openCauseCat === cat.id;

                          const bucketSelected =
                            causeCategory === (cat.id as any) && !causeSubcategory;

                          return (
                            <div
                              key={cat.id}
                              className="donateListItem"
                              role="listitem"
                              data-open={isOpen ? "true" : "false"}
                            >
                              <button
                                type="button"
                                className="donateListRow donateFocusRing"
                                data-selected={bucketSelected ? "true" : "false"}
                                aria-expanded={isOpen}
                                onClick={() => {
  // TURN OFF ALL when selecting a specific category
  setAllCauses(false);

  setCauseCategory(cat.id);
  setCauseSubcategory(undefined);
  setSelectedTierId(undefined);
  setCustomAmount(null);


  if (!canOpen) {
    setOpenCauseCat(null);
    return;
  }
  setOpenCauseCat((prev) =>
    prev === cat.id ? null : (cat.id as any)
  );
}}

                              >
                                <span className="donateClubCountryName font-sans">
                                  {label}
                                </span>
                                <span
                                  className="donateClubCountryChevron"
                                  aria-hidden="true"
                                >
                                  {isOpen ? "−" : "+"}
                                </span>
                              </button>

                              {isOpen && canOpen ? (
                                <div className="donateListBody">
                                  <div className="donatePillRow">
                                    {subs.map((s: any) => {
                                      const selected = causeSubcategory === s.id;
                                      return (
                                        <button
                                          key={s.id}
                                          type="button"
                                          className="donatePill donateFocusRing font-sans"
                                          data-selected={selected ? "true" : "false"}
                                          onClick={() => {
  // Turn off ALL
  setAllCauses(false);

  setCauseCategory(cat.id);
  setCauseSubcategory(selected ? undefined : (s.id as any));
  setSelectedTierId(undefined);
  setCustomAmount(null);

}}

                                        >
                                          {s.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>

                      <div className="donateMicroNote font-sans">
                        IF YOU DON’T CHOOSE A SPECIFIC CAUSE, WE’LL STEWARD FUNDS TO THE
                        MOST PRESSING CONCERNS.
                      </div>
                    </div>
                  ) : null}

                  {/* =========================
                      REFINE: Drama Clubs by Country (accordion)
                     ========================= */}
                  {heroMode === "drama-club" ? (
                    <div
                      className="donateRefineBlock"
                      aria-label="Choose a drama club"
                    >
                      <button
                        type="button"
                        className="donateOutlineTag donateFocusRing font-sans"
                        data-selected={allClubsSelected ? "true" : "false"}
                        onClick={() => {
                          setMode("drama-club");
                          setClub(undefined);
                          setSelectedClubCountry(null);
                          setSelectedTierId(undefined);
                          setCustomAmount(null);
                          setOpenClubCountry(null);
                        }}
                      >
                        ALL DRAMA CLUBS WE SUPPORT
                      </button>

                      {clubsByCountry.countries.length === 0 ? (
                        <div className="donateMicroNote font-sans">
                          NO ACTIVE DRAMA CLUBS LISTED—YOUR GIFT STEWARDS ACROSS THE
                          NETWORK.
                        </div>
                      ) : (
                        <div className="donateList" role="list">
                          {clubsByCountry.countries.map((country) => {
                            const items = clubsByCountry.map.get(country) ?? [];
                            const isOpen = openClubCountry === country;

                            const bucketSelected =
                              selectedClubCountry === country && !club;

                            return (
                              <div
                                key={country}
                                className="donateListItem"
                                role="listitem"
                                data-open={isOpen ? "true" : "false"}
                              >
                                <button
                                  type="button"
                                  className="donateListRow donateFocusRing"
                                  data-selected={bucketSelected ? "true" : "false"}
                                  aria-expanded={isOpen}
                                  onClick={() => {
                                    setMode("drama-club");
                                    setClub(undefined);
                                    setSelectedTierId(undefined);
                                    setCustomAmount(null);


                                    setSelectedClubCountry((prev) =>
                                      prev === country ? null : country
                                    );
                                    setOpenClubCountry((prev) =>
                                      prev === country ? null : country
                                    );
                                  }}
                                >
                                  <span className="donateClubCountryName font-sans">
                                    {country}
                                  </span>
                                  <span
                                    className="donateClubCountryChevron"
                                    aria-hidden="true"
                                  >
                                    {isOpen ? "−" : "+"}
                                  </span>
                                </button>

                                {isOpen ? (
                                  <div className="donateListBody">
                                    <div className="donatePillRow donatePillRowDense">
                                      {items.map((c: any) => {
                                        const selected = club === c.id;
                                        const city = optionCity(c);

                                        return (
                                          <button
                                            key={c.id}
                                            type="button"
                                            className="donateClubPill donateFocusRing font-sans"
                                            data-selected={selected ? "true" : "false"}
                                            onClick={() => {
                                              const next = selected
                                                ? undefined
                                                : String(c.id);
                                              setClub(next);
                                              setSelectedTierId(undefined);
                                              setCustomAmount(null);
                                              setMode("drama-club");
                                              setSelectedClubCountry(country);
                                            }}
                                          >
                                            <span className="donateClubLabel">
                                              {c.label}
                                            </span>
                                            {city ? (
                                              <span className="donateClubMeta">
                                                {city}
                                              </span>
                                            ) : null}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="donateMicroNote font-sans">
                        IF YOU DON’T CHOOSE A SPECIFIC CLUB OR COUNTRY, WE’LL STEWARD
                        FUNDS ACROSS THE NETWORK.
                      </div>
                    </div>
                  ) : null}

                  {/* =========================
                      REFINE: New Work
                     ========================= */}
                  {heroMode === "new-work" ? (
                    <div
                      className="donateRefineBlock"
                      aria-label="Choose a production"
                    >
                      <button
  type="button"
  className="donateOutlineTag donateFocusRing font-sans"
  data-selected={allNewWorks ? "true" : "false"}
  onClick={() => {
    // Select ALL
    setAllNewWorks(true);

    // Reset specifics
    setProduction(undefined);
    setSelectedTierId(undefined);
    setCustomAmount(null);

    setMode("new-work");
    const c2 = getDonationCampaign({
      mode: "new-work",
      activeProductions,
      activeSpecialProjects,
      activeClubs: clubOptions,
    });
    setFrequency(c2.defaultFrequency);
  }}
>
  ALL NEW WORKS IN DEVELOPMENT
</button>


                      {activeProductions.length === 0 ? (
                        <div className="donateMicroNote font-sans">
                          NO ACTIVE PRODUCTIONS LISTED—YOUR GIFT FUNDS FUTURE NEW WORKS.
                        </div>
                      ) : (
                        <>
                          <input
                            className="donateSearchInline donateFocusRing font-sans"
                            placeholder="Search productions…"
                            value={prodSearch}
                            onChange={(e) => setProdSearch(e.target.value)}
                            aria-label="Search productions"
                          />

                          <div className="donatePillRow donatePillRowDense">
                            {productionOptions.slice(0, 80).map((p: any) => {
                              const selected = production === p.id;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  className="donatePill donateFocusRing font-sans"
                                  data-selected={selected ? "true" : "false"}
                                  onClick={() => {
  const next = selected ? undefined : String(p.id);

  // Turning off ALL when selecting a specific item
  setAllNewWorks(!next ? true : false);

  setProduction(next);
  setSelectedTierId(undefined);
  setCustomAmount(null);


  if (next) {
    setMode("new-work-specific");
    setFrequency("one_time");
  } else {
    setMode("new-work");
    const c2 = getDonationCampaign({
      mode: "new-work",
      activeProductions,
      activeSpecialProjects,
      activeClubs: clubOptions,
    });
    setFrequency(c2.defaultFrequency);
  }
}}

                                >
                                  {p.label}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  ) : null}

                  {/* =========================
                      REFINE: Special Projects
                     ========================= */}
                  {heroMode === "special-project" ? (
                    <div
                      className="donateRefineBlock"
                      aria-label="Choose a special project"
                    >
                      <button
  type="button"
  className="donateOutlineTag donateFocusRing font-sans"
  data-selected={allSpecialProjects ? "true" : "false"}
  onClick={() => {
    setAllSpecialProjects(true);

    setProject(undefined);
    setSelectedTierId(undefined);
    setCustomAmount(null);
    setMode("special-project");

    const c2 = getDonationCampaign({
      mode: "special-project",
      activeProductions,
      activeSpecialProjects,
      activeClubs: clubOptions,
    });
    setFrequency(c2.defaultFrequency);
  }}
>
  ALL SPECIAL PROJECTS IN PROGRESS
</button>


                      {activeSpecialProjects.length === 0 ? (
                        <div className="donateMicroNote font-sans">
                          NO ACTIVE PROJECTS LISTED—YOUR GIFT FUNDS FUTURE SPECIAL
                          PROJECTS.
                        </div>
                      ) : (
                        <>
                          <input
                            className="donateSearchInline donateFocusRing font-sans"
                            placeholder="Search projects…"
                            value={projSearch}
                            onChange={(e) => setProjSearch(e.target.value)}
                            aria-label="Search special projects"
                          />

                          <div className="donatePillRow donatePillRowDense">
                            {projectOptions.slice(0, 80).map((p: any) => {
                              const selected = project === p.id;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  className="donatePill donateFocusRing font-sans"
                                  data-selected={selected ? "true" : "false"}
                                  onClick={() => {
  const next = selected ? undefined : String(p.id);

  setAllSpecialProjects(!next ? true : false);

  setProject(next);
  setSelectedTierId(undefined);
  setCustomAmount(null);


  if (next) {
    setMode("special-project-specific");
    setFrequency("one_time");
  } else {
    setMode("special-project");
    const c2 = getDonationCampaign({
      mode: "special-project",
      activeProductions,
      activeSpecialProjects,
      activeClubs: clubOptions,
    });
    setFrequency(c2.defaultFrequency);
  }
}}

                                >
                                  {p.label}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  ) : null}

                  {/* ✅ Only two transparent chips */}
                  <div className="donateDashBottomRow">
                    <span className="donateSummaryPill">
                      {bottomSummaryPrimary}
                    </span>
                    <span className="donateSummaryPill donateSummaryPillSoft">
                      FUND MOMENTS, NOT MAINTENANCE
                    </span>
                  </div>
                </div>
              </section>

             {/* =========================
   TIERS AREA: 2-column container (LEFT = your content, RIGHT = tiers+CTA)
   ========================= */}
<section className="donateTierArea section-block" aria-label="Sponsorship tiers area">
    

  <div className="donateTierTwoCol">
    {/* LEFT COLUMN */}
    <div className="donateTierTwoColLeft" aria-label="Sponsorship details">
      <div className="donateLeftInner">
        <div className="donateLeftImageWrap">
          <Image
            src={leftContent.imageSrc}
            alt={leftContent.imageAlt}
            width={900}
            height={500}
            className="donateLeftImage"
          />
        </div>

        {/* Title (Space Grotesk) */}
        <h3
          className="donateLeftTitle"
          style={{
            margin: "18px 0 10px 0",
            fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
            fontSize: "clamp(1.35rem, 2.4vw, 2rem)",
            letterSpacing: ".12em",
            textTransform: "uppercase",
            fontWeight: 900,
            color: "#241123",
            lineHeight: 1.15,
          }}
        >
          {leftContent.title}
        </h3>

        {/* Body (Space Grotesk) */}
        <p className="donateLeftDesc">
          {leftContent.description}
        </p>

        <hr className="donateLeftRule" />

        {/* ✅ HEADINGS: force DM Sans via donateLeftSectionHead */}
        <h4 className="donateLeftSectionHead">{leftContent.section1Title}</h4>

        {String(leftContent.section1Body ?? "")
          .split("\n\n")
          .filter(Boolean)
          .map((para, i) => (
            <p key={i} className="donateLeftP" style={{ marginTop: i === 0 ? 0 : 16 }}>
              {para}
            </p>
          ))}

        <hr className="donateLeftRule" />

        <h4 className="donateLeftSectionHead">{leftContent.section2Title}</h4>

        <ul className="donateLeftList">
          {(leftContent.section2Bullets ?? []).map((b, i) => (
            <li key={`${i}-${b}`}>{b}</li>
          ))}
        </ul>

        <hr className="donateLeftRule" />

        <h4 className="donateLeftSectionHead">{leftContent.section3Title}</h4>

        <ul className="donateLeftList">
          {(leftContent.section3Bullets ?? []).map((b, i) => (
            <li key={`${i}-${b}`}>{b}</li>
          ))}
        </ul>

        {leftContent.section3Note ? (
          <p className="donateLeftNote" style={{ marginTop: 16 }}>
            {leftContent.section3Note}
          </p>
        ) : null}

        <hr className="donateLeftRule" />

        <h4 className="donateLeftSectionHead">{leftContent.section4Title}</h4>

        {leftContent.section4Body ? (
          <p className="donateLeftP" style={{ marginTop: 16 }}>
            {leftContent.section4Body}
          </p>
        ) : null}

        {(leftContent.modeLinks ?? []).length ? (
          <nav className="donateLeftModeLinks" aria-label="Other sponsorship modes">
            {(leftContent.modeLinks ?? []).map((l) => (
              <button
                key={l.id}
                type="button"
                className="donateLeftModeLink donateFocusRing"
                onClick={() => setModeFromLeftLink(l.id)}
              >
                {l.label} <span aria-hidden>→</span>
              </button>
            ))}
          </nav>
        ) : null}
      </div>
    </div>

    {/* RIGHT COLUMN (tiers rail) */}
    <aside className="donateTierTwoColRight" aria-label="Sponsorship tiers">
      
      
      {/* =========================
          TIERS + frequency toggle
         ========================= */}
      <section className="donateTierSection" aria-label="Choose a tier">
        <div className="donateTierHeaderRow">
          <div className="donateTierHeaderLeft">
            <div className="donateSectionLabel donateSectionLabelInk productionSectionLabel productionSectionLabelInk font-sans">
              Choose your sponsorship level
            </div>
          </div>

{(() => {
  return (
    <div
      className="donateSeg donateSegOnPaper donateSegLightTabs donateFocusRing"
      role="group"
      aria-label="Donation frequency"
      data-value={frequency}
    >
      <button
        type="button"
        className="donateSegBtn donateSegTab font-sans"
        data-active={frequency === "monthly" ? "true" : "false"}
        onClick={() => {
          if (mode === "new-work-specific" || mode === "special-project-specific") {
            setFrequency("one_time");
            setSelectedTierId(undefined);
            setCustomAmount(null);
            return;
          }
          setFrequency("monthly");
          setSelectedTierId(undefined);
          setCustomAmount(null);
        }}
      >
        Monthly
      </button>

      <button
        type="button"
        className="donateSegBtn donateSegTab font-sans"
        data-active={frequency === "one_time" ? "true" : "false"}
        onClick={() => {
          setFrequency("one_time");
          setSelectedTierId(undefined);
          setCustomAmount(null);
        }}
      >
        One-time
      </button>
    </div>
  );
})()}





  </div>
{frequency === "monthly" ? (
  <div className="donateHelperText font-sans">
    Need to change or cancel your monthly sponsorship? Email{" "}
    <a className="donateLink" href="mailto:support@dramaticadventure.com">
      support@dramaticadventure.com
    </a>
    .
  </div>
) : null}


  {/* ✅ IMPORTANT: Custom tile lives INSIDE the grid */}
  <div className="donateTierGrid" ref={tierGridRef}>
    {tiers.map((t: any, i: number) => {
      const isSelected = String(t.id) === selectedTierId;

      const tFreq =
        (t.frequency as DonationFrequency | undefined) ?? frequency;

      const amountNum = Number(t.amount);
      const isMonthly = tFreq === "monthly";
      const amountMain = formatMoney(amountNum);

      const ctx = refContextCode(heroMode);

      const ref = `DAT-${ctx}-${tFreq === "monthly" ? "M" : "1X"}-${String(
        i + 1
      ).padStart(2, "0")}-${Math.round(amountNum)}`;

      const metaLine =
        tFreq === "monthly" ? "Sustaining sponsorship" : "One-time sponsorship";

      const note =
        tFreq === "monthly"
          ? "Renews monthly. Cancel anytime • 501(c)(3) • Donations are tax-deductible"
          : "Receipt issued automatically • 501(c)(3) • Donations are tax-deductible";


          
      return (
        <button
          key={String(t.id)}
          type="button"
          className="donateTierCard donateTierPass donateFocusRing"
          data-selected={isSelected ? "true" : "false"}
          data-featured={t.featured ? "true" : "false"}
          onClick={() => {
  setError(null);
  setSelectedTierId(String(t.id));
  setTimeout(scrollToCtaIfNeeded, 0);
}}

          aria-pressed={isSelected}
        >
          <div className="donateTierPassGrid">
            {/* LEFT: Main content */}
            <div className="donateTierPassMain">
              <div className="donateTierPassHeader">
                <div className="donateTierPassAmount font-anton">
                  <span className="donateTierPassAmountMain">{amountMain}</span>
                  {isMonthly ? (
                    <span className="donateTierPassAmountSuffix">/mo</span>
                  ) : null}
                </div>

                {/* Title + description below amount */}
                <div className="donateTierPassTitleBlock">
                  <div className="donateTierTitle font-sans">{t.title}</div>
                  <div className="donateTierEyebrow font-sans">{t.eyebrow}</div>
                </div>
              </div>

              {t.bullets?.length ? (
                <ul className="donateTierBullets donateTierBulletsTight font-sans">
                  {t.bullets.slice(0, 3).map((b: any, idx: number) => {
                    const text = typeof b === "string" ? b : String(b?.text ?? "");
                    const subs: string[] =
                      typeof b === "string" ? [] : (b?.subPoints ?? b?.subs ?? []);

                    return (
                      <li key={idx}>
                        {text}
                        {subs?.length ? (
                          <ul className="donateTierSubBullets">
                            {subs.map((s, j) => (
                              <li key={j}>{String(s)}</li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              {/* Mobile-only: micro legitimacy strip */}
              <div className="donateTierPassMetaStrip font-sans">
                <span className="donateTierPassRef">{ref}</span>
                <span className="donateTierPassMeta">{metaLine}</span>
              </div>
            </div>

            



            {/* RIGHT: Micro legitimacy panel */}
            <div className="donateTierPassSide" aria-label="Tier details">
              {t.featured ? (
                <div className="donateTierPassSideTag">DAT PICK</div>
              ) : null}

              <div className="donateTierPassSideTop font-sans">
                <div className="donateTierPassSideKicker">REFERENCE</div>
                <div className="donateTierPassSideRef">{ref}</div>
              </div>

              <div className="donateTierPassSideBottom font-sans">
                <div className="donateTierPassSideMeta">{metaLine}</div>
                <div className="donateTierPassSideNote">{note}</div>
              </div>
            </div>
          </div>
        </button>
      );
    })}

        {/* ✅ Custom amount tile (INSIDE grid) */}
<button
  type="button"
  className="donateTierCard donateTierPass donateFocusRing donateTierCustom"
  data-selected={selectedTierId === "custom" ? "true" : "false"}
  data-featured="false"
  aria-pressed={selectedTierId === "custom"}
  onClick={() => {
    setError(null);
    setSelectedTierId("custom");
    setTimeout(scrollToCtaIfNeeded, 0);
  }}
>
  <div className="donateTierPassGrid">
    <div className="donateTierPassMain">
      <div className="donateTierPassHeader">
        <div className="donateTierPassAmount font-anton">
          {/* ✅ keep typography consistent, but avoid giant “Any amount” */}
          {customAmount && customAmount > 0 ? (
            <>
              <span className="donateTierPassAmountMain">
                {formatMoney(Number(customAmount))}
              </span>
              {frequency === "monthly" ? (
                <span className="donateTierPassAmountSuffix">/mo</span>
              ) : null}
            </>
          ) : (
            <>
              <span className="donateTierPassAmountMain font-anton">$</span>
              <span className="donateTierPassAnyAmount font-anton">Any amount</span>
            </>
          )}
        </div>

        <div className="donateTierPassTitleBlock">
          <div className="donateTierTitle font-sans">Choose your amount</div>
          <div className="donateTierEyebrow font-sans">
            Sponsor the story at a scale that’s right for you.
          </div>
        </div>
      </div>

      <input
  type="text"
  className="donateCustomAmountInput font-sans"
  inputMode="numeric"
  pattern="[0-9]*"
  placeholder="$ Amount"
  value={customAmount != null ? String(customAmount) : ""}

  onPointerDown={(e) => e.stopPropagation()}
  onClick={(e) => e.stopPropagation()}
  onFocus={(e) => {
    e.stopPropagation();
    setSelectedTierId("custom");
  }}
  onKeyDown={(e) => {
    e.stopPropagation();

    // ✅ block non-integers
    if ([".", "e", "E", "+", "-", ","].includes(e.key)) e.preventDefault();
  }}
  onChange={(e) => {
    const raw = e.target.value;

    // ✅ digits only
    const digitsOnly = raw.replace(/[^\d]/g, "");
    const normalized = digitsOnly.replace(/^0+(?=\d)/, ""); // keep "0" only if it's the only digit

    const num = normalized ? Number(normalized) : null;
    setCustomAmount(num != null && Number.isFinite(num) ? num : null);
    setSelectedTierId("custom");
  }}
  aria-label="Custom donation amount"
/>


      {/* Mobile-only strip (match other tiles) */}
      <div className="donateTierPassMetaStrip font-sans">
        <span className="donateTierPassRef">DAT-CUSTOM</span>
        <span className="donateTierPassMeta">
          {frequency === "monthly" ? "Sustaining sponsorship" : "One-time sponsorship"}
        </span>
      </div>
    </div>

    <div className="donateTierPassSide" aria-label="Tier details">
      <div className="donateTierPassSideTop font-sans">
        <div className="donateTierPassSideKicker">REFERENCE</div>
        <div className="donateTierPassSideRef">DAT-CUSTOM</div>
      </div>

      <div className="donateTierPassSideBottom font-sans">
        <div className="donateTierPassSideMeta">
          {frequency === "monthly" ? "Sustaining sponsorship" : "One-time sponsorship"}
        </div>
        <div className="donateTierPassSideNote">
          {frequency === "monthly"
            ? "Renews monthly. Cancel anytime • 501(c)(3) • Donations are tax-deductible"
            : "Receipt issued automatically • 501(c)(3) • Donations are tax-deductible"}
        </div>
      </div>
    </div>
  </div>
</button>

    </div>  {/* end donateTierGrid */}
</section> {/* end donateTierSection */}




      {/* CTA stays in RIGHT column */}
      <section className="donateCtaSection" aria-label="Checkout">
        {error ? (
          <div className="donateAlert">
            <div className="donateAlertTitle font-sans">Checkout couldn’t start</div>
            <div className="donateAlertBody font-sans">{error}</div>
            <div className="donateAlertHint font-sans">
              (Expected until STRIPE_SECRET_KEY + webhook are set.)
            </div>
          </div>
        ) : null}

        <button
  ref={ctaBtnRef}   
  type="button"
  disabled={ctaDisabled}
  onClick={() => void beginCheckout()}
  className="donateCtaBtn donateFocusRing font-sans"
  data-disabled={ctaDisabled ? "true" : "false"}
>

  {!selectedTierId
  ? "Select a tier to continue"
  : isCheckingOut
  ? "Starting secure checkout…"
  : selectedAmountText
  ? `Continue — ${selectedAmountText}`
  : "Continue"}
</button>


        <div className="donateCtaMicroStack donateCtaMicroSoft font-sans" role="note" aria-label="Payment security note">
  <div className="donateCtaMicroLine">
    Powered by Stripe. Card info is encrypted and secure.
  </div>
  <div className="donateCtaMicroLine">
    International cards are accepted.
  </div>
</div>



        <div className="donateDebug font-sans">
          {isUrlPending ? "Updating URL…" : null}
        </div>
      </section>
    </aside>
  </div>
</section>
{/* Explore pills (NOT inside the two-column tiers container) */}
<section className="donateExploreSection" aria-label="Explore DAT">
  <div className="donateExploreRow">
    <Link href="https://www.dramaticadventure.com/about" className="donateExplorePill">
      Learn About DAT
    </Link>

    <Link href="/drama-club" className="donateExplorePill">
      Explore Drama Clubs
    </Link>

    <Link href="/alumni" className="donateExplorePill">
      Meet Our Alumni Artists
    </Link>

    <Link href="/theatre" className="donateExplorePill">
      Browse Our Productions
    </Link>

    <Link href="https://www.dramaticadventure.com/get-involved" className="donateExplorePill">
      Join Our Programs
    </Link>
  </div>
</section>

          </div> {/* end donateColumn */}
        </section> {/* end donateBody */}
      </section> {/* end donation-page__card */}
    </div> {/* end donation-page__inner */}
  </main>
  );
}
