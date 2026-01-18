"use client";

import { useMemo } from "react";
import type { AlumniProfile } from "@/schemas";
import {
  PROFILE_FIELDS,
  PROFILE_GROUPS,
  type FieldDef,
} from "@/components/alumni/fields";

/** ─────────────────────────────────────────────────────────────
 * Small path helpers for nested keys like "story.title"
 * ────────────────────────────────────────────────────────────*/
function getByPath<T extends object>(obj: T, path: string) {
  if (!path) return undefined as unknown as any;
  return path
    .split(".")
    .reduce<any>((acc, k) => (acc ? acc[k] : undefined), obj as any);
}

function setByPath<T extends object>(obj: T, path: string, value: any): T {
  const parts = path.split(".");
  const clone = structuredClone(obj) as any;
  let cur = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] == null || typeof cur[p] !== "object") cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
  return clone as T;
}

/** Basic URL normalization */
function normalizeUrl(s: string) {
  if (!s) return s;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

/** Constraint helpers */
function clampLen(s: string, max?: number) {
  if (!max || !s) return s;
  return s.length > max ? s.slice(0, max) : s;
}

/** Placeholder helpers */
function toPlaceholderValue(v: any) {
  if (v == null) return "";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return String(v);
}

function isBlank(v: any) {
  if (v == null) return true;
  if (typeof v === "string") return v.trim().length === 0;
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

/** Render a single field */
function FieldRow({
  def,
  value,
  onChange,
  baseline,
}: {
  def: FieldDef;
  value: AlumniProfile;
  onChange: (next: AlumniProfile) => void;
  baseline?: AlumniProfile | null;
}) {
  const path = def.path || (def.key as string);
  const raw = getByPath(value, path);

  // Baseline value used ONLY for placeholder / “Currently saved”
  const baseRaw = baseline ? getByPath(baseline, path) : undefined;

  const commonLabel = (
    <label className="block mb-1 text-[11px] tracking-wider uppercase text-gray-600 font-medium">
      {def.label}
      {def.required ? <span className="ml-1 text-red-500">*</span> : null}
    </label>
  );

  const help = def.help ? (
    <p className="mt-1 text-xs text-gray-500">{def.help}</p>
  ) : null;

  const counter =
    typeof def.maxLen === "number" &&
    (def.kind === "text" || def.kind === "textarea") ? (
      <div className="mt-1 text-[11px] text-gray-400 text-right">
        {String(raw || "").length}/{def.maxLen}
      </div>
    ) : null;

  // If draft is blank, use baseline as placeholder fallback.
  // Never overwrite draft; this is purely display guidance.
  const computedPlaceholder =
  isBlank(raw) ? (toPlaceholderValue(baseRaw) || def.placeholder) : def.placeholder;

  // For UI controls where placeholder isn’t meaningful, show “Currently saved…”
  const showCurrentLine =
    isBlank(raw) &&
    !isBlank(baseRaw) &&
    (def.kind === "toggle" ||
      def.kind === "select" ||
      def.kind === "multiselect" ||
      def.kind === "chips" ||
      def.kind === "date");

  function update(v: any) {
    let val = v;

    // Normalize by kind
    if (def.kind === "url" && typeof val === "string" && val.trim()) {
      val = normalizeUrl(val.trim());
    }
    if (
      (def.kind === "text" || def.kind === "textarea") &&
      typeof val === "string"
    ) {
      val = clampLen(val, def.maxLen);
    }
    if (def.kind === "email" && typeof val === "string") {
      val = val.trim();
    }

    onChange(setByPath(value, path, val));
  }

  const currentLine = showCurrentLine ? (
    <p className="mt-1 text-[11px] text-gray-400">
      Currently saved:{" "}
      <span className="text-gray-600 font-medium">
        {toPlaceholderValue(baseRaw)}
      </span>
    </p>
  ) : null;

  // Render by kind
  switch (def.kind) {
    case "text":
    case "url":
    case "email":
      return (
        <div className="mb-4">
          {commonLabel}
          <input
            type={def.kind === "email" ? "email" : "text"}
            value={(raw ?? "") as any}
            onChange={(e) => update(e.target.value)}
            placeholder={computedPlaceholder}
            className="w-full h-11 rounded-xl border border-gray-200 px-3 focus:outline-none focus:ring-4 focus:ring-purple-200"
          />
          {help}
          {currentLine}
          {counter}
        </div>
      );

    case "textarea":
      return (
        <div className="mb-4">
          {commonLabel}
          <textarea
            value={(raw ?? "") as any}
            onChange={(e) => update(e.target.value)}
            placeholder={computedPlaceholder}
            className="w-full min-h-[120px] rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-4 focus:ring-purple-200"
          />
          {help}
          {currentLine}
          {counter}
        </div>
      );

    case "toggle":
      return (
        <div className="mb-4">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(raw)}
              onChange={(e) => update(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm text-gray-700">{def.label}</span>
          </label>
          {help}
          {currentLine}
        </div>
      );

    case "select":
      return (
        <div className="mb-4">
          {commonLabel}
          <select
            value={(raw ?? "") as any}
            onChange={(e) => update(e.target.value)}
            className="w-full h-11 rounded-xl border border-gray-200 px-3 bg-white focus:outline-none focus:ring-4 focus:ring-purple-200"
          >
            <option value="">{def.placeholder ?? "Select…"}</option>
            {(def.options ?? []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {help}
          {currentLine}
        </div>
      );

    case "multiselect":
      return (
        <div className="mb-4">
          {commonLabel}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border border-gray-200 p-3">
            {(def.options ?? []).map((opt) => {
              const arr: string[] = Array.isArray(raw) ? raw : [];
              const checked = arr.includes(opt.value);
              return (
                <label key={opt.value} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next = new Set(arr);
                      if (e.target.checked) next.add(opt.value);
                      else next.delete(opt.value);
                      update(Array.from(next));
                    }}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-gray-800">{opt.label}</span>
                </label>
              );
            })}
          </div>
          {help}
          {currentLine}
        </div>
      );

    case "chips": {
      const arr: string[] =
        Array.isArray(raw)
          ? raw
          : typeof raw === "string" && raw.trim()
          ? raw
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [];
      return (
        <div className="mb-4">
          {commonLabel}
          <textarea
            value={arr.join(", ")}
            onChange={(e) =>
              update(
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
            placeholder={computedPlaceholder ?? "Comma-separated items"}
            className="w-full min-h-[80px] rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-4 focus:ring-purple-200"
          />
          {help}
          {currentLine}
        </div>
      );
    }

    case "date":
      return (
        <div className="mb-4">
          {commonLabel}
          <input
            type="date"
            value={(raw ?? "") as any}
            onChange={(e) => update(e.target.value)}
            className="w-full h-11 rounded-xl border border-gray-200 px-3 focus:outline-none focus:ring-4 focus:ring-purple-200"
          />
          {help}
          {currentLine}
        </div>
      );

    default:
      return null;
  }
}

/** Public component
 * - fields: defaults to PROFILE_FIELDS
 * - groups: optional sectioning (defaults to PROFILE_GROUPS)
 */
export default function FieldRenderer({
  value,
  onChange,
  baseline, // ✅ NEW: baseline Profile-Live snapshot for placeholders
  fields = PROFILE_FIELDS,
  groups = PROFILE_GROUPS,
}: {
  value: AlumniProfile;
  onChange: (next: AlumniProfile) => void;
  baseline?: AlumniProfile | null;
  fields?: FieldDef[];
  groups?: Record<string, string[]>;
}) {
  // Index field defs by key/path for grouping
  const byKey = useMemo(() => {
    const map = new Map<string, FieldDef>();
    for (const f of fields) {
      const k = (f.path || (f.key as string)) as string;
      map.set(k, f);
    }
    return map;
  }, [fields]);

  const sections = useMemo(() => {
    const res: Array<{ title: string; defs: FieldDef[] }> = [];
    if (!groups) {
      res.push({ title: "Fields", defs: fields });
      return res;
    }
    for (const [title, keys] of Object.entries(groups)) {
      const defs = keys.map((k) => byKey.get(k)).filter(Boolean) as FieldDef[];
      if (defs.length) res.push({ title, defs });
    }
    return res;
  }, [groups, fields, byKey]);

  return (
    <div className="space-y-8">
      {sections.map((sec) => (
        <section
          key={sec.title}
          className="rounded-2xl bg-white shadow-card p-6 border border-gray-100"
        >
          <h3 className="text-base font-semibold mb-4 tracking-wide text-gray-900">
            {sec.title}
          </h3>
          {sec.defs.map((def) => (
            <FieldRow
              key={(def.path || (def.key as string)) as string}
              def={def}
              value={value}
              onChange={onChange}
              baseline={baseline} // ✅ pass through
            />
          ))}
        </section>
      ))}
    </div>
  );
}
