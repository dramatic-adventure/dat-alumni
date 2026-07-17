// lib/contacts.ts
//
// Slice 7 (Emergency & Contacts) — the Contacts store. Mirrors lib/resources.ts:
// Sheet-tab-backed, header-keyed, withRetry + idxOf/normId, never-throws-on-read.
// One tab in ALUMNI_SHEET_ID:
//
//   "Field Kit Contacts"  id, programId, section, order, label, role, phone, email, link, note
//
// Read-only v1 — staff curate rows directly in the Sheet. The list is attached
// to the itinerary payload (lib/loadProgram.ts) so it precaches offline and
// rides LiveRefresh — the emergency card must work with no signal. The payload
// is roster-gated (requireFieldKitPage); these rows never reach a public surface.
//
// `section` groups rows on the contacts screen: emergency | ground-control |
// staff | artists | whatsapp (unknown values fall back to "other"). `order`
// sorts within a section. WhatsApp rows carry the group invite URL in `link`.

import "server-only";
import { sheetsClient } from "@/lib/googleClients";
import { withRetry, idxOf, normId } from "@/lib/sheetsResilience";
import type { FieldContact, FieldContactSection } from "@/lib/programItinerary";

const TAB = "Field Kit Contacts";
const RANGE = `'${TAB}'!A:J`;
export const CONTACT_HEADERS = [
  "id", "programId", "section", "order", "label", "role", "phone", "email", "link", "note",
] as const;

function spreadsheetId(): string {
  const id = process.env.ALUMNI_SHEET_ID;
  if (!id) throw new Error("Missing ALUMNI_SHEET_ID");
  return id;
}

function columns(header: string[]) {
  return {
    id: idxOf(header, ["id"]),
    programId: idxOf(header, ["programid"]),
    section: idxOf(header, ["section"]),
    order: idxOf(header, ["order"]),
    label: idxOf(header, ["label"]),
    role: idxOf(header, ["role"]),
    phone: idxOf(header, ["phone"]),
    email: idxOf(header, ["email"]),
    link: idxOf(header, ["link"]),
    note: idxOf(header, ["note"]),
  };
}

const SECTIONS: FieldContactSection[] = [
  "emergency", "ground-control", "staff", "artists", "whatsapp",
];

function coerceSection(v: unknown): FieldContactSection {
  const s = normId(v);
  return (SECTIONS as string[]).includes(s) ? (s as FieldContactSection) : "other";
}

// Short cross-request TTL cache, keyed by programId — mirrors lib/resources.ts
// (contact rows tolerate the same staleness as the rest of the payload).
const CONTACTS_TTL_MS = Number(process.env.FIELD_KIT_ITINERARY_TTL_MS || 60_000);
const _cache = new Map<string, { at: number; value: FieldContact[] }>();

/**
 * Every contact row for a program, ordered by section (canonical order above,
 * "other" last) then the `order` column. Never throws — [] on any read failure
 * or missing tab, so the itinerary load is unaffected.
 */
export async function getContacts(programId: string): Promise<FieldContact[]> {
  const pid = normId(programId);
  if (!pid) return [];

  const now = Date.now();
  const hit = _cache.get(pid);
  if (hit && now - hit.at < CONTACTS_TTL_MS) return hit.value;

  let value: (FieldContact & { _order: number })[] = [];
  try {
    const sheets = sheetsClient();
    const res = await withRetry(
      () => sheets.spreadsheets.values.get({ spreadsheetId: spreadsheetId(), range: RANGE }),
      "Sheets get Field Kit Contacts"
    );
    const rows = (res.data.values ?? []) as string[][];
    const header = rows[0]?.length ? rows[0] : [...CONTACT_HEADERS];
    const c = columns(header);
    if (c.id !== -1 && c.programId !== -1) {
      for (let i = 1; i < rows.length; i++) {
        if (normId(rows[i]?.[c.programId]) !== pid) continue;
        const id = String(rows[i]?.[c.id] ?? "").trim();
        const label = String(rows[i]?.[c.label] ?? "").trim();
        if (!id || !label) continue;
        value.push({
          id,
          section: coerceSection(rows[i]?.[c.section]),
          label,
          role: String(rows[i]?.[c.role] ?? "").trim(),
          phone: String(rows[i]?.[c.phone] ?? "").trim(),
          email: String(rows[i]?.[c.email] ?? "").trim(),
          link: String(rows[i]?.[c.link] ?? "").trim(),
          note: String(rows[i]?.[c.note] ?? "").trim(),
          _order: Number(String(rows[i]?.[c.order] ?? "").trim()) || 0,
        });
      }
    }
  } catch (err) {
    console.warn("[contacts] read failed:", err instanceof Error ? err.message : err);
    value = [];
  }

  const sectionRank = (s: FieldContactSection) => {
    const i = (SECTIONS as string[]).indexOf(s);
    return i === -1 ? SECTIONS.length : i;
  };
  value.sort((a, b) => sectionRank(a.section) - sectionRank(b.section) || a._order - b._order);

  const cleaned: FieldContact[] = value.map(({ _order, ...rest }) => rest);
  _cache.set(pid, { at: now, value: cleaned });
  return cleaned;
}
