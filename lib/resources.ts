// lib/resources.ts
//
// Slice 5 (Field Library) — the Resources store. Mirrors lib/rallyPoint.ts:
// Sheet-tab-backed, header-keyed, withRetry + idxOf/normId, never-throws-on-read.
// One tab in ALUMNI_SHEET_ID:
//
//   "Field Kit Resources"  id, programId, dayId, title, type, url, tags
//
// Read-only v1 — staff curate rows directly in the Sheet. The list is attached
// to the itinerary payload (lib/loadProgram.ts) so it precaches offline and
// rides LiveRefresh; individual FILES are cached on first open by the service
// worker (public/sw.js — cache-on-open, Jesse's §12 Q3 decision).
//
// `type` is text | audio | image | link. Drive-backed resources (Drive URL or
// bare fileId in `url`) open through the gated, cacheable proxy route
// app/api/field-kit/library/file/[id]; `link` rows open externally and are
// badged online-only. `dayId` (optional) surfaces a resource under "Relevant
// today" on that itinerary day — computed from the real itinerary, never
// hardcoded (the old audit flagged the mockup's hardcode as a bug).

import "server-only";
import { sheetsClient } from "@/lib/googleClients";
import { withRetry, idxOf, normId } from "@/lib/sheetsResilience";
import type { FieldResource, FieldResourceType } from "@/lib/programItinerary";

const TAB = "Field Kit Resources";
const RANGE = `'${TAB}'!A:G`;
export const RESOURCE_HEADERS = ["id", "programId", "dayId", "title", "type", "url", "tags"] as const;

function spreadsheetId(): string {
  const id = process.env.ALUMNI_SHEET_ID;
  if (!id) throw new Error("Missing ALUMNI_SHEET_ID");
  return id;
}

function columns(header: string[]) {
  return {
    id: idxOf(header, ["id"]),
    programId: idxOf(header, ["programid"]),
    dayId: idxOf(header, ["dayid"]),
    title: idxOf(header, ["title"]),
    type: idxOf(header, ["type"]),
    url: idxOf(header, ["url"]),
    tags: idxOf(header, ["tags"]),
  };
}

function coerceType(v: unknown): FieldResourceType {
  const s = normId(v);
  if (s === "audio" || s === "image" || s === "link") return s;
  return "text";
}

function splitTags(raw: string): string[] {
  return String(raw ?? "")
    .split(/[\n|,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Extract a Drive fileId from a resource `url` cell: accepts a bare fileId, a
 * drive.google.com/file/d/<id>/… link, or an open?id=<id> link. Returns "" for
 * anything else (a plain external URL).
 */
export function driveFileIdFromUrl(url: string): string {
  const u = String(url ?? "").trim();
  if (!u) return "";
  if (/^[\w-]{20,}$/.test(u)) return u; // bare fileId
  const path = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/i);
  if (path) return path[1];
  const query = u.match(/[?&]id=([\w-]+)/i);
  if (query && /drive\.google\.com|docs\.google\.com/i.test(u)) return query[1];
  return "";
}

// Short cross-request TTL cache, keyed by programId — mirrors the itinerary's
// TTL cache in lib/loadProgram.ts (library rows tolerate the same staleness).
const RESOURCES_TTL_MS = Number(process.env.FIELD_KIT_ITINERARY_TTL_MS || 60_000);
const _cache = new Map<string, { at: number; value: FieldResource[] }>();

/**
 * Every library resource for a program, in sheet order. Never throws — [] on
 * any read failure / missing tab so the itinerary load is unaffected.
 */
export async function getResources(programId: string): Promise<FieldResource[]> {
  const pid = normId(programId);
  if (!pid) return [];

  const now = Date.now();
  const hit = _cache.get(pid);
  if (hit && now - hit.at < RESOURCES_TTL_MS) return hit.value;

  let value: FieldResource[] = [];
  try {
    const sheets = sheetsClient();
    const res = await withRetry(
      () => sheets.spreadsheets.values.get({ spreadsheetId: spreadsheetId(), range: RANGE }),
      "Sheets get Field Kit Resources"
    );
    const rows = (res.data.values ?? []) as string[][];
    const header = rows[0]?.length ? rows[0] : [...RESOURCE_HEADERS];
    const c = columns(header);
    if (c.id !== -1 && c.programId !== -1) {
      for (let i = 1; i < rows.length; i++) {
        if (normId(rows[i]?.[c.programId]) !== pid) continue;
        const id = String(rows[i]?.[c.id] ?? "").trim();
        const title = String(rows[i]?.[c.title] ?? "").trim();
        if (!id || !title) continue;
        const dayId = String(rows[i]?.[c.dayId] ?? "").trim();
        value.push({
          id,
          dayId: dayId || undefined,
          title,
          type: coerceType(rows[i]?.[c.type]),
          url: String(rows[i]?.[c.url] ?? "").trim(),
          tags: splitTags(String(rows[i]?.[c.tags] ?? "")),
        });
      }
    }
  } catch (err) {
    console.warn("[resources] read failed:", err instanceof Error ? err.message : err);
    value = [];
  }

  _cache.set(pid, { at: now, value });
  return value;
}

/** One resource by id (program-scoped). Null when absent. */
export async function getResourceById(programId: string, id: string): Promise<FieldResource | null> {
  const want = normId(id);
  if (!want) return null;
  const all = await getResources(programId);
  return all.find((r) => normId(r.id) === want) ?? null;
}
