// scripts/field-kit-roster.check.ts
//
// Standalone regression guard for Field Kit ACCESS SCOPING — the pure roster
// logic that decides who is "on the trip". Run with:
//
//     npm run verify:field-kit        (alias for `tsx scripts/field-kit-roster.check.ts`)
//
// WHY THIS EXISTS
// The Field Kit is private: only admins and artists on the program's roster may
// see it (lib/fieldKitAccess.ts). The roster is derived from lib/programMap.ts —
// the union of `artists` across every entry sharing a `cluster` key. programMap
// is hand-edited often, so the real regression risk is the DATA quietly changing
// (a member dropped, a cluster key renamed, a stranger added). This script asserts
// the roster computation against real programMap data so such a change fails loudly.
//
// SCOPE / NON-GOALS
// This checks ONLY the pure, deterministic roster math. It does NOT mock auth(),
// Sheets, or sessions — those integration boundaries are covered by the manual
// curl matrix in field-kit-PRIVACY-VERIFICATION.md, where a mock would only risk
// drifting from reality and giving false confidence.
//
// KEEP IN SYNC: computeRoster() below MIRRORS lib/fieldKitAccess.ts:clusterRoster.
// It is duplicated (not imported) because fieldKitAccess.ts is "server-only" and
// pulls in next/navigation, next/server, auth, etc., which cannot load in a plain
// node/tsx process. If you change the roster algorithm there, mirror it here.

import { programMap } from "../lib/programMap";

// ── mirror of lib/fieldKitAccess.ts ──────────────────────────────────────────
// NB: written without TS type annotations on purpose — eslint-config-next does
// not apply the TypeScript parser to scripts/, so (like the sibling
// season-slug.check.ts) this file uses plain-JS-compatible syntax. tsx still
// runs it as .ts; `npm run typecheck` doesn't cover scripts/.
function norm(s) {
  return String(s ?? "").trim().toLowerCase();
}

function computeRoster(clusterId) {
  const key = norm(clusterId);
  const slugs = new Set();
  for (const entry of Object.values(programMap)) {
    if (norm(entry.cluster ?? entry.slug) !== key) continue;
    for (const slug of Object.keys(entry.artists ?? {})) slugs.add(norm(slug));
  }
  return slugs;
}

// ── tiny assert harness ──────────────────────────────────────────────────────
let failures = 0;
function check(label, pass) {
  console.log(`${pass ? "  ok  " : " FAIL "} ${label}`);
  if (!pass) failures++;
}

// ── fixtures (real programMap values) ────────────────────────────────────────
const SLOVAKIA = "passage-slovakia-2026"; // cluster of 3 entries
const AMAZON = "site-lines-the-amazon-2022"; // unrelated standalone program

// Union of `artists` across the 3 clustered Slovakia 2026 entries.
const EXPECTED_SLOVAKIA_MEMBERS = [
  "jesse-baxter",
  "christen-madrazo",
  "jason-williamson",
  "asa-madrazo-williamson",
  "vida-madrazo-williamson",
  "christina-greene",
  "adrian-pica-borjas",
];

// Artists who belong only to the Amazon program — must NOT leak into Slovakia.
const AMAZON_ONLY = ["peter-petkovsek", "gustavo-redin", "carla-rizzo"];

console.log(`\nField Kit roster check — program "${SLOVAKIA}"\n`);

const slovakia = computeRoster(SLOVAKIA);
const amazon = computeRoster(AMAZON);

// 1. Roster is non-empty (catches a renamed/missing cluster key).
check(`roster is non-empty (got ${slovakia.size})`, slovakia.size > 0);

// 2. Every known cluster member is present (covers the cluster UNION across all
//    three Slovakia entries).
for (const m of EXPECTED_SLOVAKIA_MEMBERS) {
  check(`roster includes "${m}"`, slovakia.has(m));
}

// 3. Cross-program isolation: Amazon-only artists are NOT on the Slovakia roster.
for (const m of AMAZON_ONLY) {
  check(`roster excludes Amazon artist "${m}"`, !slovakia.has(m));
}

// 4. Empty / unknown / anonymous identities are never on the roster.
check(`roster excludes empty slug ""`, !slovakia.has(norm("")));
check(`roster excludes unknown slug "not-a-real-artist"`, !slovakia.has("not-a-real-artist"));

// 5. Lookup is case- and whitespace-insensitive (mirrors getFieldKitAccess, which
//    checks `roster.has(norm(ownedId))`).
check(`lookup normalizes "  Jesse-Baxter "`, slovakia.has(norm("  Jesse-Baxter ")));

// 6. Per-program scoping holds in BOTH directions: the Amazon roster computes
//    independently, contains its own member, and excludes the Slovakia writers.
check(`Amazon roster includes its own artist "peter-petkovsek"`, amazon.has("peter-petkovsek"));
check(`Amazon roster excludes Slovakia writer "christina-greene"`, !amazon.has("christina-greene"));
check(`Amazon roster excludes Slovakia writer "adrian-pica-borjas"`, !amazon.has("adrian-pica-borjas"));

// ── report ───────────────────────────────────────────────────────────────────
console.log(`\n${failures === 0 ? "PASS" : "FAIL"} — ${failures} failure(s)\n`);
process.exit(failures === 0 ? 0 : 1);
