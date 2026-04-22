// lib/loadRows.ts
import "server-only";

import { cache } from "react";
import { StoryRow } from "./types";
import { getSlugAliases, normSlug } from "@/lib/slugAliases";

function getApiBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.URL ||
    "http://localhost:3000";

  const trimmed = String(raw).trim().replace(/\/+$/, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  return `https://${trimmed}`;
}

// 🔄 Cached story fetcher via internal API
const loadRows = cache(async (): Promise<StoryRow[]> => {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/stories`, {
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = await res.json();
    const rows = Array.isArray(data?.stories) ? data.stories : [];

    return rows as StoryRow[];
  } catch {
    return [];
  }
});

export default loadRows;

// 🔍 Lookup by alumni author slug (CANON + alias aware)
export async function getStoriesByAlumniSlug(slug: string): Promise<StoryRow[]> {
  const incoming = normSlug(slug);
  if (!incoming) return [];

  const aliases = await getSlugAliases(incoming);
  const aliasSet = new Set(
    Array.from(aliases)
      .map((s) => normSlug(s))
      .filter(Boolean)
  );

  const rows = await loadRows();
  return rows.filter((row) => {
    const a = normSlug((row as any)?.authorSlug);
    return a ? aliasSet.has(a) : false;
  });
}

// 🔍 Lookup by story slug
export async function getStoryBySlug(slug: string): Promise<StoryRow | undefined> {
  const incoming = normSlug(slug);
  if (!incoming) return undefined;

  const rows = await loadRows();

  return rows.find((row) => {
    const rowSlug = normSlug((row as any)?.slug ?? (row as any)?.storySlug);
    return rowSlug === incoming;
  });
}

// ✅ Fetch all stories
export const getAllStories = async (): Promise<StoryRow[]> => {
  return await loadRows();
};