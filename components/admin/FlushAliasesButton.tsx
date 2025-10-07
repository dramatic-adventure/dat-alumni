// components/admin/FlushAliasesButton.tsx
"use client";
import { useState } from "react";

export default function FlushAliasesButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        setMsg(null);
        try {
          const res = await fetch("/api/admin/flush-slug-aliases?deep=1");
          const json = await res.json();
          setMsg(json.ok ? "Aliases flushed." : `Error: ${json.error || "unknown"}`);
        } finally {
          setBusy(false);
        }
      }}
      className="rounded-md px-3 py-2 bg-indigo-600 text-white disabled:opacity-50"
    >
      {busy ? "Flushing…" : "Flush slug aliases"}
    </button>
  );
}
