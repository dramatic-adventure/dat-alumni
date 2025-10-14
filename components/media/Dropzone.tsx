// /components/media/Dropzone.tsx
"use client";

import { useRef, useState } from "react";

type Props = {
  accept: string;                // e.g. "image/*" or "image/*,application/pdf"
  multiple?: boolean;            // default false
  onFiles: (files: File[]) => void;
  label?: string;                // button/cta text
  sublabel?: string;             // small helper text on the tile
  className?: string;
};

export default function Dropzone({
  accept,
  multiple = false,
  onFiles,
  label = "Choose files",
  sublabel = "or drag & drop here",
  className = "",
}: Props) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handlePick(files: FileList | null) {
    const arr = Array.from(files || []);
    if (!arr.length) return;
    onFiles(multiple ? arr : arr.slice(0, 1));
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handlePick(e.dataTransfer.files);
      }}
      className={`border-2 border-dashed rounded-md p-4 cursor-pointer transition select-none ${drag ? "border-[#6C00AF] bg-[rgba(108,0,175,0.06)]" : "border-gray-300"} ${className}`}
      style={{ fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' }}
    >
      <p className="m-0 text-sm">
        <span className="underline">{label}</span>{" "}
        <span className="text-gray-500">{sublabel}</span>
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handlePick(e.target.files)}
        style={{ display: "none" }}
      />
    </div>
  );
}
