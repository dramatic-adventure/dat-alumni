// lib/stories/writeStory.ts
import { randomUUID } from "crypto";
import {
  getProfileLiveRowByAlumniId,
  getMapDataRowByStoryKey,
  insertMapDataRow,
  updateMapDataRowByStoryKey,
  appendStoryEditsRow,
} from "@/lib/sheets";

function truthy(x: any) {
  if (x === true) return true;
  const s = String(x ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}

function slugifyLite(input: string) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function computeFieldsChanged(before: Record<string, any> | null, after: Record<string, any>): string {
  if (!before) return "ALL";
  const changed = Object.keys(after).filter(
    (k) => JSON.stringify(after[k] ?? null) !== JSON.stringify(before[k] ?? null)
  );
  return changed.length ? changed.join(", ") : "";
}

function generateStoryKey(alumniId: string) {
  return `${alumniId}:s:${randomUUID()}`;
}

export type WriteStoryArgs = {
  alumniId: string;
  editorSlug: string;
  mode: "create" | "edit";
  storyKey?: string; // required for edit
};

/**
 * Reads story buffer from Profile-Live story* fields.
 * Writes canonical story row to Map Data (update-in-place for edit).
 * Appends Story-Edits audit row.
 *
 * Does NOT touch Clean Map Data. (Option C)
 */
export async function writeStoryFromProfileLive({
  alumniId,
  editorSlug,
  mode,
  storyKey: incomingStoryKey,
}: WriteStoryArgs) {
  const live = await getProfileLiveRowByAlumniId(alumniId);
  if (!live) throw new Error("Profile-Live row not found");

  const showRaw = live["storyShowOnMap"];
  if (!truthy(showRaw)) {
    return { skipped: true, reason: "storyShowOnMap is false" as const };
  }

  const nowIso = new Date().toISOString();

  // Build canonical row aligned to Map Data headers you listed
  const title = String(live["storyTitle"] ?? "");
  const country = String(live["storyCountry"] ?? "");
  const incomingStorySlug = String((live as any)["storySlug"] ?? "").trim(); // optional future field
  const storySlug =
    incomingStorySlug || slugifyLite(`${title}-${country}`) || slugifyLite(title) || "";

  const canonical: Record<string, any> = {
    "Title": title,
    "Program": String(live["storyProgram"] ?? ""),
    "Location Name": String(live["storyLocationName"] ?? ""),
    "Latitude": "", // not set by alumni in studio
    "Longitude": "",
    "Year(s)": String(live["storyYears"] ?? ""),
    "Partners": String(live["storyPartners"] ?? ""),
    "Short Story": String(live["storyShortStory"] ?? ""),
    "Quote": String(live["storyQuote"] ?? ""),
    "Quote Attribution": String(live["storyQuoteAttribution"] ?? ""),
    "mediaUrl": String(live["storyMediaUrl"] ?? ""),
    "Author": String(live["name"] ?? ""),
    "authorSlug": String(live["slug"] ?? ""),
    "More Info Link": String(live["storyMoreInfoUrl"] ?? ""),
    "Country": country,
    "Region Tag": "", // optional taxonomy
    "Category": "", // optional taxonomy
    "Show on Map?": "TRUE",
    "Story URL": "", // optional / derived
    "storySlug": storySlug,

    // identity fields
    "alumniId": alumniId,
  };

  // CREATE
  if (mode === "create") {
    const storyKey = generateStoryKey(alumniId);

    const after = {
      ...canonical,
      storyKey,
      ts: nowIso,
      updatedTs: nowIso,
    };

    await insertMapDataRow(after);

    await appendStoryEditsRow({
      ts: nowIso,
      storyKey,
      alumniId,
      editorSlug,
      action: "create",
      fieldsChanged: "ALL",
      beforeJson: "",
      afterJson: JSON.stringify(after),
    });

    return { ok: true, mode: "create" as const, storyKey };
  }

  // EDIT
  if (!incomingStoryKey) throw new Error("Missing storyKey for edit mode");

  const storyKey = incomingStoryKey;
  const before = await getMapDataRowByStoryKey(storyKey);
  if (!before) throw new Error(`storyKey not found in Map Data: ${storyKey}`);

  // preserve created ts
  const createdTs = String(before["ts"] ?? "").trim() || nowIso;

  const after: Record<string, any> = {
    ...before, // preserve lat/lng/storyUrl/taxonomy if present
    ...canonical, // overwrite canonical editable fields
    storyKey,
    ts: createdTs,
    updatedTs: nowIso,
    alumniId, // enforce
  };

  const fieldsChanged = computeFieldsChanged(before, after);

  await updateMapDataRowByStoryKey(storyKey, after);

  await appendStoryEditsRow({
    ts: nowIso,
    storyKey,
    alumniId,
    editorSlug,
    action: "edit",
    fieldsChanged,
    beforeJson: JSON.stringify(before),
    afterJson: JSON.stringify(after),
  });

  return { ok: true, mode: "edit" as const, storyKey, fieldsChanged };
}
