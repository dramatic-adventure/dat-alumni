// Prune oversized artifacts from ___netlify-server-handler before upload.
// Resolves all paths relative to the handler root and refuses to delete outside it.
"use strict";

const fs = require("fs");
const path = require("path");

// Return total bytes under a directory (synchronous, best-effort).
function dirSize(dirPath) {
  let total = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dirPath, e.name);
      if (e.isDirectory()) {
        total += dirSize(full);
      } else if (e.isFile()) {
        try {
          total += fs.statSync(full).size;
        } catch (_) {}
      }
    }
  } catch (_) {}
  return total;
}

function mb(bytes) {
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

// Recursively collect all *.map files under a directory.
function collectMapFiles(dirPath, results = []) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dirPath, e.name);
      if (e.isDirectory()) {
        collectMapFiles(full, results);
      } else if (e.isFile() && e.name.endsWith(".map")) {
        results.push(full);
      }
    }
  } catch (_) {}
  return results;
}

// Log the top-N largest immediate children of a directory by size.
function logLargestChildren(label, dirPath, topN = 25) {
  if (!fs.existsSync(dirPath)) return;
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (_) {
    return;
  }
  const sized = entries.map((e) => {
    const full = path.join(dirPath, e.name);
    let size = 0;
    if (e.isDirectory()) {
      size = dirSize(full);
    } else {
      try { size = fs.statSync(full).size; } catch (_) {}
    }
    return { name: e.name, size };
  });
  sized.sort((a, b) => b.size - a.size);
  const top = sized.slice(0, topN);
  console.log(`\n[prune-server-handler] ${label} (${top.length} entries):`);
  for (const { name, size } of top) {
    console.log(`  ${mb(size).padStart(9)}  ${name}`);
  }
}

// Remove a path (file or directory) and return bytes freed.
function removePath(target, handlerRoot, utils) {
  // Safety: resolved target must be inside handlerRoot.
  const resolved = path.resolve(target);
  const root = path.resolve(handlerRoot);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    utils.build.failPlugin(`SAFETY: refusing to delete outside handler: ${resolved}`);
    return 0;
  }
  let freed = 0;
  try {
    const stat = fs.statSync(resolved);
    freed = stat.isDirectory() ? dirSize(resolved) : stat.size;
    fs.rmSync(resolved, { recursive: true, force: true });
    console.log(`  deleted ${path.relative(root, resolved)} (${mb(freed)})`);
  } catch (e) {
    console.log(`  skip ${path.relative(root, resolved)}: ${e.message}`);
  }
  return freed;
}

module.exports = {
  onPostBuild: async ({ utils }) => {
    const HANDLER_DIR = path.resolve(
      ".netlify",
      "functions-internal",
      "___netlify-server-handler"
    );

    if (!fs.existsSync(HANDLER_DIR)) {
      console.log("[prune-server-handler] handler dir not found — skipping.");
      return;
    }

    const before = dirSize(HANDLER_DIR);
    console.log(`[prune-server-handler] handler size before: ${mb(before)}`);

    let totalFreed = 0;

    // 1. .git inside handler (should never exist, but cheap insurance)
    const gitDir = path.join(HANDLER_DIR, ".git");
    if (fs.existsSync(gitDir)) {
      totalFreed += removePath(gitDir, HANDLER_DIR, utils);
    }

    // 2. public/ — selectively prune children not needed by server fs reads.
    //    Keep: fallback/ (loadCsv.ts reads CSV via fs.readFile at runtime)
    //          seasons/  (season page uses fs.access to test hero image existence)
    //    Delete everything else (posters, images, fonts, texture, icons, etc.)
    //    — those are URL-path references only, served by Netlify CDN static deploy.
    const PUBLIC_SAFELIST = new Set(["fallback", "seasons"]);
    const publicDir = path.join(HANDLER_DIR, "public");
    if (fs.existsSync(publicDir)) {
      let publicEntries;
      try {
        publicEntries = fs.readdirSync(publicDir, { withFileTypes: true });
      } catch (_) {
        publicEntries = [];
      }
      const kept = [];
      for (const e of publicEntries) {
        if (PUBLIC_SAFELIST.has(e.name)) {
          kept.push(e.name);
        } else {
          totalFreed += removePath(path.join(publicDir, e.name), HANDLER_DIR, utils);
        }
      }
      if (kept.length) {
        console.log(`  kept public/ children: ${kept.join(", ")}`);
      }
    } else {
      console.log("  skipping public/ (not found in handler)");
    }

    // 3. Wrong-platform Sharp native binaries under node_modules/@img.
    //    Keep: sharp-linux-x64, sharp-libvips-linux-x64
    //    Delete: everything else (darwin-*, arm64-*, wasm32-*)
    const imgDir = path.join(HANDLER_DIR, "node_modules", "@img");
    if (fs.existsSync(imgDir)) {
      let entries;
      try {
        entries = fs.readdirSync(imgDir, { withFileTypes: true });
      } catch (_) {
        entries = [];
      }
      const keep = new Set(["sharp-linux-x64", "sharp-libvips-linux-x64"]);
      for (const e of entries) {
        if (e.isDirectory() && !keep.has(e.name)) {
          totalFreed += removePath(path.join(imgDir, e.name), HANDLER_DIR, utils);
        }
      }
    }

    // 4. *.map files anywhere in the handler.
    const mapFiles = collectMapFiles(HANDLER_DIR);
    for (const f of mapFiles) {
      totalFreed += removePath(f, HANDLER_DIR, utils);
    }

    const after = dirSize(HANDLER_DIR);
    console.log(
      `[prune-server-handler] freed ${mb(totalFreed)} — handler size after: ${mb(after)}`
    );

    // Diagnostic: show what remains large after pruning.
    logLargestChildren("largest handler children after pruning", HANDLER_DIR);
    logLargestChildren(
      "largest node_modules children after pruning",
      path.join(HANDLER_DIR, "node_modules")
    );
    logLargestChildren(
      "largest @prisma children after pruning",
      path.join(HANDLER_DIR, "node_modules", "@prisma")
    );
    logLargestChildren(
      "largest @img children after pruning",
      path.join(HANDLER_DIR, "node_modules", "@img")
    );
    logLargestChildren(
      "largest .next children after pruning",
      path.join(HANDLER_DIR, ".next")
    );
    logLargestChildren(
      "largest public children after pruning",
      path.join(HANDLER_DIR, "public")
    );
  },
};
