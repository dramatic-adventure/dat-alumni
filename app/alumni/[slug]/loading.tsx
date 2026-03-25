// app/alumni/[slug]/loading.tsx
export default function Loading() {
  return (
    <div
      className="mx-auto max-w-5xl px-4 py-10 motion-safe:animate-pulse"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Title / Breadcrumb spacer */}
      <div className="h-6 w-40 bg-slate-200 rounded mb-3" />
      <div className="h-9 w-72 bg-slate-200 rounded mb-6" />

      {/* Header: headshot + meta */}
      <div className="flex gap-6">
        {/* Headshot (4:5) */}
        <div className="relative w-40 rounded-xl overflow-hidden bg-slate-200">
          <div style={{ paddingBottom: "125%" }} />
        </div>

        {/* Meta / badges / actions */}
        <div className="flex-1">
          <div className="h-5 w-1/3 bg-slate-200 rounded mb-2" />
          <div className="h-5 w-1/2 bg-slate-200 rounded mb-2" />
          <div className="h-5 w-2/3 bg-slate-200 rounded mb-4" />

          {/* Badges row */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="h-6 w-20 bg-slate-200 rounded-full" />
            <div className="h-6 w-24 bg-slate-200 rounded-full" />
            <div className="h-6 w-16 bg-slate-200 rounded-full" />
          </div>

          {/* CTA buttons */}
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-slate-200 rounded-md" />
            <div className="h-9 w-28 bg-slate-200 rounded-md" />
          </div>
        </div>
      </div>

      {/* Statement / bio block */}
      <div className="mt-8 space-y-2">
        <div className="h-4 w-4/5 bg-slate-200 rounded" />
        <div className="h-4 w-3/5 bg-slate-200 rounded" />
        <div className="h-4 w-2/3 bg-slate-200 rounded" />
        <div className="h-4 w-1/2 bg-slate-200 rounded" />
      </div>

      {/* Posters / Gallery */}
      <div className="mt-10">
        <div className="h-6 w-32 bg-slate-200 rounded mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {/* Maintain aspect for thumbnails */}
          <div className="relative w-full rounded-lg overflow-hidden bg-slate-200">
            <div style={{ paddingBottom: "66.66%" }} />
          </div>
          <div className="relative w-full rounded-lg overflow-hidden bg-slate-200">
            <div style={{ paddingBottom: "66.66%" }} />
          </div>
          <div className="relative w-full rounded-lg overflow-hidden bg-slate-200">
            <div style={{ paddingBottom: "66.66%" }} />
          </div>
        </div>
      </div>

      {/* Stories list */}
      <div className="mt-10">
        <div className="h-6 w-28 bg-slate-200 rounded mb-4" />
        <ul className="space-y-4">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="grid grid-cols-[80px_1fr] gap-4 items-start"
            >
              <div className="relative w-20 rounded-md overflow-hidden bg-slate-200">
                <div style={{ paddingBottom: "75%" }} />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-2/3 bg-slate-200 rounded" />
                <div className="h-4 w-1/2 bg-slate-200 rounded" />
                <div className="h-4 w-3/4 bg-slate-200 rounded" />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* SR-only text for AT users */}
      <span className="sr-only">Loading alumni profile…</span>
    </div>
  );
}
