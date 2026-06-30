// lib/itineraryExport.ts
//
// Client-side itinerary export — the data behind "Print / Save", "Copy", and
// "Share". All three are generated FROM the live ProgramItinerary object (the one
// already on screen, or the on-device snapshot offline), so the export is always
// as current as what the artist is looking at — never a stale, separately-built
// file. Print uses the browser dialog (which includes "Save as PDF"), so there's
// no PDF pipeline to maintain.
//
// SECURITY NOTE: these produce a portable copy of the program's exact daily
// schedule and locations. The UI gates every one behind a privacy warning
// (ShareWarningModal); this module just builds/dispatches the artifact.
//
// SSR-safe: pure builders have no browser deps; the action helpers guard the DOM
// / navigator APIs they touch.

import { partnerOrgName } from "@/components/field-kit/partnerOrgName";
import type { ProgramItinerary } from "@/lib/programItinerary";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// ── plain text (Copy / Share) ──────────────────────────────────────────────────

export function buildItineraryText(it: ProgramItinerary): string {
  const lines: string[] = [];
  lines.push(it.label || "Itinerary");
  if (it.essence) lines.push(it.essence);
  if (it.dates) lines.push(it.dates);
  lines.push("");

  for (const ch of it.chapters) {
    lines.push(`CHAPTER ${pad2(ch.num)} — ${ch.verb} in ${ch.place}`.trim());
    if (ch.description) lines.push(ch.description);
    if (ch.goal) lines.push(`Goal: ${ch.goal}`);
    if (ch.tips) lines.push(`Tips: ${ch.tips}`);
    lines.push("");

    for (const day of ch.days) {
      const head = [
        `Day ${day.dayNum}`,
        day.dateLabel ? ` · ${day.dateLabel}` : "",
        day.title ? ` — ${day.title}` : "",
      ].join("");
      lines.push(`  ${head}`);
      if (day.spirit) lines.push(`  ${day.spirit}`);
      if (day.what) lines.push(`  ${day.what}`);
      for (const t of day.times) {
        const note = t.note ? ` (${t.note})` : "";
        lines.push(`    ${t.time ? t.time + "  " : ""}${t.marker ? "» " : ""}${t.label}${note}`.trimEnd());
      }
      const meta = [day.cohortNote, day.partnerOrg ? partnerOrgName(day.partnerOrg) : ""]
        .filter(Boolean)
        .join(" · ");
      if (meta) lines.push(`  ${meta}`);
      if (day.prep.length) lines.push(`  Prep: ${day.prep.join(", ")}`);
      lines.push("");
    }
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

// ── printable HTML (Print / Save as PDF) ─────────────────────────────────────────

const PRINT_ACCENTS: Record<string, string> = {
  pink: "#c81f4b",
  teal: "#11788c",
  yellow: "#8a6d00",
  grape: "#6f3fa8",
  purple: "#7a2fc4",
};

function esc(s: unknown): string {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildPrintableHtml(it: ProgramItinerary): string {
  const chapters = it.chapters
    .map((ch) => {
      const acc = PRINT_ACCENTS[ch.accent] || PRINT_ACCENTS.teal;
      const days = ch.days
        .map((day) => {
          const times = day.times.length
            ? `<ul class="times">${day.times
                .map((t) => {
                  const note = t.note ? ` <span class="note">— ${esc(t.note)}</span>` : "";
                  const label = `${t.marker ? "» " : ""}${esc(t.label)}`;
                  return `<li><span class="t">${esc(t.time)}</span><span class="${t.bold ? "l bold" : "l"}">${label}${note}</span></li>`;
                })
                .join("")}</ul>`
            : "";
          const meta = [day.cohortNote ? esc(day.cohortNote) : "", day.partnerOrg ? esc(partnerOrgName(day.partnerOrg)) : ""]
            .filter(Boolean)
            .join(" &middot; ");
          const prep = day.prep.length
            ? `<p class="prep"><strong>Prep:</strong> ${day.prep.map(esc).join(", ")}</p>`
            : "";
          return `<div class="day">
            <p class="dn">Day ${esc(day.dayNum)}${day.dateLabel ? " &middot; " + esc(day.dateLabel) : ""}</p>
            ${day.spirit ? `<p class="spirit">${esc(day.spirit)}</p>` : ""}
            ${day.title ? `<h3>${esc(day.title)}</h3>` : ""}
            ${day.what ? `<p class="what">${esc(day.what)}</p>` : ""}
            ${times}
            ${meta ? `<p class="meta">${meta}</p>` : ""}
            ${prep}
          </div>`;
        })
        .join("");
      return `<section class="chapter">
        <h2 style="color:${acc}">${esc(ch.verb)} <span class="in">in ${esc(ch.place)}</span></h2>
        ${ch.description ? `<p class="desc">${esc(ch.description)}</p>` : ""}
        ${ch.goal ? `<p class="block"><strong>Goal:</strong> ${esc(ch.goal)}</p>` : ""}
        ${ch.tips ? `<p class="block"><strong>Tips:</strong> ${esc(ch.tips)}</p>` : ""}
        <div class="days">${days}</div>
      </section>`;
    })
    .join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<title>${esc(it.label || "Itinerary")}</title>
<style>
  @page { margin: 16mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1a1320; line-height: 1.5; margin: 0; }
  .head { border-bottom: 2px solid #1a1320; padding-bottom: 10px; margin-bottom: 18px; }
  .label { font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #11788c; font-weight: 700; margin: 0 0 4px; }
  h1 { font-size: 26px; margin: 0 0 6px; }
  .essence { font-style: italic; color: #444; margin: 0 0 2px; }
  .dates { color: #444; margin: 0; font-size: 13px; }
  .chapter { margin: 0 0 18px; break-inside: avoid; }
  .chapter h2 { font-size: 17px; margin: 0 0 4px; }
  .chapter h2 .in { font-weight: 400; }
  .desc { margin: 0 0 6px; color: #333; }
  .block { margin: 4px 0; font-size: 13px; color: #333; }
  .days { margin-top: 8px; }
  .day { border: 1px solid #ddd; border-radius: 8px; padding: 9px 12px; margin: 0 0 8px; break-inside: avoid; }
  .dn { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #666; font-weight: 700; margin: 0 0 2px; }
  .spirit { font-style: italic; color: #666; font-size: 12px; margin: 0 0 4px; }
  .day h3 { font-size: 14px; margin: 0 0 3px; }
  .what { font-size: 13px; color: #333; margin: 0 0 6px; }
  .times { list-style: none; margin: 6px 0 0; padding: 0; }
  .times li { font-size: 12.5px; display: flex; gap: 8px; margin: 1px 0; }
  .times .t { color: #666; min-width: 64px; flex: none; }
  .times .bold { font-weight: 700; }
  .times .note { color: #888; }
  .meta { font-size: 12px; color: #555; margin: 6px 0 0; }
  .prep { font-size: 12px; color: #555; margin: 4px 0 0; }
  .footer { margin-top: 16px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 10.5px; color: #999; }
</style></head>
<body>
  <div class="head">
    <p class="label">${esc(it.label || "Itinerary")}</p>
    <h1>The Journey, day by day.</h1>
    ${it.essence ? `<p class="essence">${esc(it.essence)}</p>` : ""}
    ${it.dates ? `<p class="dates">${esc(it.dates)}</p>` : ""}
  </div>
  ${chapters}
  <p class="footer">Private — please don't post online. Share only with people close to you.</p>
</body></html>`;
}

// ── action dispatch (browser-only) ───────────────────────────────────────────────

/** Print the itinerary via a hidden iframe (avoids popup blockers). */
export function printItinerary(it: ProgramItinerary): void {
  if (typeof document === "undefined") return;
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      // Give the print dialog time to grab the document before teardown.
      setTimeout(() => iframe.remove(), 1000);
    }
  };
  document.body.appendChild(iframe);
  iframe.srcdoc = buildPrintableHtml(it);
}

/** Copy the itinerary as plain text. Resolves true on success. */
export async function copyItinerary(it: ProgramItinerary): Promise<boolean> {
  const text = buildItineraryText(it);
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }
  return false;
}

export function canShareItinerary(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/** Share the itinerary text via the native share sheet. Resolves true if shared. */
export async function shareItinerary(it: ProgramItinerary): Promise<boolean> {
  if (!canShareItinerary()) return false;
  try {
    await navigator.share({ title: it.label || "Itinerary", text: buildItineraryText(it) });
    return true;
  } catch {
    // user cancelled or share failed
    return false;
  }
}
