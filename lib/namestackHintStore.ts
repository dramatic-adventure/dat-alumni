// lib/namestackHintStore.ts
import "server-only";

import { promises as fs } from "fs";
import path from "path";

type Layout = { fSize: number; lSize: number; y1: number; y2: number; svgH: number };
type Entry = { v: string; ts: number; data: Layout };
type Store = Record<string, Entry>;

let mem: Store | null = null;
let writing = Promise.resolve(); // serialize writes

let resolvedDataDir: string | null = null;

function isBuildPhase(): boolean {
  // Next sets NEXT_PHASE during build. We must not write into .next during build-time execution.
  const phase = process.env["NEXT_PHASE"] || "";
  return phase === "phase-production-build" || phase === "phase-export";
}

function getFontVersion(): string {
  // Bracket access + runtime read to avoid bundler inlining
  const v = process.env["NAMESTACK_FONT_VERSION"];
  return (v && String(v).trim()) || "anton-v27";
}

function getMaxEntries(): number {
  const raw = process.env["NAMESTACK_MAX_ENTRIES"];
  const n = raw ? Number(raw) : 5000;
  return Number.isFinite(n) && n > 0 ? n : 5000;
}

function getTtlMs(): number {
  const raw = process.env["NAMESTACK_HINT_TTL_MS"];
  const n = raw ? Number(raw) : 7 * 24 * 60 * 60 * 1000;
  return Number.isFinite(n) && n > 0 ? n : 7 * 24 * 60 * 60 * 1000;
}

function defaultRuntimeDataDir(): string {
  // Netlify (and most serverless) allow /tmp at runtime.
  // Prefer TMPDIR if present.
  const tmp = process.env["TMPDIR"] || "/tmp";
  return path.join(tmp, "namestack");
}

function resolveDataDir(): string {
  if (resolvedDataDir) return resolvedDataDir;

  const explicit = process.env["NAMESTACK_DATA_DIR"];
  let dir: string;

  if (explicit && String(explicit).trim()) {
    dir = path.resolve(String(explicit));
  } else {
    // In production, prefer runtime-writable dir; in dev, keep local .data for convenience.
    const isProd = process.env["NODE_ENV"] === "production";
    dir = isProd ? defaultRuntimeDataDir() : path.resolve(process.cwd(), ".data");
  }

  // Hard safety: never allow .next as the storage dir.
  // This prevents secrets scanning from seeing persisted runtime state in build artifacts.
  const norm = dir.replace(/\\/g, "/");
  if (norm.includes("/.next") || norm.endsWith("/.next")) {
    dir = defaultRuntimeDataDir();
  }

  resolvedDataDir = dir;
  return dir;
}

function resolveFilePath(): string {
  return path.join(resolveDataDir(), "namestack-hints.json");
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true }).catch(() => {});
}

async function load(): Promise<Store> {
  if (mem) return mem;

  // During build, never touch the filesystem (prevents writing into .next via prerender).
  if (isBuildPhase()) {
    mem = {};
    return mem;
  }

  const dir = resolveDataDir();
  const file = resolveFilePath();

  await ensureDir(dir);
  try {
    const buf = await fs.readFile(file, "utf8");
    mem = JSON.parse(buf) as Store;
  } catch {
    mem = {};
  }
  return mem!;
}

function purgeExpired(store: Store, now = Date.now()) {
  const fontVersion = getFontVersion();
  const ttlMs = getTtlMs();
  const maxEntries = getMaxEntries();

  for (const k of Object.keys(store)) {
    const e = store[k];
    if (e.v !== fontVersion || now - e.ts > ttlMs) delete store[k];
  }

  // LRU-ish trim by ts
  const keys = Object.keys(store);
  if (keys.length > maxEntries) {
    keys.sort((a, b) => store[a].ts - store[b].ts);
    for (let i = 0; i < keys.length - maxEntries; i++) delete store[keys[i]];
  }
}

async function save(store: Store) {
  // During build, never write to disk.
  if (isBuildPhase()) return;

  const dir = resolveDataDir();
  const file = resolveFilePath();

  await ensureDir(dir);

  writing = writing
    .then(async () => {
      const tmp = file + ".tmp";
      const json = JSON.stringify(store);
      await fs.writeFile(tmp, json, "utf8");
      await fs.rename(tmp, file);
    })
    .catch(() => {});
  await writing;
}

export async function getHint(rawKey: string): Promise<Layout | null> {
  const store = await load();
  purgeExpired(store);
  const e = store[rawKey];
  const fontVersion = getFontVersion();
  return e?.v === fontVersion ? e.data : null;
}

export async function setHint(rawKey: string, data: Layout): Promise<void> {
  const store = await load();
  const fontVersion = getFontVersion();

  store[rawKey] = { v: fontVersion, ts: Date.now(), data };
  purgeExpired(store);
  await save(store);
}