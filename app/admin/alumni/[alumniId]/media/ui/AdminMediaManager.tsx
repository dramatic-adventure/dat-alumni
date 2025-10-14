// app/admin/alumni/[alumniId]/media/ui/AdminMediaManager.tsx
"use client";

import { useState } from "react";
import MediaPickerModal from "@/components/media/MediaPickerModal";

type MediaKind = "headshot" | "album" | "reel" | "event";

export default function AdminMediaManager({ alumniId }: { alumniId: string }) {
  const [tab, setTab] = useState<MediaKind>("headshot");
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Media Manager — {alumniId}</h1>
      <div className="flex gap-2 mb-6">
        {(["headshot", "album", "reel", "event"] as MediaKind[]).map((k) => (
          <button
            key={k}
            className={`px-4 py-2 rounded-full border ${tab === k ? "bg-black text-white" : "bg-white"}`}
            onClick={() => setTab(k)}
          >
            {k[0].toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Featured {tab}</h2>
        <button
          className="px-3 py-2 rounded bg-black text-white"
          onClick={() => setPickerOpen(true)}
        >
          Choose existing…
        </button>
      </div>

      {/* You could show a small summary here by calling /api/media/list and highlighting the live one */}

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        alumniId={alumniId}
        kind={tab}
        title={`Choose ${tab}`}
        onFeatured={() => {
          // Optionally refetch a summary here
        }}
      />
    </div>
  );
}
