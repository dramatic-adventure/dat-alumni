// scripts/fix-logging.mjs
// Usage: node scripts/fix-logging.mjs lib/fetchStories.ts lib/loadAlumni.ts lib/loadMapStories.ts
import fs from "node:fs";

const IMPORT_LINE =
  'import { serverDebug, serverInfo, serverWarn, serverError } from "@/lib/serverDebug";';

function insertImport(content) {
  // Keep "use server" / "use client" at the very top if present
  const lines = content.split(/\r?\n/);
  let i = 0;

  // Skip top directives like "use server" / "use client"
  while (i < lines.length && /^["']use (server|client)["'];?\s*$/.test(lines[i].trim())) i++;

  // Advance through existing import lines
  while (i < lines.length && /^\s*import\s.+from\s.+;?\s*$/.test(lines[i])) i++;

  // If already imported, no-op
  if (content.includes('from "@/lib/serverDebug"')) return content;

  lines.splice(i, 0, IMPORT_LINE);
  return lines.join("\n");
}

function replaceConsoles(src) {
  // Replace console.* with server* helpers (keep args intact)
  return src
    .replace(/(^|\s)console\.log\s*\(/g, "$1serverDebug(")
    .replace(/(^|\s)console\.info\s*\(/g, "$1serverInfo(")
    .replace(/(^|\s)console\.warn\s*\(/g, "$1serverWarn(")
    .replace(/(^|\s)console\.error\s*\(/g, "$1serverError(");
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: node scripts/fix-logging.mjs <file1> <file2> ...");
  process.exit(1);
}

for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  let out = insertImport(src);
  out = replaceConsoles(out);
  fs.writeFileSync(f, out, "utf8");
  console.log(`✅ fixed ${f}`);
}
