// app/donate/cancel/page.tsx
import Link from "next/link";

export default function DonateCancelPage() {
  return (
    <main className="min-h-[100dvh] bg-[#f7f2e9] text-[#241123]">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#fbf7f1] px-3 py-1 text-xs font-semibold tracking-wide">
            <span className="h-2 w-2 rounded-full bg-[#6C00AF]" aria-hidden="true" />
            <span className="font-sans">Dramatic Adventure Theatre</span>
          </div>

          <h1 className="mt-4 text-3xl font-bold font-display tracking-tight">
            Checkout canceled
          </h1>

          <p className="mt-3 text-base opacity-80 font-sans">
            Nothing was charged. You can try again anytime.
          </p>
        </div>

        <div className="rounded-3xl border border-black/10 bg-[#fbf7f1] shadow-[0_18px_50px_rgba(36,17,35,0.10)] overflow-hidden">
          <div className="border-b border-black/10 bg-[rgba(108,0,175,0.06)] px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold tracking-wide opacity-80 font-sans">
                  Ready when you are
                </div>
                <div className="mt-1 text-lg font-semibold font-display">
                  Sponsor the Story
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-3 py-1 text-xs font-semibold font-sans">
                <span className="inline-block h-2 w-2 rounded-full bg-[#FFCC00]" aria-hidden="true" />
                <span>Fund moments, not maintenance.</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="rounded-2xl border border-black/10 bg-white/55 p-4 text-sm font-sans opacity-85">
              If you ran into an issue, you can try again—or choose a different tier or frequency.
            </div>

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
