// app/field-kit/loading.tsx
//
// Route-level Suspense fallback for every /field-kit page. All kit pages are
// force-dynamic and block on Google Sheets round-trips before rendering, so
// without this boundary a tab tap produced ZERO visual change until the server
// finished — users read the button as dead and tapped repeatedly. This skeleton
// paints instantly on every soft navigation between kit tabs (one boundary here
// covers all nested segments), so the tap is acknowledged immediately even when
// the actual render is seconds away on venue wifi.
//
// Deliberately generic (no per-tab copy): it flashes for every tab, so it only
// sketches the shared shape — a kicker line, a headline, and a few cards.

import { T } from "@/components/field-kit/tokens";

const PULSE = "fkLoadingPulse 1.1s ease-in-out infinite";

function Block({ width, height, delay = 0, radius = 8 }: { width: string; height: number; delay?: number; radius?: number }) {
  return (
    <div
      aria-hidden
      style={{
        width,
        height,
        borderRadius: radius,
        backgroundColor: T.card,
        border: `1px solid ${T.sep}`,
        animation: PULSE,
        animationDelay: `${delay}ms`,
      }}
    />
  );
}

export default function FieldKitLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading"
      style={{ maxWidth: 560, margin: "0 auto", padding: "28px clamp(18px, 5vw, 40px) 80px" }}
    >
      <style>{`@keyframes fkLoadingPulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.9; } }`}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* kicker + headline */}
        <Block width="34%" height={12} radius={4} />
        <Block width="72%" height={34} delay={80} radius={6} />
        {/* content cards */}
        <div style={{ height: 6 }} />
        <Block width="100%" height={96} delay={160} />
        <Block width="100%" height={96} delay={240} />
        <Block width="100%" height={96} delay={320} />
      </div>
    </main>
  );
}
