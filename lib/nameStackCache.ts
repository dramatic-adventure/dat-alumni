// lib/nameStackCache.ts
// Tiered hint cache: localStorage -> static seed (/namestack-hints.json) -> optional Google Sheet via API proxy
// Zero FS. Safe in dev & prod. Works on Netlify.

export type NameStackHint = {
  fSize: number; lSize: number; y1: number; y2: number; svgH: number;
  stage?: "fallback" | "final";
};

const LOCAL_PREFIX = "NS|";                         // your keys already begin with NS|
const SEED_URL = "/namestack-hints.json";          // served from /public
const SHEET_API = "/api/namestack-hint";           // Next route that proxies to Apps Script if configured

// ---- Lightweight debug without console.* (keeps ESLint happy) ----
const NS_DEBUG =
  (typeof window !== "undefined" && (window as any).__NS_DEBUG__ === true) ||
  (typeof process !== "undefined" && (process as any).env?.NS_DEBUG === "1");

function dbg(tag: string, key: string, payload?: unknown) {
  if (!NS_DEBUG || typeof window === "undefined") return;
  try {
    const w = window as any;
    w.__NS_TRACE__ = w.__NS_TRACE__ || [];
    w.__NS_TRACE__.push({ t: Date.now(), tag, key, payload });
    w.dispatchEvent?.(new CustomEvent("namestack:trace", { detail: { tag, key, payload } }));
  } catch {
    /* noop */
  }
}

// ---- Local Storage (sync) ----
export function getLocalHint(key: string): NameStackHint | null {
  try {
    const v = localStorage.getItem(key);
    if (!v) return null;
    const js = JSON.parse(v);
    if (validHint(js)) return js;
  } catch {}
  return null;
}
export function setLocalHint(key: string, data: NameStackHint) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function validHint(d: any): d is NameStackHint {
  if (!d) return false;
  const nums = [d.fSize, d.lSize, d.y1, d.y2, d.svgH];
  return nums.every((n) => Number.isFinite(n) && Math.abs(n) < 1e6);
}

// ---- Static Seed (singleton) ----
let seedMapPromise: Promise<Record<string, NameStackHint> | null> | null = null;
async function loadSeedMap(): Promise<Record<string, NameStackHint> | null> {
  if (seedMapPromise) return seedMapPromise;
  seedMapPromise = (async () => {
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 150);
      const res = await fetch(SEED_URL, { signal: c.signal, cache: "force-cache" });
      clearTimeout(t);
      if (!res.ok) return null;
      const js = (await res.json().catch(() => null)) as Record<string, NameStackHint> | null;
      return js && typeof js === "object" ? js : null;
    } catch {
      return null;
    }
  })();
  return seedMapPromise;
}
async function getSeedHint(key: string): Promise<NameStackHint | null> {
  const map = await loadSeedMap();
  const hit = map?.[key];
  return validHint(hit) ? (hit as NameStackHint) : null;
}

// ---- Google Sheet via API proxy (optional) ----
async function getSheetHint(key: string): Promise<NameStackHint | null> {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 180);
    const res = await fetch(`${SHEET_API}?key=${encodeURIComponent(key)}`, {
      signal: c.signal,
      cache: "no-store",
      credentials: "same-origin",
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const js = (await res.json().catch(() => null)) as any;
    const data = js?.data;
    return validHint(data) ? (data as NameStackHint) : null;
  } catch {
    return null;
  }
}

export async function postSheetHint(key: string, data: NameStackHint) {
  try {
    // fire-and-forget (keepalive for SPA navigations)
    fetch(SHEET_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      keepalive: true,
      body: JSON.stringify({ key, data }),
    }).catch(() => {});
  } catch {}
}

// ---- Tiered getter (sync + async) ----
// Use pattern:
//   const local = getHintSync(key); if(local) apply immediately;
//   getHintAsync(key).then(hit => hit && apply(hit));
export function getHintSync(key: string): NameStackHint | null {
  const local = getLocalHint(key);
  if (local) dbg("hint local", key, local);
  return local;
}

export async function getHintAsync(key: string): Promise<NameStackHint | null> {
  // try seed first (fast/static), then sheet (global), short-circuit on hit
  const fromSeed = await getSeedHint(key);
  if (fromSeed) {
    dbg("hint seed", key, fromSeed);
    // persist to localStorage so subsequent pages are instant
    try { setLocalHint(key, fromSeed); } catch {}
    return fromSeed;
  }
  const fromSheet = await getSheetHint(key);
  if (fromSheet) {
    dbg("hint sheet", key, fromSheet);
    // persist sheet hit locally so the next nav is instant
    try { setLocalHint(key, fromSheet); } catch {}
    return fromSheet;
  }
  return null;
}

// ---- Tiered setter ----
export function setHint(key: string, data: NameStackHint) {
  if (!validHint(data)) return;
  setLocalHint(key, data);
  postSheetHint(key, data);
  dbg("setHint", key, data);
}

// ---- Utilities for warming/clearing (optional) ----
export async function warmLocalFromSeed(prefix = LOCAL_PREFIX) {
  const map = await loadSeedMap();
  if (!map) return;
  Object.entries(map).forEach(([k, v]) => {
    if (k.startsWith(prefix) && validHint(v) && getLocalHint(k) == null) {
      setLocalHint(k, v);
    }
  });
}
export function clearLocal(prefix = LOCAL_PREFIX) {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((k) => { if (k.startsWith(prefix)) localStorage.removeItem(k); });
  } catch {}
}
