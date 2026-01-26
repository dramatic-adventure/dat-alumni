// lib/blobFallback.ts
import { getStore } from "@netlify/blobs";

const STORE_NAME = "dat-fallback-csv";

export function getFallbackStore() {
  return getStore(STORE_NAME);
}

export async function blobGetText(key: string): Promise<string | null> {
  try {
    const store = getFallbackStore();
    const v = await store.get(key, { type: "text" });
    return typeof v === "string" && v.length ? v : null;
  } catch {
    return null;
  }
}

export async function blobSetText(key: string, value: string): Promise<boolean> {
  try {
    if (!value) return false;
    const store = getFallbackStore();
    await store.set(key, value);
    return true;
  } catch {
    return false;
  }
}
