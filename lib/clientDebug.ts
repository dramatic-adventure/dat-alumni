// lib/clientDebug.ts
"use client";
/* eslint-disable no-console */

type Level = "debug" | "info" | "warn" | "error" | "silent";
const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40, silent: 99 };

function strToBool(v?: string | null): boolean {
  if (!v) return false;
  const s = v.toLowerCase().trim();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

/** Primary flag (public, client-safe). Also honor SHOW_DAT_DEBUG for backwards-compat. */
const enabled =
  strToBool(process.env.NEXT_PUBLIC_DEBUG_ALUMNI) ||
  strToBool(process.env.NEXT_PUBLIC_SHOW_DAT_DEBUG) ||
  strToBool(process.env.SHOW_DAT_DEBUG);

/** Optional public level override; defaults to silent unless enabled. */
const envLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL || (enabled ? "debug" : "silent")).toLowerCase() as Level;
const threshold = order[envLevel] ?? order.silent;
const should = (lvl: Level) => order[lvl] >= threshold;

export function clientDebug(...args: any[]) {
  if (should("debug")) console.log(...args);
}
export function clientInfo(...args: any[]) {
  if (should("info")) console.log(...args);
}
export function clientWarn(...args: any[]) {
  if (should("warn")) console.warn(...args);
}
export function clientError(...args: any[]) {
  if (should("error")) console.error(...args);
}

/** In case you want to read the current state elsewhere */
export const CLIENT_DEBUG_ENABLED = enabled;
