"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { EnrichedProfileLiveRow } from "@/components/alumni/AlumniSearch/enrichAlumniData.server";

type HeadshotInfo = { url: string; cacheKey?: string | number };

const HeadshotContext = createContext<Map<string, HeadshotInfo> | null>(null);

const norm = (s: string) => String(s || "").trim().toLowerCase();

/**
 * If the URL is our proxy (/api/img?...), ensure it includes a version param
 * so CDN/browser caching can be safely "immutable" without serving stale headshots.
 *
 * - Only touches /api/img URLs
 * - Does nothing if v= or cacheKey= is already present
 * - Returns a relative URL (keeps "/api/img?...") even after URL() parsing
 */
function ensureProxyVersionParam(rawUrl: string, cacheKey?: string | number) {
  const u0 = String(rawUrl || "").trim();
  if (!u0) return "";

  const v = cacheKey == null || cacheKey === "" ? "" : String(cacheKey);
  if (!v) return u0;

  // Only append for our proxy route
  if (!u0.startsWith("/api/img")) return u0;

  try {
    const u = new URL(u0, "http://local"); // base required for relative paths
    if (!u.searchParams.get("v") && !u.searchParams.get("cacheKey")) {
      u.searchParams.set("v", v);
    }
    return u.pathname + (u.search || "");
  } catch {
    return u0;
  }
}

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

      const rawUrl = String((r as any)?.headshotUrl || "").trim();
      const cacheKey = (r as any)?.headshotCacheKey;

      if (!rawUrl) continue;

      // ✅ Ensure /api/img URLs include v=cacheKey unless already present
      const url = ensureProxyVersionParam(rawUrl, cacheKey);

      if (canon) m.set(canon, { url, cacheKey });
      if (raw) m.set(raw, { url, cacheKey });
    }

    return m;
  }, [enrichedData]);

  return (
    <HeadshotContext.Provider value={map}>
      {children}
    </HeadshotContext.Provider>
  );
}

export function useHeadshot(slug: string): HeadshotInfo | null {
  const m = useContext(HeadshotContext);
  if (!m) return null;
  return m.get(norm(slug)) ?? null;
}
