// /components/media/FeaturedSummary.tsx
"use client";

export default function FeaturedSummary({
  status,
  assets,
  onChange,
}: {
  status?: string; // "pending" | "live" | ""
  assets: {
    currentHeadshotId?: string;
    featuredAlbumId?: string;
    featuredReelId?: string;
    featuredEventId?: string;
  };
  onChange: (kind: "headshot" | "album" | "reel" | "event") => void;
}) {
  const pills: Array<{ key: keyof typeof assets; label: string; kind: "headshot"|"album"|"reel"|"event" }> = [
    { key: "currentHeadshotId", label: "Headshot", kind: "headshot" },
    { key: "featuredAlbumId", label: "Album", kind: "album" },
    { key: "featuredReelId", label: "Reel", kind: "reel" },
    { key: "featuredEventId", label: "Event", kind: "event" },
  ];

  return (
    <div className="mb-6 rounded-2xl border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold">Featured now</div>
        {status ? (
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              status === "pending" ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
            }`}
          >
            {status === "pending" ? "Pending Review" : "Live"}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {pills.map(({ key, label, kind }) => {
          const has = Boolean(assets[key]);
          return (
            <div key={String(key)} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
              <div className="text-sm">
                <span className="font-medium">{label}</span>{" "}
                <span className={`ml-2 text-xs ${has ? "text-gray-600" : "text-gray-400"}`}>
                  {has ? "Set" : "Not set"}
                </span>
              </div>
              <button
                type="button"
                className="text-xs underline underline-offset-2"
                onClick={() => onChange(kind)}
              >
                Change
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
