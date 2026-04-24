// Local Netlify Build plugin.
//
// Background: @netlify/plugin-nextjs writes its own function manifest at
// .netlify/functions-internal/___netlify-server-handler/___netlify-server-handler.json
// with includedFiles:["**"], includedFilesBasePath set to that same handler
// directory, and nodeBundler:"none". That manifest wins over any
// [functions."___netlify-server-handler"].included_files entry in
// netlify.toml — negated patterns there are silently ignored. The only
// reliable way to shrink this function's upload is to delete files from the
// handler directory BEFORE zip-it-and-ship-it runs. That is what this plugin
// does, in onPostBuild, which fires after @netlify/plugin-nextjs has
// populated the handler directory and before Netlify zips and uploads it.
//
// The plugin also logs the actual on-disk contents of the handler directory,
// so production deploy logs carry ground-truth size information rather than
// a locally-simulated zip.

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const HANDLER_DIR = path.join(
  ".netlify",
  "functions-internal",
  "___netlify-server-handler",
);

// Targets that are never needed at runtime on Netlify Functions
// (Amazon Linux / glibc / x64). Kept as relative paths under the handler dir.
const PRUNE_TARGETS = [
  ".git",
  "public",

  // Alpine (musl) sharp prebuilds — Lambda runs glibc.
  "node_modules/@img/sharp-libvips-linuxmusl-x64",
  "node_modules/@img/sharp-linuxmusl-x64",
  "node_modules/@img/sharp-libvips-linuxmusl-arm64",
  "node_modules/@img/sharp-linuxmusl-arm64",

  // Non-Linux sharp prebuilds.
  "node_modules/@img/sharp-darwin-arm64",
  "node_modules/@img/sharp-darwin-x64",
  "node_modules/@img/sharp-libvips-darwin-arm64",
  "node_modules/@img/sharp-libvips-darwin-x64",
  "node_modules/@img/sharp-win32-arm64",
  "node_modules/@img/sharp-win32-ia32",
  "node_modules/@img/sharp-win32-x64",

  // Non-x64 linux sharp prebuilds (Netlify Functions default to x64).
  "node_modules/@img/sharp-linux-arm",
  "node_modules/@img/sharp-linux-arm64",
  "node_modules/@img/sharp-libvips-linux-arm",
  "node_modules/@img/sharp-libvips-linux-arm64",
  "node_modules/@img/sharp-libvips-linux-s390x",
  "node_modules/@img/sharp-libvips-linux-ppc64",
];

function sh(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch {
    return "";
  }
}

function bytesOf(absPath) {
  const out = sh(`du -sb ${JSON.stringify(absPath)}`);
  const n = Number(out.split(/\s+/)[0]);
  return Number.isFinite(n) ? n : 0;
}

function mb(n) {
  return `${(n / 1e6).toFixed(2)} MB`;
}

module.exports = {
  async onPostBuild({ utils }) {
    if (!fs.existsSync(HANDLER_DIR)) {
      console.log(
        `[prune-server-handler] ${HANDLER_DIR} not found; nothing to do.`,
      );
      return;
    }

    const totalBefore = bytesOf(HANDLER_DIR);
    console.log(
      `[prune-server-handler] handler uncompressed size BEFORE: ${mb(totalBefore)}`,
    );

    console.log("[prune-server-handler] top-level entries BEFORE prune:");
    console.log(
      sh(
        `du -sh ${JSON.stringify(HANDLER_DIR)}/* 2>/dev/null | sort -h | tail -40`,
      ),
    );

    let removedBytes = 0;
    for (const rel of PRUNE_TARGETS) {
      const abs = path.join(HANDLER_DIR, rel);
      if (!fs.existsSync(abs)) continue;
      const size = bytesOf(abs);
      fs.rmSync(abs, { recursive: true, force: true });
      removedBytes += size;
      console.log(`[prune-server-handler] removed ${rel} (${mb(size)})`);
    }

    // Source maps are never used at runtime on the server; drop them.
    let mapCount = 0;
    let mapBytes = 0;
    const walk = (dir) => {
      let entries;
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const ent of entries) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          walk(p);
        } else if (ent.isFile() && ent.name.endsWith(".map")) {
          try {
            const s = fs.statSync(p).size;
            fs.unlinkSync(p);
            mapCount += 1;
            mapBytes += s;
          } catch {
            /* ignore */
          }
        }
      }
    };
    walk(HANDLER_DIR);
    if (mapCount > 0) {
      console.log(
        `[prune-server-handler] removed ${mapCount} .map file(s) (${mb(mapBytes)})`,
      );
      removedBytes += mapBytes;
    }

    const totalAfter = bytesOf(HANDLER_DIR);
    console.log(
      `[prune-server-handler] handler uncompressed size AFTER:  ${mb(totalAfter)} (freed ${mb(removedBytes)})`,
    );

    console.log(
      "[prune-server-handler] largest entries under handler AFTER prune:",
    );
    console.log(
      sh(
        `du -sh ${JSON.stringify(HANDLER_DIR)}/* 2>/dev/null | sort -h | tail -40`,
      ),
    );

    const nodeModules = path.join(HANDLER_DIR, "node_modules");
    if (fs.existsSync(nodeModules)) {
      console.log(
        "[prune-server-handler] largest entries under handler/node_modules AFTER prune:",
      );
      console.log(
        sh(
          `du -sh ${JSON.stringify(nodeModules)}/* 2>/dev/null | sort -h | tail -40`,
        ),
      );
    }
  },
};
