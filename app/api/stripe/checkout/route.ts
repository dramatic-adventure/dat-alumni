// app/api/stripe/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHECKOUT_DISPLAY_NAME = "Dramatic Adventure Theatre";
const DEFAULT_CAMPAIGN = "sponsor-the-story";
const DEFAULT_CURRENCY = "usd";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function toAmountMinor(amount: unknown): number | null {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return null;
  const cents = Math.round(amount * 100);
  if (cents <= 0) return null;
  return cents;
}

function humanizeId(input: string) {
  // best-effort server fallback (client should send contextLabel)
  const s = input.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!s) return input;

  return s
    .split(" ")
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function buildFallbackContextLabel(params: { contextType: string; contextId: string | null }) {
  const { contextType, contextId } = params;
  if (!contextType || !contextId) return null;

  if (contextType === "cause") {
    // stored as "category::subcategory" or "category"
    const [cat, sub] = contextId.split("::");
    const best = sub ? humanizeId(sub) : humanizeId(cat);
    return `Cause: ${best}`;
  }

  if (contextType === "drama_club") {
    const prefix = "country::";
    const isCountryBucket = contextId.startsWith(prefix);
    const id = isCountryBucket ? contextId.slice(prefix.length) : contextId;
    return isCountryBucket ? `Drama Clubs: ${humanizeId(id)}` : `Drama Club: ${humanizeId(id)}`;
  }

  if (contextType === "artist") return `Artist Focus: ${humanizeId(contextId)}`;
  if (contextType === "production") return `Production: ${humanizeId(contextId)}`;
  if (contextType === "special_project") return `Project: ${humanizeId(contextId)}`;
  if (contextType === "campaign") return `Campaign: ${humanizeId(contextId)}`;

  return `${humanizeId(contextType)}: ${humanizeId(contextId)}`;
}

function getString(body: any, key: string): string | null {
  const v = body?.[key];
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s : null;
}

function getUtmBundle(body: any) {
  return {
    utmSource: getString(body, "utmSource") ?? getString(body, "utm_source"),
    utmMedium: getString(body, "utmMedium") ?? getString(body, "utm_medium"),
    utmCampaign: getString(body, "utmCampaign") ?? getString(body, "utm_campaign"),
    utmContent: getString(body, "utmContent") ?? getString(body, "utm_content"),
    utmTerm: getString(body, "utmTerm") ?? getString(body, "utm_term"),
    referrer: getString(body, "referrer"),
    landingPath: getString(body, "landingPath") ?? getString(body, "landing_path"),
  };
}

// ✅ Helper: accept multiple client keys for “special project”
function getProjectIdFromBody(body: any): string | null {
  return (
    getString(body, "project") ??
    getString(body, "specialProjectId") ??
    getString(body, "specialProject") ??
    getString(body, "special_project") ??
    getString(body, "specialProjectSlug") ??
    null
  );
}

// ✅ Helper: accept multiple client keys for campaign slug
function getCampaignSlugFromBody(body: any): string | null {
  return (
    getString(body, "campaignSlug") ??
    getString(body, "campaign") ??
    getString(body, "campaign_slug") ??
    null
  );
}

function buildReturnQuery(params: {
  mode?: string | null;
  freq?: string | null;
  tier?: string | null;
  club?: string | null;
  clubCountry?: string | null;
  production?: string | null;
  project?: string | null;
  causeCategory?: string | null;
  causeSubcategory?: string | null;
  artistFocus?: string | null;
}) {
  const qp = new URLSearchParams();

  if (params.mode) qp.set("mode", params.mode);
  if (params.freq) qp.set("freq", params.freq);
  if (params.tier) qp.set("tier", params.tier);

  if (params.club) qp.set("club", params.club);
  if (params.clubCountry) qp.set("clubCountry", params.clubCountry);
  if (params.artistFocus) qp.set("artistFocus", params.artistFocus);
  if (params.production) qp.set("production", params.production);
  if (params.project) qp.set("project", params.project);

  if (params.causeCategory) {
    const cause = params.causeSubcategory
      ? `${params.causeCategory}::${params.causeSubcategory}`
      : params.causeCategory;
    qp.set("cause", cause);
  }

  const qs = qp.toString();
  return qs ? `?${qs}` : "";
}

function buildCheckoutSubmitMessage(contextLabel: string | null) {
  // Stripe won’t let you change the big “Pay …” headline,
  // so we force “Donate to …” right near the CTA.
  if (!contextLabel) return `Donate to ${CHECKOUT_DISPLAY_NAME}`;
  return `Donate to ${CHECKOUT_DISPLAY_NAME} — ${contextLabel}`;
}

function buildDatMetadata(input: {
  donorKey: string | null;

  donorEmail?: string | null;
  donorName?: string | null;

  campaignSlug?: string | null;
  mode?: string | null;

  contextType?: string | null;
  contextId?: string | null;
  contextLabel?: string | null;

  tierId?: string | null;
  tierLabel?: string | null;

  amountType?: "tier" | "custom";
  amountMinor: number;
  currency: string;
  frequency: "one_time" | "monthly";

  // attribution snapshots (pass-through from UI)
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  referrer?: string | null;
  landingPath?: string | null;
}): Record<string, string> {
  const campaign = input.campaignSlug ?? DEFAULT_CAMPAIGN;

  const meta: Record<string, string> = {
    dat_schema: "v1",

    // keep both keys for backward compatibility + grepability
    dat_campaign: campaign,
    dat_campaign_slug: campaign,

    dat_mode: input.mode ?? "",

    dat_ctx_type: input.contextType ?? "",
    dat_ctx_id: input.contextId ?? "",
    dat_ctx_label: input.contextLabel ?? "",

    dat_tier_id: input.tierId ?? "",
    dat_tier_label: input.tierLabel ?? "",
    dat_amount_type: input.amountType ?? "custom",

    dat_amount_minor: String(input.amountMinor),
    dat_currency: input.currency,
    dat_frequency: input.frequency,

    // donor snapshot (optional; webhook also has customer_details)
    dat_donor_email: input.donorEmail ?? "",
    dat_donor_name: input.donorName ?? "",

    // attribution
    dat_utm_source: input.utmSource ?? "",
    dat_utm_medium: input.utmMedium ?? "",
    dat_utm_campaign: input.utmCampaign ?? "",
    dat_utm_content: input.utmContent ?? "",
    dat_utm_term: input.utmTerm ?? "",
    dat_referrer: input.referrer ?? "",
    dat_landing_path: input.landingPath ?? "",
  };

  if (input.donorKey) meta.dat_donor_key = input.donorKey;

  // ✅ Strip empties, but keep a consistent “schema shape” for debugging/inspection.
  const KEEP_EVEN_IF_EMPTY = new Set([
    "dat_schema",
    "dat_campaign",
    "dat_campaign_slug",
    "dat_ctx_type",
    "dat_ctx_id",
    "dat_amount_type",
    "dat_frequency",
  ]);

  for (const k of Object.keys(meta)) {
    if (meta[k] === "" && !KEEP_EVEN_IF_EMPTY.has(k)) delete meta[k];
  }

  return meta;
}

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return jsonError("Missing STRIPE_SECRET_KEY", 500);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const frequency = body?.frequency as "one_time" | "monthly";
  if (frequency !== "one_time" && frequency !== "monthly") {
    return jsonError("frequency must be one_time | monthly");
  }

  const amountMinor = toAmountMinor(body?.amount);
  if (!amountMinor) return jsonError("amount must be a positive number");

  const currency =
    typeof body?.currency === "string" && body.currency
      ? String(body.currency).toLowerCase()
      : DEFAULT_CURRENCY;

  const mode = typeof body?.mode === "string" ? body.mode : null;

  // Donation page selections
  const tierId = typeof body?.tierId === "string" ? body.tierId : null;
  const tierLabel = getString(body, "tierLabel") ?? getString(body, "tierTitle");

  const club = typeof body?.club === "string" ? body.club : null;
  const clubCountry = typeof body?.clubCountry === "string" ? body.clubCountry : null;

  const production = typeof body?.production === "string" ? body.production : null;

  // ✅ FIX: accept aliases (project / specialProjectId / etc.)
  const project = getProjectIdFromBody(body);

  const artistFocus = typeof body?.artistFocus === "string" ? body.artistFocus : null;

  const causeCategory = typeof body?.causeCategory === "string" ? body.causeCategory : null;
  const causeSubcategory =
    typeof body?.causeSubcategory === "string" ? body.causeSubcategory : null;

  // Preferred: UI-provided, already-pretty label
  const contextLabelFromUI =
    typeof body?.contextLabel === "string" && body.contextLabel.trim()
      ? body.contextLabel.trim()
      : null;

  // ✅ Campaign + donor identity (optional) — accept campaign aliases
  const campaignSlug = getCampaignSlugFromBody(body) ?? DEFAULT_CAMPAIGN;

  const donorKey =
    typeof body?.donorKey === "string" && body.donorKey ? body.donorKey : null;

  const email = typeof body?.email === "string" && body.email ? body.email : null;
  const donorName = getString(body, "donorName") ?? getString(body, "name");

  const amountType: "tier" | "custom" = tierId && tierId !== "custom" ? "tier" : "custom";

  // Context resolution (single source of truth)
  let contextType: string = "campaign";
  let contextId: string | null = campaignSlug;

  if (club) {
    contextType = "drama_club";
    contextId = club;
  } else if (mode === "drama-club" && clubCountry) {
    contextType = "drama_club";
    contextId = `country::${clubCountry}`;
  } else if (production) {
    contextType = "production";
    contextId = production;
  } else if (project) {
    contextType = "special_project";
    contextId = project;
  } else if (mode === "artist") {
    contextType = "artist";
    contextId = artistFocus ?? "all";
  } else if (causeCategory) {
    contextType = "cause";
    contextId = causeSubcategory ? `${causeCategory}::${causeSubcategory}` : causeCategory;
  }

  const fallbackContextLabel = buildFallbackContextLabel({ contextType, contextId });
  const checkoutContextLabel = contextLabelFromUI ?? fallbackContextLabel;

  const { utmSource, utmMedium, utmCampaign, utmContent, utmTerm, referrer, landingPath } =
    getUtmBundle(body);

  const stripe = new Stripe(stripeSecretKey);

  // More robust than relying on Origin alone.
  const origin = req.headers.get("origin") ?? new URL(req.url).origin ?? "http://localhost:3000";

  // ✅ Preserve donate-page selections on return
  const returnQs = buildReturnQuery({
    mode,
    freq: frequency,
    tier: tierId,
    club,
    clubCountry,
    production,
    project,
    causeCategory,
    causeSubcategory,
    artistFocus: mode === "artist" ? artistFocus : null,
  });

  const donateBase = `${origin}/donate${returnQs}`;
  const glue = returnQs ? "&" : "?";

  // ✅ IMPORTANT: Do NOT URL-encode {CHECKOUT_SESSION_ID}
  const successUrl = `${donateBase}${glue}checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${donateBase}${glue}checkout=canceled`;

  const datMeta = buildDatMetadata({
    donorKey,
    donorEmail: email,
    donorName,

    campaignSlug,
    mode,
    contextType,
    contextId,
    contextLabel: checkoutContextLabel,

    tierId,
    tierLabel,
    amountType,

    amountMinor,
    currency,
    frequency,

    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    referrer,
    landingPath,
  });

  const submitMessage = buildCheckoutSubmitMessage(checkoutContextLabel);

  // ✅ Common params shared by one-time + monthly
  const common: Stripe.Checkout.SessionCreateParams = {
    client_reference_id: donorKey ?? undefined,
    customer_email: email ?? undefined,
    allow_promotion_codes: true,

    billing_address_collection: "required",

    success_url: successUrl,
    cancel_url: cancelUrl,

    metadata: datMeta,

    // (Some Stripe SDK type versions lag this field; cast to avoid TS blocking you.)
    ...({ branding_settings: { display_name: CHECKOUT_DISPLAY_NAME } } as any),

    custom_text: {
      submit: { message: submitMessage },
    },
  };

  // One line-item with inline price_data (donation-style checkouts)
  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
    quantity: 1,
    price_data: {
      currency,
      unit_amount: amountMinor,
      product_data: {
        name: CHECKOUT_DISPLAY_NAME,
        ...(checkoutContextLabel ? { description: checkoutContextLabel } : {}),
      },
      ...(frequency === "monthly" ? { recurring: { interval: "month" as const } } : {}),
    },
  };

  const session =
    frequency === "one_time"
      ? await stripe.checkout.sessions.create({
          ...common,
          mode: "payment",

          // ✅ Allowed ONLY in payment mode
          customer_creation: "always",

          submit_type: "donate",
          line_items: [lineItem],

          payment_intent_data: {
            metadata: datMeta,
            description: checkoutContextLabel ?? undefined,
          },
        })
      : await stripe.checkout.sessions.create({
          ...common,
          mode: "subscription",

          // ✅ IMPORTANT: do NOT set customer_creation here (Stripe rejects it)
          submit_type: "donate" as any,
          line_items: [lineItem],

          // ✅ Put the metadata on the subscription too (durable across invoices)
          subscription_data: {
            metadata: datMeta,
            description: checkoutContextLabel ?? undefined,
          },
        });

  return NextResponse.json({
    id: session.id,
    url: session.url,
    clientSecret: (session as any).client_secret ?? null,
    donorKey,
  });
}
