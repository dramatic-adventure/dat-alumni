"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { EnrichedProfileLiveRow } from "@/components/alumni/AlumniSearch/enrichAlumniData.server";

type HeadshotInfo = { url: string; cacheKey?: string | number };

const HeadshotContext = createContext<Map<string, HeadshotInfo> | null>(null);

const norm = (s: string) => String(s || "").trim().toLowerCase();

export function HeadshotProvider({
  enrichedData,
  children,
}: {
  enrichedData: EnrichedProfileLiveRow[];
  children: React.ReactNode;
}) {
  const map = useMemo(() => {
    const m = new Map<string, HeadshotInfo>();

    for (const r of enrichedData || []) {
      const canon = norm((r as any)?.canonicalSlug || "");
      const raw = norm((r as any)?.slug || "");
      const url = String((r as any)?.headshotUrl || "").trim();
      const cacheKey = (r as any)?.headshotCacheKey;

      if (!url) continue;

      if (canon) m.set(canon, { url, cacheKey });
      if (raw) m.set(raw, { url, cacheKey });
    }

    return m;
  }, [enrichedData]);

  return <HeadshotContext.Provider value={map}>{children}</HeadshotContext.Provider>;
}

export function useHeadshot(slug: string): HeadshotInfo | null {
  const m = useContext(HeadshotContext);
  if (!m) return null;
  return m.get(norm(slug)) ?? null;
}
