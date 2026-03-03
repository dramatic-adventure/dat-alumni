// lib/serverDebug.ts
import "server-only";
/* eslint-disable no-console */

// Server-side logging helpers with env-controlled levels,
// plus CI/build hard-silencing + secret redaction.
//
// Goals:
// - Never emit logs during `next build` (especially on Netlify/CI).
// - Never print raw env var values (URLs/tokens/secrets) even in dev.
// - Keep local dev debugging useful when SHOW_DAT_DEBUG=true.

import util from "node:util";

type Level = "debug" | "info" | "warn" | "error" | "silent";

const ORDER: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 99,
};

// Default to "error" in production, "info" otherwise (unless SHOW_DAT_DEBUG=true)
const DEFAULT_LEVEL: Level =
  process.env.NODE_ENV === "production" ? "error" : "info";

// --- Hard stop for CI / Netlify / build phase --------------------------------

function isNextBuildPhase() {
  // Next.js uses NEXT_PHASE, but values can vary by version/runtime.
  // Any "build" phase should be silent.
  const phase = process.env.NEXT_PHASE || "";
  return phase.includes("build") || phase === "phase-production-build";
}

function isCI() {
  // Broad CI detection. Netlify commonly sets NETLIFY + CONTEXT + DEPLOY_URL.
  return (
    process.env.CI === "true" || 
    process.env.CI === "1" ||
    process.env.NETLIFY === "true" ||
    typeof process.env.CONTEXT === "string" ||
    typeof process.env.DEPLOY_URL === "string" ||
    typeof process.env.BRANCH === "string"
  );
}

const HARD_SILENT = isCI() || isNextBuildPhase();

// Resolve log level, but force silent in CI/build
const RESOLVED_LEVEL = (
  HARD_SILENT
    ? "silent"
    : process.env.SHOW_DAT_DEBUG === "true"
      ? "debug"
      : process.env.DAT_LOG_LEVEL || DEFAULT_LEVEL
).toLowerCase() as Level;

const THRESHOLD = ORDER[RESOLVED_LEVEL] ?? ORDER.info;
const allows = (lvl: Level) => ORDER[lvl] >= THRESHOLD;

// --- Secret redaction ---------------------------------------------------------

type DebugArg = unknown;

function collectSecretValues(): string[] {
  // Collect likely-secret env values so we can redact them if they ever
  // accidentally get passed into logs.
  const keys = Object.keys(process.env);

  const likelySecretKey = (k: string) =>
    /(_URL|_URI|_KEY|_SECRET|_TOKEN|_PASSWORD|STRIPE|DATABASE_URL)$/i.test(k);

  const vals: string[] = [];

  for (const k of keys) {
    if (!likelySecretKey(k)) continue;
    const v = process.env[k];
    if (!v) continue;
    // ignore tiny strings to avoid over-redacting common short values
    if (v.length < 8) continue;
    vals.push(v);
  }

  // longest-first so substring replacements don’t leak parts
  vals.sort((a, b) => b.length - a.length);

  return vals;
}

const SECRET_VALUES = HARD_SILENT ? [] : collectSecretValues();

function redactString(s: string): string {
  let out = s;

  // Redact full secret values if they appear anywhere.
  for (const secret of SECRET_VALUES) {
    if (!secret) continue;
    if (out.includes(secret)) out = out.split(secret).join("[REDACTED]");
  }

  // Also mask common URL query params if the string is a URL.
  try {
    const u = new URL(out);
    const paramsToMask = ["key", "token", "sig", "signature", "password", "auth"];
    for (const p of paramsToMask) {
      if (u.searchParams.has(p)) u.searchParams.set(p, "[REDACTED]");
    }
    out = u.toString();
  } catch {
    // not a URL; ignore
  }

  return out;
}

function sanitize(arg: DebugArg): DebugArg {
  if (typeof arg === "string") return redactString(arg);

  if (arg instanceof Error) {
    // Keep useful info, but redact message/stack just in case
    return {
      name: arg.name,
      message: redactString(arg.message),
      stack: arg.stack ? redactString(arg.stack) : undefined,
    };
  }

  // For objects, inspect with limited depth and redact any strings in output.
  const inspected = util.inspect(arg, { depth: 4, breakLength: 120 });
  return redactString(inspected);
}

function safeArgs(args: DebugArg[]) {
  // If we are logging at all, sanitize everything.
  return args.map(sanitize);
}

// --- Public API (keeps your existing exports) --------------------------------

export const serverDebug = (...args: DebugArg[]) => {
  if (!allows("debug")) return;
  console.debug(...safeArgs(args));
};

export const serverInfo = (...args: DebugArg[]) => {
  if (!allows("info")) return;
  console.info(...safeArgs(args));
};

export const serverWarn = (...args: DebugArg[]) => {
  if (!allows("warn")) return;
  console.warn(...safeArgs(args));
};

export const serverError = (...args: DebugArg[]) => {
  if (!allows("error")) return;
  console.error(...safeArgs(args));
};

// --- Helpers to log env status WITHOUT revealing values -----------------------

/**
 * Log ONLY "status" for an env var without exposing its value.
 * Example: serverDebugEnv("SLUGS_CSV_URL")
 */
export const serverDebugEnv = (envKey: string) => {
  if (!allows("debug")) return;

  const v = process.env[envKey];
  const status = v ? `set (len=${v.length})` : "unset";

  // If it looks like a URL, log only host + pathname (no query, no full value)
  let hint: string | undefined;
  if (v) {
    try {
      const u = new URL(v);
      // Force-drop query/hash
      u.search = "";
      u.hash = "";
      hint = `${u.host}${u.pathname}`;
    } catch {
      // not a URL
    }
  }

  console.debug(`[DAT_DEBUG] env:${envKey} → ${status}${hint ? ` (${hint})` : ""}`);
};

/**
 * Log which env key was selected (branch), without logging the env value.
 * Example: serverDebugBranch("csvUrl", ["ALUMNI_CSV_URL", "NEXT_PUBLIC_ALUMNI_CSV_URL"])
 */
export const serverDebugBranch = (label: string, keys: string[]) => {
  if (!allows("debug")) return;

  const chosen = keys.find((k) => {
    const v = process.env[k];
    return typeof v === "string" && v.trim().length > 0;
  });

  console.debug(`[DAT_DEBUG] ${label} source → ${chosen ?? "DEFAULT_FALLBACK"}`);
};
