// app/donate/success/page.tsx
import Link from "next/link";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  // Next 15 can pass searchParams as a Promise in server components
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
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

function formatMoney(amountMinor: number | null, currency: string | null) {
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

function pickFirstString(v: string | string[] | undefined): string | null {
  if (!v) return null;
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : null;
  return typeof v === "string" ? v : null;
}

async function getSiteOrigin(): Promise<string> {
  // Prefer explicit env (prod)
  const env =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (env) return env.replace(/\/+$/, "");

  // Otherwise derive from request headers (dev + prod behind proxy)
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`.replace(/\/+$/, "");
}

function prettyContext(contextType: string | null, contextId: string | null) {
  if (!contextType) return null;

  const t = contextType.toLowerCase();

  if (t === "drama_club") {
    if (!contextId || contextId === "all") return "Drama Clubs (network-wide)";
    return `Drama Club: ${contextId}`;
  }

  if (t === "production") {
    if (!contextId || contextId === "all") return "New Work (all productions)";
    return `Production: ${contextId}`;
  }

  if (t === "special_project") {
    if (!contextId || contextId === "all") return "Special Projects (portfolio)";
    return `Special Project: ${contextId}`;
  }

  if (t === "cause") {
    if (!contextId || contextId === "all") return "All Causes We Champion";
    return contextId.includes("::") ? `Cause: ${contextId.replace("::", " — ")}` : `Cause: ${contextId}`;
  }

  if (t === "artist") return "Artist Support";

  if (t === "general") return "Sponsor the Story (general)";
  return contextId ? `${contextType}: ${contextId}` : contextType;
}

function statusLine(receipt: Receipt | null) {
  if (!receipt) return "Loading your receipt…";

  if (receipt.mode === "subscription") return "Your subscription is active.";
  if (receipt.paymentStatus === "paid") return "Your donation is confirmed.";
  if (receipt.paymentStatus) return "Your donation is processing.";
  return "Thank you—your gift is on its way.";
}

export default async function DonateSuccessPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const sessionId =
    pickFirstString(sp?.session_id) ?? pickFirstString(sp?.sessionId);

  let receipt: Receipt | null = null;
  let error: string | null = null;

  if (sessionId) {
    try {
      const origin = await getSiteOrigin();
      const url = `${origin}/api/stripe/session?session_id=${encodeURIComponent(
        sessionId
      )}`;

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        error = data?.error ?? "Failed to load receipt.";
      } else {
        receipt = data as Receipt;
      }
    } catch (e: any) {
      error = e?.message ?? "Failed to load receipt.";
    }
  }

  const title =
    receipt?.mode === "subscription"
      ? "Thank you for your monthly gift."
      : "Thank you.";

  const ctx = prettyContext(receipt?.contextType ?? null, receipt?.contextId ?? null);

  return (
    <main className="min-h-[100dvh] bg-[#f7f2e9] text-[#241123]">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Top brand / header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#fbf7f1] px-3 py-1 text-xs font-semibold tracking-wide">
            <span className="h-2 w-2 rounded-full bg-[#6C00AF]" aria-hidden="true" />
            <span className="font-sans">Dramatic Adventure Theatre</span>
          </div>

          <h1 className="mt-4 text-3xl font-bold font-display tracking-tight">
            {title}
          </h1>

          {!sessionId ? (
            <p className="mt-3 text-base opacity-80 font-sans">
              Missing{" "}
              <code className="rounded bg-black/5 px-1">session_id</code>. If you
              came here from Stripe Checkout, something stripped your URL params.
            </p>
          ) : (
            <p className="mt-3 text-base opacity-80 font-sans">
              {statusLine(receipt)}
            </p>
          )}
        </div>

        {/* Error */}
        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <div className="font-semibold">We couldn’t load your receipt yet</div>
            <div className="mt-1 opacity-80">{error}</div>
            <div className="mt-2 text-xs opacity-70">
              You can still use your receipt reference below to find the session in Stripe.
            </div>
          </div>
        ) : null}

        {/* Main card */}
        <div className="rounded-3xl border border-black/10 bg-[#fbf7f1] shadow-[0_18px_50px_rgba(36,17,35,0.10)] overflow-hidden">
          {/* Card header band */}
          <div className="border-b border-black/10 bg-[rgba(108,0,175,0.06)] px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold tracking-wide opacity-80 font-sans">
                  Receipt
                </div>
                <div className="mt-1 text-lg font-semibold font-display">
                  Sponsor the Story
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-3 py-1 text-xs font-semibold font-sans">
                <span
                  className="inline-block h-2 w-2 rounded-full bg-[#FFCC00]"
                  aria-hidden="true"
                />
                <span>Fund moments, not maintenance.</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            {!sessionId ? (
              <div className="rounded-2xl border border-black/10 bg-white/55 p-4 text-sm font-sans opacity-80">
                If you need help, email us with details of your donation and the approximate time.
              </div>
            ) : (
              <>
                {/* Receipt reference */}
                <div className="rounded-2xl border border-black/10 bg-white/55 p-4">
                  <div className="text-xs font-semibold tracking-wide opacity-70 font-sans">
                    Receipt reference
                  </div>
                  <div className="mt-1 break-all font-mono text-xs opacity-80">
                    {sessionId}
                  </div>
                </div>

                {/* Details */}
                <div className="mt-5 grid gap-3">
                  <div className="rounded-2xl border border-black/10 bg-white/55 p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex items-baseline justify-between gap-4 border-b border-black/10 pb-3 sm:border-b-0 sm:pb-0">
                        <span className="text-sm opacity-60 font-sans">Frequency</span>
                        <span className="text-sm font-semibold font-sans">
                          {receipt?.mode === "subscription" ? "Monthly" : "One-time"}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-sm opacity-60 font-sans">Amount</span>
                        <span className="text-sm font-semibold font-sans">
                          {formatMoney(receipt?.amountMinor ?? null, receipt?.currency ?? null)}
                        </span>
                      </div>
                    </div>

                    {ctx ? (
                      <div className="mt-3 flex items-baseline justify-between gap-6 border-t border-black/10 pt-3">
                        <span className="text-sm opacity-60 font-sans">Focus</span>
                        <span className="text-sm font-semibold font-sans break-all text-right">
                          {ctx}
                        </span>
                      </div>
                    ) : null}

                    {receipt?.tierId ? (
                      <div className="mt-3 flex items-baseline justify-between gap-6 border-t border-black/10 pt-3">
                        <span className="text-sm opacity-60 font-sans">Tier</span>
                        <span className="text-sm font-semibold font-sans break-all text-right">
                          {receipt.tierId}
                        </span>
                      </div>
                    ) : null}

                    {receipt?.donorEmail ? (
                      <div className="mt-3 flex items-baseline justify-between gap-6 border-t border-black/10 pt-3">
                        <span className="text-sm opacity-60 font-sans">Email</span>
                        <span className="text-sm font-semibold font-sans break-all text-right">
                          {receipt.donorEmail}
                        </span>
                      </div>
                    ) : null}

                    {receipt?.donorKey ? (
                      <div className="mt-3 flex items-baseline justify-between gap-6 border-t border-black/10 pt-3">
                        <span className="text-sm opacity-60 font-sans">donorKey</span>
                        <span className="text-sm font-semibold font-sans break-all text-right">
                          {receipt.donorKey}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Invoice links */}
                  {(receipt?.hostedInvoiceUrl || receipt?.invoicePdf) ? (
                    <div className="flex flex-wrap gap-2">
                      {receipt.hostedInvoiceUrl ? (
                        <a
                          className="rounded-2xl border border-black/10 bg-white/55 px-4 py-2 text-xs font-semibold hover:bg-white/80 font-sans"
                          href={receipt.hostedInvoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View invoice
                        </a>
                      ) : null}
                      {receipt.invoicePdf ? (
                        <a
                          className="rounded-2xl border border-black/10 bg-white/55 px-4 py-2 text-xs font-semibold hover:bg-white/80 font-sans"
                          href={receipt.invoicePdf}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Invoice PDF
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </>
            )}

            {/* Actions */}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/donate"
                className="rounded-2xl bg-[#6C00AF] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 font-sans shadow-[0_12px_28px_rgba(108,0,175,0.20)]"
              >
                Back to donate
              </Link>

              <Link
                href="/"
                className="rounded-2xl border border-black/10 bg-white/55 px-5 py-2.5 text-sm font-semibold hover:bg-white/80 font-sans"
              >
                Home
              </Link>

              <Link
                href="/drama-club"
                className="rounded-2xl border border-black/10 bg-white/55 px-5 py-2.5 text-sm font-semibold hover:bg-white/80 font-sans"
              >
                Explore drama clubs
              </Link>
            </div>

            <div className="mt-4 text-xs opacity-65 font-sans">
              Powered by Stripe. Card info is encrypted and secure.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
