// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  prisma,
  ContextType,
  AmountType,
  DonationKind,
  PaymentStatus,
} from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEBUG = process.env.STRIPE_WEBHOOK_DEBUG === "1";

const DEFAULT_CAMPAIGN = "sponsor-the-story";
const DEFAULT_CURRENCY = "usd";

// --- Stripe CLI / legacy aliases (underscored) -> canonical dotted names ---
const EVENT_ALIAS: Record<string, Stripe.Event["type"]> = {
  "invoice_payment.paid": "invoice.payment_succeeded",
  "invoice_payment.failed": "invoice.payment_failed",
};

// Pin the apiVersion to whatever your Stripe SDK types expect.
// Your error shows it expects "2025-12-15.clover".
const STRIPE_API_VERSION: Stripe.StripeConfig["apiVersion"] = "2025-12-15.clover";


function misconfigured(name: string) {
  return new NextResponse(`Server misconfigured: missing ${name}`, { status: 500 });
}

function dbg(label: string, payload: any) {
  if (!DEBUG) return;
  // eslint-disable-next-line no-console
  console.log(`[stripe][debug] ${label}`, JSON.stringify(payload, null, 2));
}

function asId(x: unknown): string | null {
  if (!x) return null;
  if (typeof x === "string") return x;
  if (
    typeof x === "object" &&
    x !== null &&
    "id" in x &&
    typeof (x as any).id === "string"
  ) {
    return (x as any).id;
  }
  return null;
}

function md(obj: { metadata?: Stripe.Metadata | null } | null | undefined) {
  return (obj?.metadata ?? {}) as Record<string, string>;
}

function pick(meta: Record<string, string>, ...keys: string[]) {
  for (const k of keys) {
    const v = meta[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

function parseIntSafe(x: unknown): number | null {
  if (typeof x === "number" && Number.isFinite(x)) return Math.trunc(x);
  if (typeof x === "string") {
    const s = x.trim();
    if (!s) return null;
    const n = Number.parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// ---------- tiny time helpers ----------

function nowUtc() {
  return new Date();
}

function isFullyRefunded(params: { refundedAmountMinor: number; originalAmountMinor: number }) {
  return params.refundedAmountMinor >= params.originalAmountMinor;
}

// ---------- enum normalizers (Prisma expects enums, not strings) ----------

const CONTEXT_TYPES = new Set<string>(Object.values(ContextType));
const AMOUNT_TYPES = new Set<string>(Object.values(AmountType));

function asContextType(x: unknown): ContextType | null {
  if (typeof x !== "string") return null;
  return CONTEXT_TYPES.has(x) ? (x as ContextType) : null;
}

function asAmountType(x: unknown): AmountType | null {
  if (typeof x !== "string") return null;
  return AMOUNT_TYPES.has(x) ? (x as AmountType) : null;
}

function normalizeAmountType(x: unknown): AmountType {
  const direct = asAmountType(x);
  if (direct) return direct;
  if (x === "tier") return AmountType.tier;
  if (x === "custom") return AmountType.custom;
  return AmountType.custom;
}

function normalizeContextType(x: unknown): ContextType {
  const direct = asContextType(x);
  if (direct) return direct;

  // accept legacy strings if you ever had them
  if (x === "drama_club") return ContextType.drama_club;
  if (x === "cause") return ContextType.cause;
  if (x === "production") return ContextType.production;
  if (x === "special_project") return ContextType.special_project;
  if (x === "artist") return ContextType.artist;

  return ContextType.campaign;
}

// ---------- attribution + snapshots from metadata ----------

/**
 * Supports BOTH:
 * - legacy keys: dat_campaign_slug, dat_context_type, dat_context_id, dat_amount_type, dat_donor_id
 * - v1 keys: dat_campaign, dat_ctx_type, dat_ctx_id, dat_amount_type, dat_donor_key, dat_amount_minor, dat_currency
 *
 * IMPORTANT: DB schema requires campaignSlug/contextType/contextId/amountType ALWAYS present.
 * So this returns required-safe values with sane defaults.
 */
function getDatFields(meta: Record<string, string>) {
  const campaignSlug =
    pick(meta, "dat_campaign", "dat_campaign_slug", "campaignSlug", "campaign") ??
    DEFAULT_CAMPAIGN;

  const contextType = normalizeContextType(
    pick(meta, "dat_ctx_type", "dat_context_type", "contextType") ?? "campaign"
  );

  const contextId =
    pick(meta, "dat_ctx_id", "dat_context_id", "contextId") ??
    // required fallback: when missing, treat as campaign-level attribution
    campaignSlug;

  const contextLabel =
    pick(meta, "dat_ctx_label", "dat_context_label", "contextLabel") ?? null;

  const tierId = pick(meta, "dat_tier_id", "tierId") ?? null;
  const tierLabel =
    pick(meta, "dat_tier_label", "tierLabel", "tierTitle", "dat_tier_title") ?? null;

  const amountType = normalizeAmountType(
    pick(meta, "dat_amount_type", "dat_tier_kind", "amountType") ?? "custom"
  );

  // Attribution (UTM + landing/referrer)
  const utmSource = pick(meta, "utm_source", "dat_utm_source") ?? null;
  const utmMedium = pick(meta, "utm_medium", "dat_utm_medium") ?? null;
  const utmCampaign = pick(meta, "utm_campaign", "dat_utm_campaign") ?? null;
  const utmContent = pick(meta, "utm_content", "dat_utm_content") ?? null;
  const utmTerm = pick(meta, "utm_term", "dat_utm_term") ?? null;

  const referrer = pick(meta, "dat_referrer", "referrer") ?? null;
  const landingPath = pick(meta, "dat_landing_path", "landingPath") ?? null;

  // Optional: used as fallback if Stripe object doesn’t provide amount/currency
  const metaAmountMinor = parseIntSafe(pick(meta, "dat_amount_minor", "dat_amt_cents"));
  const metaCurrency = (pick(meta, "dat_currency") ?? null)?.toLowerCase() ?? null;

  return {
    campaignSlug,
    contextType,
    contextId,
    contextLabel,
    tierId,
    tierLabel,
    amountType,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    referrer,
    landingPath,
    metaAmountMinor,
    metaCurrency,
  };
}

function donorKeyFromMeta(meta: Record<string, string>) {
  return pick(meta, "dat_donor_key", "dat_donor_id") ?? null;
}

function getDonorKeyFromSession(
  session: { client_reference_id?: string | null } | null,
  meta: Record<string, string>
) {
  return session?.client_reference_id ?? donorKeyFromMeta(meta);
}

function normalizeRecurringStatus(sub: Stripe.Subscription) {
  // Stripe subscription statuses:
  // active, trialing, past_due, unpaid, canceled, incomplete, incomplete_expired, paused
  const s = sub.status;

  if (s === "active" || s === "trialing") return "active";

  // treat billing problems as "past_due" (not canceled)
  if (s === "past_due" || s === "unpaid") return "past_due";

  // "paused" is closer to not-active but not canceled; choose semantics.
  // I'd keep it as "past_due" so it doesn't look canceled.
  if (s === "paused") return "past_due";

  if (s === "canceled") return "canceled";
  if ((sub as any).cancel_at_period_end) return "canceled";

  // Fallback: be conservative but do NOT call it canceled.
  // (incomplete is usually a payment/setup issue)
  return "past_due";
}


function subAmountCurrency(sub: Stripe.Subscription): {
  amountMinor: number | null;
  currency: string | null;
  currentPeriodEnd: Date | null;
  canceledAt: Date | null;
} {
  const item0: any = (sub as any).items?.data?.[0];
  const price: any = item0?.price ?? null;
  const plan: any = item0?.plan ?? null;

  const amountMinor =
    parseIntSafe(price?.unit_amount) ?? parseIntSafe(plan?.amount) ?? null;

  const currency =
    (typeof price?.currency === "string" ? price.currency : null) ??
    (typeof plan?.currency === "string" ? plan.currency : null) ??
    null;

  const cpe =
    typeof (sub as any).current_period_end === "number"
      ? new Date((sub as any).current_period_end * 1000)
      : null;

  const canceledAt =
    typeof (sub as any).canceled_at === "number"
      ? new Date((sub as any).canceled_at * 1000)
      : null;

  return { amountMinor, currency, currentPeriodEnd: cpe, canceledAt };
}

function looksLikeDatDonation(meta: Record<string, string>) {
  return Boolean(
    pick(meta, "dat_schema") ||
      pick(meta, "dat_campaign", "dat_campaign_slug") ||
      pick(meta, "dat_ctx_type", "dat_context_type") ||
      pick(meta, "dat_ctx_id", "dat_context_id")
  );
}

// ✅ TransactionClient type (NOT full PrismaClient)
type TxClient = Parameters<
  Extract<Parameters<typeof prisma.$transaction>[0], (tx: any) => any>
>[0];


/**
 * ✅ NEW: create-or-update for DonationPayment
 * If a row was created earlier (e.g. by a legacy PI path), Checkout becomes the canonical backfill.
 */
async function safeCreateOrUpdateDonationPayment(
  tx: TxClient,
  where: { stripePaymentIntentId?: string | null; stripeInvoiceId?: string | null },
  data: Parameters<typeof prisma.donationPayment.create>[0]["data"]
) {
  try {
    await tx.donationPayment.create({ data });
  } catch (e: any) {
    if (e?.code !== "P2002") throw e;

    // Backfill the existing row (avoid leaving an “early/blank” record forever)
    if (where.stripeInvoiceId) {
  await tx.donationPayment.updateMany({
    where: { stripeInvoiceId: where.stripeInvoiceId },
    data: {
      // ---- donor snapshot ----
      donorKey: (data as any).donorKey ?? undefined,
      donorEmail: (data as any).donorEmail ?? undefined,
      donorName: (data as any).donorName ?? undefined,
      billingCountry: (data as any).billingCountry ?? undefined,

      // ---- amounts + currency (important backfill) ----
      amountMinor: (data as any).amountMinor,
      currency: (data as any).currency,

      // ---- Stripe linkage (important backfill) ----
      stripeCustomerId: (data as any).stripeCustomerId ?? undefined,
      stripePaymentIntentId: (data as any).stripePaymentIntentId ?? undefined,
      stripeSubscriptionId: (data as any).stripeSubscriptionId ?? undefined,
      periodStart: (data as any).periodStart ?? undefined,
      periodEnd: (data as any).periodEnd ?? undefined,

      // ---- attribution (required + snapshots) ----
      campaignSlug: (data as any).campaignSlug,
      contextType: (data as any).contextType,
      contextId: (data as any).contextId,

      contextLabel: (data as any).contextLabel ?? undefined,
      tierId: (data as any).tierId ?? undefined,
      tierLabel: (data as any).tierLabel ?? undefined,
      amountType: (data as any).amountType,

      // ---- attribution (optional but valuable) ----
      utmSource: (data as any).utmSource ?? undefined,
      utmMedium: (data as any).utmMedium ?? undefined,
      utmCampaign: (data as any).utmCampaign ?? undefined,
      utmContent: (data as any).utmContent ?? undefined,
      utmTerm: (data as any).utmTerm ?? undefined,
      referrer: (data as any).referrer ?? undefined,
      landingPath: (data as any).landingPath ?? undefined,

      // ---- status + idempotency stamp ----
      status: (data as any).status,
      stripeEventId: (data as any).stripeEventId,
    },
  });
  return;
}



    if (where.stripePaymentIntentId) {
      await tx.donationPayment.updateMany({
        where: { stripePaymentIntentId: where.stripePaymentIntentId },
        data: {
          // Canonical snapshot from Checkout/invoice
          donorKey: (data as any).donorKey ?? undefined,
          donorEmail: (data as any).donorEmail ?? undefined,
          donorName: (data as any).donorName ?? undefined,
          billingCountry: (data as any).billingCountry ?? undefined,

          stripeSessionId: (data as any).stripeSessionId ?? undefined,
          stripeCustomerId: (data as any).stripeCustomerId ?? undefined,

          // Ensure attribution is correct + required fields remain consistent
          campaignSlug: (data as any).campaignSlug,
          contextType: (data as any).contextType,
          contextId: (data as any).contextId,

          contextLabel: (data as any).contextLabel ?? undefined,
          tierId: (data as any).tierId ?? undefined,
          tierLabel: (data as any).tierLabel ?? undefined,
          amountType: (data as any).amountType,

          // Keep status (Checkout paid => succeeded)
          status: (data as any).status,

          // Optional: stamp the canonical event id
          stripeEventId: (data as any).stripeEventId,
        },
      });
      return;
    }


    // If we can’t target a stable unique key, just no-op.
    return;
  }
}

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) return misconfigured("STRIPE_WEBHOOK_SECRET");

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) return misconfigured("STRIPE_SECRET_KEY");

    const sig = req.headers.get("stripe-signature");
    if (!sig) return new NextResponse("Missing stripe-signature header", { status: 400 });

    const rawBody = Buffer.from(await req.arrayBuffer());
    const stripe = new Stripe(stripeSecretKey, { apiVersion: STRIPE_API_VERSION });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown webhook error";
      return new NextResponse(`Webhook signature verification failed: ${message}`, {
        status: 400,
      });
    }

    const canonicalType: Stripe.Event["type"] =
      EVENT_ALIAS[event.type] ?? (event.type as Stripe.Event["type"]);

    if (DEBUG && canonicalType !== event.type) {
      // eslint-disable-next-line no-console
      console.log(`[stripe] alias ${event.type} -> ${canonicalType}`);
    }

    // eslint-disable-next-line no-console
    console.log(`[stripe] ${event.type} -> ${canonicalType} ${event.id}`);

    const result = await prisma.$transaction(async (tx) => {
      // Idempotency guard
      try {
        await tx.stripeWebhookEvent.create({
          data: { id: event.id, type: canonicalType },
        });
      } catch (e: any) {
        if (e?.code === "P2002") return { duplicate: true as const };
        throw e;
      }

      switch (canonicalType) {
        /**
         * ONE-TIME + SUBSCRIPTION CHECKOUT COMPLETION
         */
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const meta = md(session);
          const dat = getDatFields(meta);

          const donorKey = getDonorKeyFromSession(session, meta);
          const stripeCustomerId = asId(session.customer);

          const donorEmail =
            session.customer_details?.email ??
            (typeof session.customer_email === "string" ? session.customer_email : null) ??
            null;

          const donorName =
            session.customer_details?.name ??
            (typeof (session as any).customer_details?.name === "string"
              ? (session as any).customer_details.name
              : null) ??
            null;

          const billingCountry =
            session.customer_details?.address?.country ??
            (typeof (session as any).customer_details?.address?.country === "string"
              ? (session as any).customer_details.address.country
              : null) ??
            null;

          dbg("checkout.session.completed.extract", {
            sessionId: session.id,
            mode: session.mode,
            payment_status: session.payment_status,
            client_reference_id: session.client_reference_id,
            customer: stripeCustomerId,
            payment_intent: asId(session.payment_intent),
            subscription: asId(session.subscription),
            extracted: { donorKey, ...dat, donorEmail, donorName, billingCountry },
          });

          if (session.mode === "payment") {
            // Canonical one-time source
            if (session.payment_status !== "paid") break;

            const amountMinor = session.amount_total ?? dat.metaAmountMinor ?? null;
            if (amountMinor == null) break;

            const currency = (
              session.currency ??
              dat.metaCurrency ??
              DEFAULT_CURRENCY
            ).toLowerCase();

            const stripePaymentIntentId = asId(session.payment_intent);

            await safeCreateOrUpdateDonationPayment(
              tx,
              { stripePaymentIntentId },
              {
                kind: DonationKind.one_time,
                status: PaymentStatus.succeeded,

                donorKey,
                donorEmail,
                donorName,
                billingCountry,

                amountMinor,
                currency,

                campaignSlug: dat.campaignSlug,
                contextType: dat.contextType,
                contextId: dat.contextId,

                contextLabel: dat.contextLabel,
                tierId: dat.tierId,
                tierLabel: dat.tierLabel,
                amountType: dat.amountType,

                utmSource: dat.utmSource,
                utmMedium: dat.utmMedium,
                utmCampaign: dat.utmCampaign,
                utmContent: dat.utmContent,
                utmTerm: dat.utmTerm,
                referrer: dat.referrer,
                landingPath: dat.landingPath,

                refundedAmountMinor: null,
                refundedAt: null,
                disputeStatus: null,

                stripeEventId: event.id,
                stripeSessionId: session.id,
                stripeCustomerId,

                stripePaymentIntentId,
                stripeSubscriptionId: null,
                stripeInvoiceId: null,

                periodStart: null,
                periodEnd: null,
              }
            );

            break;
          }

          // subscription checkout -> upsert RecurringGift ASAP
          const subId = asId(session.subscription);
          if (!subId) break;

          let amountMinor = session.amount_total ?? dat.metaAmountMinor ?? null;
          let currency =
            (session.currency ?? dat.metaCurrency ?? null)?.toLowerCase() ?? null;

          // If Checkout didn't give us amount/currency, retrieve subscription once.
          if (amountMinor == null || currency == null) {
            try {
              const sub = await stripe.subscriptions.retrieve(subId);
              const subMeta = md(sub);
              const datFromSub = getDatFields(subMeta);

              const ac = subAmountCurrency(sub);
              amountMinor =
                amountMinor ??
                ac.amountMinor ??
                datFromSub.metaAmountMinor ??
                0;

              currency = (
                currency ??
                ac.currency ??
                datFromSub.metaCurrency ??
                DEFAULT_CURRENCY
              ).toLowerCase();

              // Prefer durable attribution from subscription metadata if present
              const useDat = {
                ...dat,
                campaignSlug: datFromSub.campaignSlug ?? dat.campaignSlug,
                contextType: datFromSub.contextType ?? dat.contextType,
                contextId: datFromSub.contextId ?? dat.contextId,
                contextLabel: datFromSub.contextLabel ?? dat.contextLabel,
                tierId: datFromSub.tierId ?? dat.tierId,
                tierLabel: datFromSub.tierLabel ?? dat.tierLabel,
                amountType: datFromSub.amountType ?? dat.amountType,

                utmSource: datFromSub.utmSource ?? dat.utmSource,
                utmMedium: datFromSub.utmMedium ?? dat.utmMedium,
                utmCampaign: datFromSub.utmCampaign ?? dat.utmCampaign,
                utmContent: datFromSub.utmContent ?? dat.utmContent,
                utmTerm: datFromSub.utmTerm ?? dat.utmTerm,
                referrer: datFromSub.referrer ?? dat.referrer,
                landingPath: datFromSub.landingPath ?? dat.landingPath,
              };

              await tx.recurringGift.upsert({
                where: { stripeSubscriptionId: subId },
                create: {
                  stripeSubscriptionId: subId,
                  donorKey,
                  donorEmail,
                  donorName,
                  stripeCustomerId,
                  status: "active",

                  currency,
                  amountMinor,

                  campaignSlug: useDat.campaignSlug,
                  contextType: useDat.contextType,
                  contextId: useDat.contextId,

                  contextLabel: useDat.contextLabel,
                  tierId: useDat.tierId,
                  tierLabel: useDat.tierLabel,
                  amountType: useDat.amountType,

                  utmSource: useDat.utmSource,
                  utmMedium: useDat.utmMedium,
                  utmCampaign: useDat.utmCampaign,
                  utmContent: useDat.utmContent,
                  utmTerm: useDat.utmTerm,
                  referrer: useDat.referrer,
                  landingPath: useDat.landingPath,

                  canceledAt: null,
                  currentPeriodEnd: ac.currentPeriodEnd,
                },
                update: {
                  donorKey: donorKey ?? undefined,
                  donorEmail: donorEmail ?? undefined,
                  donorName: donorName ?? undefined,
                  stripeCustomerId: stripeCustomerId ?? undefined,
                  status: "active",

                  currency,
                  amountMinor,

                  campaignSlug: useDat.campaignSlug,
                  contextType: useDat.contextType,
                  contextId: useDat.contextId,

                  contextLabel: useDat.contextLabel ?? undefined,
                  tierId: useDat.tierId ?? undefined,
                  tierLabel: useDat.tierLabel ?? undefined,
                  amountType: useDat.amountType,

                  utmSource: useDat.utmSource ?? undefined,
                  utmMedium: useDat.utmMedium ?? undefined,
                  utmCampaign: useDat.utmCampaign ?? undefined,
                  utmContent: useDat.utmContent ?? undefined,
                  utmTerm: useDat.utmTerm ?? undefined,
                  referrer: useDat.referrer ?? undefined,
                  landingPath: useDat.landingPath ?? undefined,

                  currentPeriodEnd: ac.currentPeriodEnd ?? undefined,
                },
              });

              break;
            } catch (e) {
              dbg("checkout.session.completed.sub_retrieve_failed", {
                subId,
                error: e instanceof Error ? e.message : String(e),
              });

              // Fall through to minimal upsert with safe defaults
              amountMinor = amountMinor ?? 0;
              currency = (currency ?? DEFAULT_CURRENCY).toLowerCase();
            }
          }

          // Minimal upsert (still required fields always present)
          await tx.recurringGift.upsert({
            where: { stripeSubscriptionId: subId },
            create: {
              stripeSubscriptionId: subId,
              donorKey,
              donorEmail,
              donorName,
              stripeCustomerId,
              status: "active",

              currency: (currency ?? DEFAULT_CURRENCY).toLowerCase(),
              amountMinor: amountMinor ?? 0,

              campaignSlug: dat.campaignSlug,
              contextType: dat.contextType,
              contextId: dat.contextId,

              contextLabel: dat.contextLabel,
              tierId: dat.tierId,
              tierLabel: dat.tierLabel,
              amountType: dat.amountType,

              utmSource: dat.utmSource,
              utmMedium: dat.utmMedium,
              utmCampaign: dat.utmCampaign,
              utmContent: dat.utmContent,
              utmTerm: dat.utmTerm,
              referrer: dat.referrer,
              landingPath: dat.landingPath,

              canceledAt: null,
              currentPeriodEnd: null,
            },
            update: {
              donorKey: donorKey ?? undefined,
              donorEmail: donorEmail ?? undefined,
              donorName: donorName ?? undefined,
              stripeCustomerId: stripeCustomerId ?? undefined,
              status: "active",

              currency: (currency ?? DEFAULT_CURRENCY).toLowerCase(),
              amountMinor: amountMinor ?? 0,

              campaignSlug: dat.campaignSlug,
              contextType: dat.contextType,
              contextId: dat.contextId,

              contextLabel: dat.contextLabel ?? undefined,
              tierId: dat.tierId ?? undefined,
              tierLabel: dat.tierLabel ?? undefined,
              amountType: dat.amountType,

              utmSource: dat.utmSource ?? undefined,
              utmMedium: dat.utmMedium ?? undefined,
              utmCampaign: dat.utmCampaign ?? undefined,
              utmContent: dat.utmContent ?? undefined,
              utmTerm: dat.utmTerm ?? undefined,
              referrer: dat.referrer ?? undefined,
              landingPath: dat.landingPath ?? undefined,
            },
          });

          break;
        }

        /**
         * ONE-TIME FALLBACK (DEFERRED): PaymentIntent succeeded
         *
         * ✅ IMPORTANT:
         * - Skip intents tied to invoices (subscriptions) to avoid double counting
         * - Skip intents that don't look like DAT donation intents (guard rails)
         *
         * ✅ KEY CHANGE:
         * - DO NOT create DonationPayment here for Checkout-based one-time gifts.
         * - Let checkout.session.completed be the canonical creator (it has billingCountry, donorName/email, etc.)
         * - Only update status if a row already exists.
         */
        case "payment_intent.succeeded": {
          const pi = event.data.object as Stripe.PaymentIntent;
          const meta = md(pi);

          if (!looksLikeDatDonation(meta)) {
            dbg("payment_intent.succeeded.skip", { pi: pi.id, reason: "not_dat_donation" });
            break;
          }

          // If this PI is for an invoice, it's a subscription payment.
          // Let invoice.payment_succeeded create the DonationPayment.
          const stripeInvoiceId = asId((pi as any).invoice);
          if (stripeInvoiceId) {
            dbg("payment_intent.succeeded.skip", {
              pi: pi.id,
              reason: "has_invoice",
              invoice: stripeInvoiceId,
            });
            break;
          }

          // ✅ Defer creation to checkout.session.completed
          const existing = await tx.donationPayment.findUnique({
            where: { stripePaymentIntentId: pi.id },
            select: { id: true, status: true },
          });

          if (!existing) {
            dbg("payment_intent.succeeded.defer_to_checkout", { pi: pi.id });
            break;
          }

          if (existing.status !== PaymentStatus.succeeded) {
            await tx.donationPayment.update({
              where: { id: existing.id },
              data: { status: PaymentStatus.succeeded },
            });
          }

          break;
        }

        /**
         * ✅ NEW: ONE-TIME CORRECTION — PaymentIntent failed
         * - Skip intents tied to invoices (subscriptions) to avoid double counting.
         * - Update any matching DonationPayment row to status=failed.
         */
        case "payment_intent.payment_failed": {
          const pi = event.data.object as Stripe.PaymentIntent;

          const stripeInvoiceId = asId((pi as any).invoice);
          if (stripeInvoiceId) {
            dbg("payment_intent.payment_failed.skip", {
              pi: pi.id,
              reason: "has_invoice",
              invoice: stripeInvoiceId,
            });
            break;
          }

          dbg("payment_intent.payment_failed.extract", {
            pi: pi.id,
            customer: asId((pi as any).customer),
            last_payment_error: (pi as any).last_payment_error?.message ?? null,
          });

          const res = await tx.donationPayment.updateMany({
            where: { stripePaymentIntentId: pi.id },
            data: { status: PaymentStatus.failed },
          });

          if (res.count === 0) {
            dbg("payment_intent.payment_failed.noop", {
              reason: "no_matching_donation_payment",
              pi: pi.id,
            });
          }

          break;
        }

        /**
         * SUBSCRIPTIONS: persist durable attribution from subscription metadata
         */
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const meta = md(sub);
          const dat = getDatFields(meta);

          const donorKey = donorKeyFromMeta(meta);
          const stripeCustomerId = asId((sub as any).customer);

          const status =
            canonicalType === "customer.subscription.deleted"
              ? "canceled"
              : normalizeRecurringStatus(sub);

          const ac = subAmountCurrency(sub);
          const currency = (
            ac.currency ??
            dat.metaCurrency ??
            DEFAULT_CURRENCY
          ).toLowerCase();

          const amountMinor = ac.amountMinor ?? dat.metaAmountMinor ?? 0;

          // best-effort donor snapshot from sub (often not present)
          const donorEmail = (sub as any).customer_email ?? null;
          const donorName = (sub as any).customer_name ?? null;

          dbg(`${canonicalType}.extract`, {
            sub: sub.id,
            stripeCustomerId,
            status,
            amountMinor,
            currency,
            extracted: { donorKey, ...dat },
          });

          await tx.recurringGift.upsert({
            where: { stripeSubscriptionId: sub.id },
            create: {
              stripeSubscriptionId: sub.id,
              donorKey,
              donorEmail,
              donorName,

              stripeCustomerId,
              status,

              currency,
              amountMinor,

              campaignSlug: dat.campaignSlug,
              contextType: dat.contextType,
              contextId: dat.contextId,

              contextLabel: dat.contextLabel,
              tierId: dat.tierId,
              tierLabel: dat.tierLabel,
              amountType: dat.amountType,

              utmSource: dat.utmSource,
              utmMedium: dat.utmMedium,
              utmCampaign: dat.utmCampaign,
              utmContent: dat.utmContent,
              utmTerm: dat.utmTerm,
              referrer: dat.referrer,
              landingPath: dat.landingPath,

              canceledAt: ac.canceledAt,
              currentPeriodEnd: ac.currentPeriodEnd,
            },
            update: {
              donorKey: donorKey ?? undefined,
              donorEmail: donorEmail ?? undefined,
              donorName: donorName ?? undefined,

              stripeCustomerId: stripeCustomerId ?? undefined,
              status,

              currency,
              amountMinor,

              campaignSlug: dat.campaignSlug,
              contextType: dat.contextType,
              contextId: dat.contextId,

              contextLabel: dat.contextLabel ?? undefined,
              tierId: dat.tierId ?? undefined,
              tierLabel: dat.tierLabel ?? undefined,
              amountType: dat.amountType,

              utmSource: dat.utmSource ?? undefined,
              utmMedium: dat.utmMedium ?? undefined,
              utmCampaign: dat.utmCampaign ?? undefined,
              utmContent: dat.utmContent ?? undefined,
              utmTerm: dat.utmTerm ?? undefined,
              referrer: dat.referrer ?? undefined,
              landingPath: dat.landingPath ?? undefined,

              canceledAt: ac.canceledAt ?? undefined,
              currentPeriodEnd: ac.currentPeriodEnd ?? undefined,
            },
          });

          break;
        }

        /**
         * MONTHLY LEDGER: invoice payment succeeded
         * ✅ Canonical writer for monthly DonationPayment rows
         */
        case "invoice.payment_succeeded": {
  // ✅ Normalize: Stripe may send either "invoice" OR "invoice_payment"
  // We always canonicalize to a real Invoice (in_...) before mapping.

  const obj = event.data.object as any;

  let invoice: Stripe.Invoice;
  let paymentIntentOverride: string | null = null;

  if (obj?.object === "invoice") {
    invoice = obj as Stripe.Invoice;
  } else if (obj?.object === "invoice_payment") {
    // invoice_payment.id is like "inpay_..." — NEVER persist that.
    const invoiceId: string | null = asId(obj?.invoice);

    if (!invoiceId || !invoiceId.startsWith("in_")) {
      dbg("invoice.payment_succeeded.bad_invoice_payment", {
        object: obj?.object,
        invoice_payment_id: obj?.id ?? null,
        invoice: obj?.invoice ?? null,
      });
      break;
    }

    // Best-effort PI extraction from invoice_payment.payment.payment_intent (if present)
    const rawPi = obj?.payment?.payment_intent ?? obj?.payment_intent ?? null;
    paymentIntentOverride = asId(rawPi);

    // Retrieve the REAL invoice for canonical mapping
    invoice = await stripe.invoices.retrieve(invoiceId, {
      expand: [
        "payment_intent",
        "customer",
        "subscription",
        "lines.data.price",
        "lines.data.plan",
        "lines.data.subscription",
      ],
    });

    dbg("invoice.payment_succeeded.normalized_invoice_payment", {
      invoice_payment_id: obj?.id ?? null, // inpay_...
      invoice_id: invoice.id,             // in_...
      payment_intent_override: paymentIntentOverride,
    });
  } else {
    dbg("invoice.payment_succeeded.unexpected_object", {
      object: obj?.object ?? null,
      id: obj?.id ?? null,
    });
    break;
  }

  // --- continue with your existing logic below, using `invoice` ---

  const stripeInvoiceId = invoice.id; // ✅ will always be in_...
  const stripeSubscriptionId = asId((invoice as any).subscription);
  const stripeCustomerId = asId((invoice as any).customer);

  // ✅ Prefer PI from invoice_payment if present; otherwise use invoice.payment_intent
  const stripePaymentIntentId =
    paymentIntentOverride ?? asId((invoice as any).payment_intent);

          const amountMinor =
            parseIntSafe((invoice as any).amount_paid) ??
            parseIntSafe((invoice as any).amount_due) ??
            null;

          if (amountMinor == null) break;

          const currency = (
            ((invoice as any).currency as string | null) ?? DEFAULT_CURRENCY
          ).toLowerCase();

          // Period from first invoice line (best effort)
          const line0 = (invoice as any).lines?.data?.[0];
          const pStartSec = line0?.period?.start;
          const pEndSec = line0?.period?.end;
          const periodStart =
            typeof pStartSec === "number" ? new Date(pStartSec * 1000) : null;
          const periodEnd =
            typeof pEndSec === "number" ? new Date(pEndSec * 1000) : null;

          const invoiceMeta = md(invoice);
          const datFromInvoice = getDatFields(invoiceMeta);

          const donorEmail =
            (invoice as any).customer_email ??
            (invoice as any).customer_details?.email ??
            null;

          const donorName =
            (invoice as any).customer_name ??
            (invoice as any).customer_details?.name ??
            null;

          const billingCountry =
            (invoice as any).customer_address?.country ??
            (invoice as any).customer_details?.address?.country ??
            null;

          // Primary: use our own RecurringGift
          const gift = stripeSubscriptionId
            ? await tx.recurringGift.findUnique({ where: { stripeSubscriptionId } })
            : null;

          let donorKey = gift?.donorKey ?? donorKeyFromMeta(invoiceMeta);

          let campaignSlug = gift?.campaignSlug ?? datFromInvoice.campaignSlug;
          let contextType: ContextType = gift?.contextType ?? datFromInvoice.contextType;
          let contextId = gift?.contextId ?? datFromInvoice.contextId;

          let contextLabel = gift?.contextLabel ?? datFromInvoice.contextLabel;
          let tierId = gift?.tierId ?? datFromInvoice.tierId;
          let tierLabel = gift?.tierLabel ?? datFromInvoice.tierLabel;
          let amountType: AmountType = gift?.amountType ?? datFromInvoice.amountType;

          let utmSource = gift?.utmSource ?? datFromInvoice.utmSource;
          let utmMedium = gift?.utmMedium ?? datFromInvoice.utmMedium;
          let utmCampaign = gift?.utmCampaign ?? datFromInvoice.utmCampaign;
          let utmContent = gift?.utmContent ?? datFromInvoice.utmContent;
          let utmTerm = gift?.utmTerm ?? datFromInvoice.utmTerm;
          let referrer = gift?.referrer ?? datFromInvoice.referrer;
          let landingPath = gift?.landingPath ?? datFromInvoice.landingPath;

          // Safety net: if invoice arrives before RecurringGift exists, retrieve subscription once.
          if (stripeSubscriptionId && !gift) {
            try {
              const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
              const subMeta = md(sub);
              const datFromSub = getDatFields(subMeta);

              donorKey = donorKey ?? donorKeyFromMeta(subMeta);

              campaignSlug = datFromSub.campaignSlug ?? campaignSlug;
              contextType = datFromSub.contextType ?? contextType;
              contextId = datFromSub.contextId ?? contextId;

              contextLabel = datFromSub.contextLabel ?? contextLabel;
              tierId = datFromSub.tierId ?? tierId;
              tierLabel = datFromSub.tierLabel ?? tierLabel;
              amountType = datFromSub.amountType ?? amountType;

              utmSource = datFromSub.utmSource ?? utmSource;
              utmMedium = datFromSub.utmMedium ?? utmMedium;
              utmCampaign = datFromSub.utmCampaign ?? utmCampaign;
              utmContent = datFromSub.utmContent ?? utmContent;
              utmTerm = datFromSub.utmTerm ?? utmTerm;
              referrer = datFromSub.referrer ?? referrer;
              landingPath = datFromSub.landingPath ?? landingPath;

              const ac = subAmountCurrency(sub);
              const subCurrency = (
                ac.currency ??
                datFromSub.metaCurrency ??
                currency
              ).toLowerCase();

              const subAmount = ac.amountMinor ?? datFromSub.metaAmountMinor ?? amountMinor;

              dbg("invoice.payment_succeeded.subscription_fallback", {
                stripeSubscriptionId,
                recovered: { donorKey, campaignSlug, contextType, contextId, tierId, amountType },
              });

              // Upsert RecurringGift now that we have attribution
              await tx.recurringGift.upsert({
                where: { stripeSubscriptionId },
                create: {
                  stripeSubscriptionId,
                  donorKey,
                  donorEmail,
                  donorName,
                  stripeCustomerId,
                  status: "active",

                  currency: subCurrency,
                  amountMinor: subAmount,

                  campaignSlug,
                  contextType,
                  contextId,

                  contextLabel,
                  tierId,
                  tierLabel,
                  amountType,

                  utmSource,
                  utmMedium,
                  utmCampaign,
                  utmContent,
                  utmTerm,
                  referrer,
                  landingPath,

                  canceledAt: ac.canceledAt,
                  currentPeriodEnd: ac.currentPeriodEnd,
                },
                update: {
                  donorKey: donorKey ?? undefined,
                  donorEmail: donorEmail ?? undefined,
                  donorName: donorName ?? undefined,
                  stripeCustomerId: stripeCustomerId ?? undefined,
                  status: "active",

                  currency: subCurrency,
                  amountMinor: subAmount,

                  campaignSlug,
                  contextType,
                  contextId,

                  contextLabel: contextLabel ?? undefined,
                  tierId: tierId ?? undefined,
                  tierLabel: tierLabel ?? undefined,
                  amountType,

                  utmSource: utmSource ?? undefined,
                  utmMedium: utmMedium ?? undefined,
                  utmCampaign: utmCampaign ?? undefined,
                  utmContent: utmContent ?? undefined,
                  utmTerm: utmTerm ?? undefined,
                  referrer: referrer ?? undefined,
                  landingPath: landingPath ?? undefined,

                  currentPeriodEnd: ac.currentPeriodEnd ?? undefined,
                  canceledAt: ac.canceledAt ?? undefined,
                },
              });
            } catch (e) {
              dbg("invoice.payment_succeeded.subscription_fallback_failed", {
                stripeSubscriptionId,
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }

          dbg("invoice.payment_succeeded.extract", {
            invoice: stripeInvoiceId,
            subscription: stripeSubscriptionId,
            customer: stripeCustomerId,
            payment_intent: stripePaymentIntentId,
            amountMinor,
            currency,
            giftFound: Boolean(gift),
            extracted: { donorKey, campaignSlug, contextType, contextId, tierId, amountType },
          });

      await safeCreateOrUpdateDonationPayment(
        tx,
        { stripeInvoiceId },   // ✅ canonical unique key for monthly ledger
        {
          kind: DonationKind.monthly,
          status: PaymentStatus.succeeded,

          donorKey,
          donorEmail,
          donorName,
          billingCountry,

          amountMinor,
          currency,

          campaignSlug,
          contextType,
          contextId,

          contextLabel,
          tierId,
          tierLabel,
          amountType,

          utmSource,
          utmMedium,
          utmCampaign,
          utmContent,
          utmTerm,
          referrer,
          landingPath,

          refundedAmountMinor: null,
          refundedAt: null,
          disputeStatus: null,

          stripeEventId: event.id,
          stripeSessionId: null,
          stripeCustomerId,

          stripePaymentIntentId,
          stripeSubscriptionId,
          stripeInvoiceId,

          periodStart,
          periodEnd,
        }
      );

          break;
        }

        /**
 * ✅ MONTHLY PAYMENT FAILED — invoice.payment_failed
 *
 * Mark the RecurringGift as "past_due" (NOT canceled).
 * A failed charge is a billing issue; the subscription may still be active and recoverable.
 *
 * Guard rails:
 * - If the gift is already canceled, don’t overwrite that state.
 * - Keep canceledAt = null while past_due.
 */

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;

          const stripeSubscriptionId = asId((invoice as any).subscription);
          const stripeCustomerId = asId((invoice as any).customer);

          dbg("invoice.payment_failed.extract", {
            invoice: invoice.id,
            subscription: stripeSubscriptionId,
            customer: stripeCustomerId,
            attempt_count: (invoice as any).attempt_count ?? null,
            next_payment_attempt: (invoice as any).next_payment_attempt ?? null,
          });

          if (!stripeSubscriptionId) break;

          await tx.recurringGift.updateMany({
            where: {
              stripeSubscriptionId,
              // prevents clearing canceledAt if it was already canceled
              status: { not: "canceled" },
            },
            data: {
              status: "past_due",
              canceledAt: null,
            },
          });

          break;
        }

        /**
         * ✅ NEW: ONE-TIME REFUNDS — charge.refunded
         * Updates DonationPayment.refundedAmountMinor/refundedAt and (optionally) status.
         */
        case "charge.refunded": {
          const ch = event.data.object as Stripe.Charge;

          const stripePaymentIntentId = asId((ch as any).payment_intent);
          const stripeCustomerId = asId((ch as any).customer);

          const refundedAmountMinor =
            typeof (ch as any).amount_refunded === "number" ? (ch as any).amount_refunded : null;

          dbg("charge.refunded.extract", {
            charge: ch.id,
            payment_intent: stripePaymentIntentId,
            customer: stripeCustomerId,
            amount_refunded: refundedAmountMinor,
            refunded: (ch as any).refunded ?? null,
          });

          if (!stripePaymentIntentId || refundedAmountMinor == null) break;

          const existing = await tx.donationPayment.findUnique({
            where: { stripePaymentIntentId },
            select: { id: true, amountMinor: true },
          });

          if (!existing) {
            dbg("charge.refunded.skip", {
              reason: "no_matching_donation_payment",
              stripePaymentIntentId,
            });
            break;
          }

          const fully = isFullyRefunded({
            refundedAmountMinor,
            originalAmountMinor: existing.amountMinor,
          });

          await tx.donationPayment.update({
            where: { id: existing.id },
            data: {
              refundedAmountMinor,
              refundedAt: nowUtc(),
              // Optional but useful: treat full refunds as canceled.
              ...(fully ? { status: PaymentStatus.canceled } : {}),
            },
          });

          break;
        }

        default:
          break;
      }

      return { duplicate: false as const };
    });

    if (result.duplicate) return NextResponse.json({ received: true, duplicate: true });
    return NextResponse.json({ received: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Webhook fatal error:", err);
    return new NextResponse("Webhook handler error", { status: 500 });
  }
}
