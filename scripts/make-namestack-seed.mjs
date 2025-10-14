// scripts/make-namestack-seed.mjs

import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";

// Load .env.local first (preferred), then .env as fallback
const root = process.cwd();
dotenv.config({ path: path.join(root, ".env.local") });
dotenv.config(); // fallback to .env if present

const GAS_URL = process.env.NAMESTACK_GAS_URL;
const TOKEN   = process.env.NAMESTACK_TOKEN;

if (!GAS_URL || !TOKEN) {
  const hasEnvLocal = await fs
    .access(path.join(root, ".env.local"))
    .then(() => true)
    .catch(() => false);

  console.error("[seed] Missing NAMESTACK_GAS_URL or NAMESTACK_TOKEN.");
  console.error(`[seed] cwd: ${root}`);
  console.error(`[seed] .env.local present: ${hasEnvLocal}`);
  console.error(`[seed] NAMESTACK_GAS_URL set: ${!!GAS_URL}`);
  console.error(`[seed] NAMESTACK_TOKEN set: ${!!TOKEN}`);
  process.exit(1);
}

const url = `${GAS_URL}?all=1&token=${encodeURIComponent(TOKEN)}`;

let res, text;
try {
  res = await fetch(url, { redirect: "follow" });
  text = await res.text();
} catch (e) {
  console.error("[seed] Fetch error:", e);
  process.exit(1);
}

if (!res.ok) {
  console.error(`[seed] GAS HTTP ${res.status} ${res.statusText}`);
  console.error(text.slice(0, 500));
  process.exit(1);
}

let js;
try {
  js = JSON.parse(text);
} catch {
  console.error("[seed] Non-JSON response from GAS:");
  console.error(text.slice(0, 500));
  process.exit(1);
}

if (!js.ok) {
  console.error("[seed] Bad GAS response (ok=false).");
  console.error(JSON.stringify(js).slice(0, 500));
  process.exit(1);
}

// Build the key → hint map
const map = {};
for (const r of js.rows || []) {
  try {
    const val = typeof r.json === "string" ? JSON.parse(r.json) : r.json;
    if (val && typeof val === "object") map[r.key] = val;
  } catch {
    // ignore bad JSON rows
  }
}

// Write the seed file used at runtime by the client
await fs.mkdir("public", { recursive: true });
await fs.writeFile("public/namestack-hints.json", JSON.stringify(map, null, 2));

console.log(`[seed] Wrote ${Object.keys(map).length} hints → public/namestack-hints.json`);
