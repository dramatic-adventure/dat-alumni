"use client";

import { useMemo } from "react";
import type { AlumniProfile } from "@/schemas";
import type { FieldDef } from "@/components/alumni/fields";

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
  const computedPlaceholder = isBlank(raw)
    ? toPlaceholderValue(baseRaw) || def.placeholder
    : def.placeholder;

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

    // Normalize toggles to Live-friendly cell strings
    if (def.kind === "toggle") {
      val = val ? "true" : "";
    }

    // Normalize select/multiselect/chips into comma-separated strings if arrays
    if ((def.kind === "multiselect" || def.kind === "chips") && Array.isArray(val)) {
      val = val.join(", ");
    }

    const next = setByPath(value, path, val);
    onChange(next);
  }

  // --- UI renderers (keep simple, resilient) ---
  const baseLine =
    showCurrentLine ? (
      <p className="mt-1 text-xs text-gray-500">
        Currently saved: <span className="font-medium">{toPlaceholderValue(baseRaw)}</span>
      </p>
    ) : null;

  const commonInputClass =
    "w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-[15px] text-[#241123] shadow-sm outline-none focus:ring-2 focus:ring-black/10";

  const wrapClass = "rounded-2xl bg-white/70 p-3";

  const renderTextLike = (type: "text" | "email" | "url" = "text") => (
    <div className={wrapClass}>
      {commonLabel}
      <input
        type={type}
        value={typeof raw === "string" ? raw : toPlaceholderValue(raw)}
        placeholder={computedPlaceholder || ""}
        className={commonInputClass}
        onChange={(e) => update(e.target.value)}
      />
      {baseLine}
      {help}
      {counter}
    </div>
  );

  const renderTextarea = () => (
    <div className={wrapClass}>
      {commonLabel}
      <textarea
        value={typeof raw === "string" ? raw : toPlaceholderValue(raw)}
        placeholder={computedPlaceholder || ""}
        className={commonInputClass}
        rows={def.maxLen && def.maxLen > 180 ? 7 : 5}
        onChange={(e) => update(e.target.value)}
      />
      {baseLine}
      {help}
      {counter}
    </div>
  );

  const renderDate = () => (
    <div className={wrapClass}>
      {commonLabel}
      <input
        type="date"
        value={typeof raw === "string" ? raw : ""}
        className={commonInputClass}
        onChange={(e) => update(e.target.value)}
      />
      {baseLine}
      {help}
    </div>
  );

  const renderToggle = () => {
    const checked = String(raw || "").toLowerCase() === "true" || raw === true;
    return (
      <div className={wrapClass}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] tracking-wider uppercase text-gray-600 font-medium">
              {def.label}
              {def.required ? <span className="ml-1 text-red-500">*</span> : null}
            </div>
            {help}
            {baseLine}
          </div>

          <button
            type="button"
            className={[
              "h-8 w-14 rounded-full border transition",
              checked ? "bg-black/80 border-black/20" : "bg-black/5 border-black/10",
            ].join(" ")}
            onClick={() => update(!checked)}
            aria-pressed={checked}
          >
            <span
              className={[
                "block h-7 w-7 rounded-full bg-white shadow-sm transition",
                checked ? "translate-x-6" : "translate-x-1",
              ].join(" ")}
            />
          </button>
        </div>
      </div>
    );
  };

  const renderSelect = () => (
    <div className={wrapClass}>
      {commonLabel}
      <select
        value={typeof raw === "string" ? raw : ""}
        className={commonInputClass}
        onChange={(e) => update(e.target.value)}
      >
        <option value="">{computedPlaceholder ? computedPlaceholder : "Select…"}</option>
        {(def.options ?? []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {baseLine}
      {help}
    </div>
  );

  // If options exist, render pill toggles; otherwise comma-separated text input
  const renderMulti = () => {
    const hasOptions = Array.isArray(def.options) && def.options.length > 0;

    const current = (Array.isArray(raw) ? raw.join(", ") : String(raw || ""))
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!hasOptions) {
      return (
        <div className={wrapClass}>
          {commonLabel}
          <input
            type="text"
            value={String(raw || "")}
            placeholder={computedPlaceholder || "Comma-separated"}
            className={commonInputClass}
            onChange={(e) => update(e.target.value)}
          />
          {baseLine}
          {help}
        </div>
      );
    }

    const toggle = (v: string) => {
      const set = new Set(current);
      if (set.has(v)) set.delete(v);
      else set.add(v);
      update(Array.from(set));
    };

    return (
      <div className={wrapClass}>
        {commonLabel}
        <div className="flex flex-wrap gap-2">
          {(def.options ?? []).map((o) => {
            const on = current.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                className={[
                  "rounded-full px-3 py-1 text-sm border transition",
                  on ? "bg-black/80 text-white border-black/20" : "bg-white/70 text-[#241123] border-black/10",
                ].join(" ")}
              >
                {on ? "✓ " : ""}
                {o.label}
              </button>
            );
          })}
        </div>
        {baseLine}
        {help}
      </div>
    );
  };

  switch (def.kind) {
    case "text":
      return (
        <div className="grid gap-2">
          {renderTextLike("text")}
        </div>
      );
    case "email":
      return (
        <div className="grid gap-2">
          {renderTextLike("email")}
        </div>
      );
    case "url":
      return (
        <div className="grid gap-2">
          {renderTextLike("url")}
        </div>
      );
    case "textarea":
      return (
        <div className="grid gap-2">
          {renderTextarea()}
        </div>
      );
    case "date":
      return (
        <div className="grid gap-2">
          {renderDate()}
        </div>
      );
    case "toggle":
      return (
        <div className="grid gap-2">
          {renderToggle()}
        </div>
      );
    case "select":
      return (
        <div className="grid gap-2">
          {renderSelect()}
        </div>
      );
    case "multiselect":
      return (
        <div className="grid gap-2">
          {renderMulti()}
        </div>
      );
    case "chips":
      return (
        <div className="grid gap-2">
          {renderMulti()}
        </div>
      );
    default:
      return (
        <div className="grid gap-2">
          {renderTextLike("text")}
        </div>
      );
  }
}

/** Render a list of fields (order as passed) */
export default function FieldRenderer({
  value,
  onChange,
  fields,
  baseline,
}: {
  value: AlumniProfile;
  onChange: (next: AlumniProfile) => void;
  fields: FieldDef[];
  baseline?: AlumniProfile | null;
}) {
  const safeFields = useMemo(() => (Array.isArray(fields) ? fields : []), [fields]);

  return (
    <div className="grid gap-3">
      {safeFields.map((def, i) => {
        const key = String(def.path || def.key);
        return (
          <FieldRow
            key={`${key}-${i}`}
            def={def}
            value={value}
            onChange={onChange}
            baseline={baseline ?? null}
          />
        );
      })}
    </div>
  );
}
