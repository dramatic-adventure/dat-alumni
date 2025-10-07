// lib/serverDebug.ts
import "server-only";
/* eslint-disable no-console */
// Server-side logging helpers with env-controlled levels.

type Level = "debug" | "info" | "warn" | "error" | "silent";
const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40, silent: 99 };

// Default to "error" in production, "info" otherwise (unless SHOW_DAT_DEBUG=true)
const DEFAULT_LEVEL: Level = process.env.NODE_ENV === "production" ? "error" : "info";

const RESOLVED_LEVEL = (
  process.env.SHOW_DAT_DEBUG === "true"
    ? "debug"
    : (process.env.LOG_LEVEL || DEFAULT_LEVEL)
).toLowerCase() as Level;

const THRESHOLD = ORDER[RESOLVED_LEVEL] ?? ORDER.info;
const allows = (lvl: Level) => ORDER[lvl] >= THRESHOLD;

export const serverDebug = (...args: unknown[]) => {
  if (allows("debug")) console.debug(...args);
};
export const serverInfo = (...args: unknown[]) => {
  if (allows("info")) console.info(...args);
};
export const serverWarn = (...args: unknown[]) => {
  if (allows("warn")) console.warn(...args);
};
export const serverError = (...args: unknown[]) => {
  if (allows("error")) console.error(...args);
};
