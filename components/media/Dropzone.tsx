// /components/media/Dropzone.tsx
"use client";

import { useMemo, useRef, useState } from "react";

type Reject = { file: File; reason: string };

type Props = {
  accept: string; // e.g. "image/*" or "image/*,application/pdf"
  multiple?: boolean; // default false
  onFiles: (files: File[]) => void;

  /** optional */
  onReject?: (rejected: Reject[]) => void;
  disabled?: boolean;
  maxFiles?: number; // default: (multiple ? Infinity : 1)
  maxBytesPerFile?: number; // default: Infinity
  maxTotalBytes?: number; // default: Infinity

  label?: string;
  sublabel?: string;
  className?: string;

  /** if you want drag-only in some contexts */
  allowClick?: boolean; // default true
};

function bytesToMB(n: number) {
  return Math.round((n / 1_000_000) * 10) / 10;
}

function parseAccept(accept: string) {
  // returns tokens like: ["image/*", "application/pdf", ".jpg"]
  return (accept || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function fileMatchesToken(file: File, token: string) {
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();
  const t = token.toLowerCase();

  // extension token: ".jpg"
  if (t.startsWith(".")) return name.endsWith(t);

  // wildcard mime: "image/*"
  if (t.endsWith("/*")) {
    const prefix = t.slice(0, -2);
    return type.startsWith(prefix);
  }

  // exact mime: "application/pdf"
  return type === t;
}

function fileMatchesAccept(file: File, acceptTokens: string[]) {
  if (!acceptTokens.length) return true;
  return acceptTokens.some((tok) => fileMatchesToken(file, tok));
}

export default function Dropzone({
  accept,
  multiple = false,
  onFiles,

  onReject,
  disabled = false,
  maxFiles,
  maxBytesPerFile = Number.POSITIVE_INFINITY,
  maxTotalBytes = Number.POSITIVE_INFINITY,

  label = "Choose files",
  sublabel = "or drag & drop here",
  className = "",

  allowClick = true,
}: Props) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptTokens = useMemo(() => parseAccept(accept), [accept]);
  const effectiveMaxFiles =
    typeof maxFiles === "number" ? maxFiles : multiple ? Number.POSITIVE_INFINITY : 1;

  function pick(files: FileList | null) {
    if (disabled) return;

    const arr = Array.from(files || []);
    if (!arr.length) return;

    const accepted: File[] = [];
    const rejected: Reject[] = [];
    let total = 0;

    for (const f of arr) {
      if (accepted.length >= effectiveMaxFiles) {
        rejected.push({ file: f, reason: `Too many files (max ${effectiveMaxFiles}).` });
        continue;
      }

      if (!fileMatchesAccept(f, acceptTokens)) {
        rejected.push({ file: f, reason: `File type not allowed.` });
        continue;
      }

      if (f.size > maxBytesPerFile) {
        rejected.push({
          file: f,
          reason: `File too large (${bytesToMB(f.size)} MB). Max ${bytesToMB(maxBytesPerFile)} MB.`,
        });
        continue;
      }

      if (total + f.size > maxTotalBytes) {
        rejected.push({
          file: f,
          reason: `Total upload too large. Max ${bytesToMB(maxTotalBytes)} MB.`,
        });
        continue;
      }

      accepted.push(f);
      total += f.size;
    }

    if (rejected.length) onReject?.(rejected);
    if (!accepted.length) return;

    onFiles(multiple ? accepted : accepted.slice(0, 1));

    // allow selecting same file again
    if (inputRef.current) inputRef.current.value = "";
  }

  const canInteract = !disabled && (allowClick || true);

  return (
    <div
      role={allowClick ? "button" : "group"}
      tabIndex={allowClick && !disabled ? 0 : -1}
      aria-disabled={disabled}
      onClick={() => {
        if (!allowClick || disabled) return;
        inputRef.current?.click();
      }}
      onKeyDown={(e) => {
        if (!allowClick || disabled) return;
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        setDrag(false);
        pick(e.dataTransfer.files);
      }}
      className={[
        "border-2 border-dashed rounded-md p-4 transition select-none",
        allowClick && !disabled ? "cursor-pointer" : "cursor-default",
        drag ? "border-[#6C00AF] bg-[rgba(108,0,175,0.06)]" : "border-gray-300",
        disabled ? "opacity-60" : "",
        className,
      ].join(" ")}
      style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif" }}
    >
      <p className="m-0 text-sm">
        <span className={allowClick && !disabled ? "underline" : ""}>{label}</span>{" "}
        <span className="text-gray-500">{sublabel}</span>
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled || !canInteract}
        onChange={(e) => pick(e.target.files)}
        style={{ display: "none" }}
      />
    </div>
  );
}
