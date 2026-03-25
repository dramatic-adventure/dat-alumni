"use client";
import Dropzone from "@/components/media/Dropzone";
export default function UploadBlock({
  label, accept, multiple, onFiles, selectedCount, onChooseExisting,
  emptyTitle, emptyHint, icon = "📁",
}: {
  label: string;
  accept: string;
  multiple?: boolean;
  selectedCount?: number;
  onFiles: (files: File[]) => void;
  onChooseExisting?: () => void;
  emptyTitle?: string;
  emptyHint?: string;
  icon?: React.ReactNode | string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <Dropzone accept={accept} multiple={!!multiple} onFiles={onFiles} label={label} aria-label={label} />
        {typeof selectedCount === "number" && (
          <div className="mt-2 text-sm opacity-80">Selected: {selectedCount}</div>
        )}
        {onChooseExisting && (
          <button type="button" className="text-xs underline underline-offset-2 mt-2" onClick={onChooseExisting}>
            Choose existing…
          </button>
        )}
      </div>
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center bg-white" style={{ borderColor: "#e5e5e5" }}>
        <div className="text-2xl opacity-60">{icon}</div>
        <div className="font-semibold" style={{ color: "#241123" }}>{emptyTitle ?? "No previews here"}</div>
        <div className="text-sm opacity-80" style={{ color: "#241123" }}>
          {emptyHint ?? "Uploads will appear on your profile after save/refresh."}
        </div>
      </div>
    </div>
  );
}
