// app/location/[slug]/loading.tsx
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 animate-pulse">
      <div className="h-8 w-80 bg-slate-200 rounded mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-40 w-full bg-slate-200 rounded-xl" />
            <div className="h-4 w-3/4 bg-slate-200 rounded" />
            <div className="h-3 w-1/2 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
