"use client";

import Image from "next/image";
import Dropzone from "@/components/media/Dropzone";

function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center bg-white"
      style={{ borderColor: "#e5e5e5" }}
    >
      <div className="text-2xl opacity-60">🖼️</div>
      <div className="font-semibold" style={{ color: "#241123" }}>
        {title}
      </div>
      {hint ? (
        <div className="text-sm opacity-80" style={{ color: "#241123" }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export default function HeadshotBlock({
  previewUrl,
  onFiles,
  onChooseExisting,
  sessionCount = 0,
}: {
  previewUrl?: string | null;
  sessionCount?: number;
  onFiles: (files: File[]) => void;
  onChooseExisting: () => void;
}) {
  // Use unoptimized for blob:/data: URLs (e.g., freshly dropped files)
  const isBlobOrData =
    !!previewUrl &&
    (previewUrl.startsWith("blob:") || previewUrl.startsWith("data:"));

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px,1fr] gap-6">
      <div
        className="overflow-hidden rounded-xl border bg-white"
        style={{ borderColor: "#e5e5e5" }}
      >
        {previewUrl ? (
          <div className="relative h-72 w-full">
            <Image
              src={previewUrl}
              alt="Headshot preview"
              fill
              sizes="(max-width: 768px) 100vw, 280px"
              className="object-cover"
              priority={false}
              decoding="async"
              // If the preview is a local blob/data URL, avoid Next loader
              unoptimized={isBlobOrData}
            />
          </div>
        ) : (
          <Empty
            title="No headshot yet"
            hint="Upload a headshot or choose an existing image."
          />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Dropzone
          accept="image/*"
          multiple={false}
          onFiles={onFiles}
          label="Upload headshot"
          aria-label="Upload headshot"
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onChooseExisting}
            className="rounded-xl border px-3 py-2 text-sm transition hover:bg-[rgba(36,147,169,0.06)] active:scale-[0.98]"
            style={{ borderColor: "#e5e5e5", color: "#2493A9", background: "white" }}
          >
            Choose existing…
          </button>
          <span className="text-sm opacity-80">
            Uploaded this session: {sessionCount}
          </span>
        </div>

        <div className="text-xs opacity-70" style={{ color: "#241123" }}>
          Tip: Square images (min 800×800) look best.
        </div>
      </div>
    </div>
  );
}
