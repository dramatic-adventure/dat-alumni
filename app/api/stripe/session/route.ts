// app/api/stripe/session/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
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

function parseIntSafe(x: unknown): number | null {
  if (typeof x === "number" && Number.isFinite(x)) return Math.trunc(x);
  if (typeof x === "string" && x.length) {
    const n = Number.parseInt(x, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pickDatMetadata(opts: {
  session: Stripe.Checkout.Session;
  paymentIntent?: Stripe.PaymentIntent | null;
  subscription?: Stripe.Subscription | null;
}): Record<string, string> {
  const fromSession = (opts.session.metadata ?? {}) as Record<string, string>;
  const fromPi = (opts.paymentIntent?.metadata ?? {}) as Record<string, string>;
  const fromSub = (opts.subscription?.metadata ?? {}) as Record<string, string>;

  // Prefer session → PI → subscription (session wins)
  return { ...fromSub, ...fromPi, ...fromSession };
}

export async function GET(req: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) return jsonError("Missing STRIPE_SECRET_KEY", 500);

    const { searchParams } = new URL(req.url);
    const sessionId =
      searchParams.get("session_id") ?? searchParams.get("sessionId");

    if (!sessionId) return jsonError("Missing session_id");
    if (!sessionId.startsWith("cs_")) return jsonError("Invalid session_id");

    const stripe = new Stripe(stripeSecretKey);

    // 1) Retrieve Checkout Session (expand what we can)
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["payment_intent", "subscription"],
      });
    } catch (err: any) {
      return jsonError(
        `Could not retrieve session: ${err?.message ?? String(err)}`,
        404
      );
    }

    // Stripe session.mode can be: "payment" | "subscription" | "setup"
    const mode = session.mode;
    if (mode !== "payment" && mode !== "subscription") {
      return jsonError(`Unsupported session.mode: ${String(mode)}`, 400);
    }

    const stripeCustomerId = asId(session.customer);

    const paymentIntent =
      session.payment_intent && typeof session.payment_intent === "object"
        ? (session.payment_intent as Stripe.PaymentIntent)
        : null;

    const stripePaymentIntentId = paymentIntent?.id ?? asId(session.payment_intent);

    // 2) Subscription details (only if subscription mode)
    const subscriptionId = mode === "subscription" ? asId(session.subscription) : null;

    let subscription: Stripe.Subscription | null =
      mode === "subscription" &&
      session.subscription &&
      typeof session.subscription === "object"
        ? (session.subscription as Stripe.Subscription)
        : null;

    if (subscriptionId) {
      try {
        subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ["latest_invoice", "latest_invoice.payment_intent"],
        });
      } catch (err) {
        // Not fatal — we can still return receipt basics from the session
        console.error("[stripe/session] subscription retrieve failed", err);
      }
    }

    const stripeSubscriptionId = subscription?.id ?? subscriptionId;

    const meta = pickDatMetadata({ session, paymentIntent, subscription });

    // ---- attribution fields (durable; you set these in checkout route) ----
    const donorKey = meta.dat_donor_key ?? meta.dat_donor_id ?? null;

    const campaignSlug = meta.dat_campaign_slug ?? meta.dat_campaign ?? null;
const contextType = meta.dat_ctx_type ?? (meta as any).contextType ?? null;
const contextId = meta.dat_ctx_id ?? (meta as any).contextId ?? null;

// ✅ helpful for success UI
const contextLabel = meta.dat_ctx_label ?? null;
const frequency = meta.dat_frequency ?? (mode === "subscription" ? "monthly" : "one_time");

    const tierId = meta.dat_tier_id ?? null;
    const amountType = (meta.dat_amount_type ?? meta.dat_tier_kind ?? null) as string | null;

    // ---- money ----
    const currency = (session.currency ?? meta.dat_currency ?? null)?.toLowerCase() ?? null;

    const amountMinor =
      (typeof session.amount_total === "number" && session.amount_total > 0
        ? session.amount_total
        : parseIntSafe(meta.dat_amt_cents) ??
          parseIntSafe(meta.dat_amount_minor) ??
          null);

    // ---- donor ----
    const donorEmail = session.customer_details?.email ?? session.customer_email ?? null;

    // ---- invoice links for subscription (best effort) ----
    const invoice =
      subscription?.latest_invoice && typeof subscription.latest_invoice === "object"
        ? (subscription.latest_invoice as Stripe.Invoice)
        : null;

    const stripeInvoiceId = invoice?.id ?? null;
    const hostedInvoiceUrl = invoice?.hosted_invoice_url ?? null;
    const invoicePdf = invoice?.invoice_pdf ?? null;

    // ---- status fields expected by success page ----
    const status =
      mode === "subscription"
        ? (subscription?.status ?? null)
        : (paymentIntent?.status ?? null);

    const paymentStatus = session.payment_status ?? null;

    // ✅ IMPORTANT: return the Receipt shape directly (NOT wrapped)
    return NextResponse.json({
      sessionId: session.id,
      mode,
      status,
      paymentStatus,

      donorEmail,
      donorKey,

      amountMinor: amountMinor ?? null,
      currency,

      frequency,
      campaignSlug,
      contextType,
      contextId,
      contextLabel,
      tierId,
      amountType,

      stripeCustomerId,
      stripePaymentIntentId,
      stripeSubscriptionId,
      stripeInvoiceId,

      hostedInvoiceUrl,
      invoicePdf,
    });
  } catch (err: any) {
    console.error("[stripe/session] unexpected error", err);
    return jsonError(err?.message ?? "Unexpected error", 500);
  }
}
