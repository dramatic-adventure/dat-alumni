// lib/namestackHintStore.ts
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = process.env.NAMESTACK_DATA_DIR || path.resolve(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "namestack-hints.json");
const FONT_VERSION = process.env.NAMESTACK_FONT_VERSION || "anton-v27";
const MAX_ENTRIES = Number(process.env.NAMESTACK_MAX_ENTRIES || 5000);
const TTL_MS = Number(process.env.NAMESTACK_HINT_TTL_MS || 7 * 24 * 60 * 60 * 1000); // 7d

type Layout = { fSize:number; lSize:number; y1:number; y2:number; svgH:number };
type Entry = { v:string; ts:number; data:Layout };
type Store = Record<string, Entry>;

let mem: Store | null = null;
let writing = Promise.resolve(); // serialize writes

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});
}

async function load(): Promise<Store> {
  if (mem) return mem;
  await ensureDir();
  try {
    const buf = await fs.readFile(FILE, "utf8");
    mem = JSON.parse(buf) as Store;
  } catch {
    mem = {};
  }
  return mem!;
}

function purgeExpired(store: Store, now = Date.now()) {
  for (const k of Object.keys(store)) {
    const e = store[k];
    if (e.v !== FONT_VERSION || now - e.ts > TTL_MS) delete store[k];
  }
  // LRU-ish trim by ts
  const keys = Object.keys(store);
  if (keys.length > MAX_ENTRIES) {
    keys.sort((a,b) => store[a].ts - store[b].ts);
    for (let i = 0; i < keys.length - MAX_ENTRIES; i++) delete store[keys[i]];
  }
}

async function save(store: Store) {
  // serialize writes to avoid corruption
  writing = writing.then(async () => {
    const tmp = FILE + ".tmp";
    const json = JSON.stringify(store);
    await fs.writeFile(tmp, json, "utf8");
    await fs.rename(tmp, FILE);
  }).catch(() => {});
  await writing;
}

export async function getHint(rawKey: string): Promise<Layout | null> {
  const store = await load();
  purgeExpired(store);
  const e = store[rawKey];
  return e?.v === FONT_VERSION ? e.data : null;
}

export async function setHint(rawKey: string, data: Layout): Promise<void> {
  const store = await load();
  store[rawKey] = { v: FONT_VERSION, ts: Date.now(), data };
  purgeExpired(store);
  await save(store);
}
