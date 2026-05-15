// lib/blobConfig.ts
// Blob store for app configuration values (tokens, etc.)
// Separate from dat-fallback-csv so the two concerns don't mix.

import { getStore } from "@netlify/blobs";

const STORE_NAME = "dat-config";

export function getConfigStore() {
  return getStore(STORE_NAME);
}

// Well-known keys
export const INSTAGRAM_TOKEN_KEY = "instagram-access-token";

export async function configGet(key: string): Promise<string | null> {
  try {
    const v = await getConfigStore().get(key, { type: "text" });
    return typeof v === "string" && v.length ? v : null;
  } catch {
    return null;
  }
}

export async function configSet(key: string, value: string): Promise<boolean> {
  try {
    await getConfigStore().set(key, value);
    return true;
  } catch {
    return false;
  }
}
