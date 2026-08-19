// components/ui/PageSkeleton.tsx
//
// Shared skeleton primitives for route-level loading.tsx files.
// Server-safe (no hooks, no client APIs) so loading.tsx stays a server
// component and paints instantly on soft navigation.
//
// Three page shapes cover the site:
//   <DetailPageSkeleton />  — hero + title + prose (projects, stories, events…)
//   <IndexPageSkeleton />   — heading + card grid (alumni, taxonomy pages…)
//   <FormPageSkeleton />    — heading + stacked fields (apply, donate…)
//
// Visual language matches the existing alumni/[slug] skeleton: slate-200
// blocks with motion-safe:animate-pulse on the wrapper, sr-only status text
// for assistive tech.

import type { ReactNode } from "react";

function Bone({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`bg-slate-200 rounded ${className}`} />;
}

/** Fixed-aspect-ratio bone (paddingBottom trick — no plugin dependency). */
function AspectBone({
  ratio,
  className = "",
}: {
  /** height / width, e.g. 0.5625 for 16:9 */
  ratio: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`relative w-full overflow-hidden bg-slate-200 ${className}`}
    >
      <div style={{ paddingBottom: `${ratio * 100}%` }} />
    </div>
  );
}

function Shell({
  label,
  maxWidth,
  children,
}: {
  label: string;
  maxWidth: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`mx-auto ${maxWidth} px-4 py-10 motion-safe:animate-pulse`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Hero + title + prose. For story/project/event/production detail pages. */
export function DetailPageSkeleton({
  label = "Loading page…",
}: {
  label?: string;
}) {
  return (
    <Shell label={label} maxWidth="max-w-5xl">
      {/* Breadcrumb / kicker */}
      <Bone className="h-5 w-40 mb-3" />
      {/* Title */}
      <Bone className="h-10 w-3/4 mb-2" />
      <Bone className="h-6 w-1/3 mb-8" />

      {/* Hero image */}
      <AspectBone ratio={0.42} className="rounded-xl mb-8" />

      {/* Prose */}
      <div className="space-y-3">
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-5/6" />
        <Bone className="h-4 w-4/5" />
        <Bone className="h-4 w-2/3" />
      </div>

      {/* Secondary media / cards */}
      <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <AspectBone ratio={0.6666} className="rounded-lg" />
        <AspectBone ratio={0.6666} className="rounded-lg" />
        <AspectBone ratio={0.6666} className="rounded-lg hidden sm:block" />
      </div>
    </Shell>
  );
}

/** Heading + card grid. For index and taxonomy pages. */
export function IndexPageSkeleton({
  label = "Loading page…",
  cards = 6,
}: {
  label?: string;
  cards?: number;
}) {
  return (
    <Shell label={label} maxWidth="max-w-6xl">
      {/* Kicker + heading */}
      <Bone className="h-4 w-28 mb-3" />
      <Bone className="h-10 w-72 mb-2" />
      <Bone className="h-5 w-96 max-w-full mb-10" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i}>
            <AspectBone ratio={0.6666} className="rounded-xl mb-3" />
            <Bone className="h-5 w-3/4 mb-2" />
            <Bone className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </Shell>
  );
}

/** Heading + stacked fields. For apply/donate style pages. */
export function FormPageSkeleton({
  label = "Loading page…",
}: {
  label?: string;
}) {
  return (
    <Shell label={label} maxWidth="max-w-3xl">
      {/* Heading + intro */}
      <Bone className="h-10 w-2/3 mb-4" />
      <div className="space-y-3 mb-10">
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-4/5" />
      </div>

      {/* Fields */}
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Bone className="h-4 w-32 mb-2" />
            <Bone className="h-11 w-full rounded-md" />
          </div>
        ))}
      </div>

      {/* Submit */}
      <Bone className="h-11 w-40 rounded-md mt-10" />
    </Shell>
  );
}
