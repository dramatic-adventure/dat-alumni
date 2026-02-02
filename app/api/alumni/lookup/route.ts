// /app/api/alumni/lookup/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { rateLimit } from "@/lib/rateLimit";
import { promises as fs } from "fs";
import path from "path";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ------------------------------------------------------------
// Debug gates
// ------------------------------------------------------------
function isDebug(req: Request, mode: "1" | "2") {
  return (
    req.headers.get("x-debug") === mode &&
    (req.headers.get("x-admin-token") || "").trim() ===
      (process.env.ADMIN_TOKEN || "").trim()
  );
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function parseSA(jsonStr: string) {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return JSON.parse(jsonStr.replace(/\\n/g, "\n"));
  }
}

/** case-insensitive header lookup */
function idxOf(header: any[], candidates: string[]) {
  const lower = header.map((h) => String(h || "").trim().toLowerCase());
  for (const c of candidates) {
    const i = lower.indexOf(c.toLowerCase());
    if (i !== -1) return i;
  }
  return -1;
}

function normSlug(x: string) {
  return String(x || "").trim().toLowerCase();
}

function truthyCell(x: unknown) {
  const s = String(x ?? "").trim().toLowerCase();
  return s === "true" || s === "yes" || s === "y" || s === "1" || s === "checked";
}

function json(body: any, init?: { status?: number; headers?: Record<string, string> }) {
  return NextResponse.json(body, {
    status: init?.status,
    headers: init?.headers,
  });
}

function noStoreHeaders() {
  return { "Cache-Control": "no-store" };
}

function privateCache60Headers() {
  return { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" };
}

function parseAdminEmails() {
  return new Set(
    String(process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((s) => normalizeGmail(String(s || "").trim()))
      .filter(Boolean)
  );
}

/**
 * Admin check:
 * 1) x-admin-token (ADMIN_TOKEN) override
 * 2) NextAuth session email allowlist / flags
 */
async function isAdminRequest(req: Request): Promise<boolean> {
  const token = (req.headers.get("x-admin-token") || "").trim();
  const want = (process.env.ADMIN_TOKEN || "").trim();
  if (want && token && token === want) return true;

  try {
    const session = await auth(); // ✅ no args
    const email = normalizeGmail(String(session?.user?.email || "").trim());
    if (!email) return false;


    // Optional: if you ever add these
    if ((session as any)?.user?.isAdmin === true) return true;
    if ((session as any)?.user?.role === "admin") return true;

    const allow = parseAdminEmails();
    return allow.size ? allow.has(email) : false;
  } catch {
    return false;
  }
}

/** Get session email if signed in (used for self-lookup security) */
async function getSessionEmailIfAny(): Promise<string> {
  try {
    const session = await auth(); // ✅ no args
    return String(session?.user?.email || "").trim().toLowerCase();
  } catch {
    return "";
  }
}

/** Normalize gmail/googlemail and strip +tag/dots for gmail */
function normalizeGmail(raw: string) {
  const e = String(raw || "").trim().toLowerCase();
  const [user, domain] = e.split("@");
  if (!user || !domain) return e;
  const canon = domain === "googlemail.com" ? "gmail.com" : domain;
  if (canon !== "gmail.com") return `${user}@${canon}`;
  const noPlus = user.split("+")[0];
  const noDots = noPlus.replace(/\./g, "");
  return `${noDots}@gmail.com`;
}

// ------------------------------------------------------------
// Status normalization (your rule)
// ------------------------------------------------------------
function normalizeStatus(raw: unknown) {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  if (s.toLowerCase() === "pending") return "needs_review";
  return s;
}

// ------------------------------------------------------------
// Slug forwards (Profile-Slugs)
// ------------------------------------------------------------
type SlugRow = [string, string, string?]; // fromSlug,toSlug,createdAt?

function buildSlugForwardMap(rows: SlugRow[]) {
  const mapLatest = new Map<string, { to: string; at: number }>();
  for (const r of rows) {
    const from = normSlug(r?.[0] || "");
    const to = normSlug(r?.[1] || "");
    if (!from || !to) continue;
    const at = new Date(r?.[2] || 0).getTime() || 0;
    const prev = mapLatest.get(from);
    if (!prev || at >= prev.at) mapLatest.set(from, { to, at });
  }
  const out: Record<string, string> = {};
  for (const [from, { to }] of mapLatest) out[from] = to;
  return out;
}

function resolveForwardChainLocal(map: Record<string, string>, fromSlug: string) {
  let cur = normSlug(fromSlug);
  const seen = new Set<string>();
  for (let i = 0; i < 100; i++) {
    if (!cur || seen.has(cur)) break;
    seen.add(cur);
    const next = map[cur];
    if (!next || next === cur) break;
    cur = next;
  }
  return cur;
}

/** Reverse lookup: given target, find a current "from" that maps to it */
function reverseSlugSource(map: Record<string, string>, target: string) {
  const want = normSlug(target);
  let candidate: string | null = null;
  for (const [from, to] of Object.entries(map)) {
    if (to === want) {
      if (!candidate || from < candidate) candidate = from;
    }
  }
  return candidate;
}

// ------------------------------------------------------------
// CSV fallback (public-only)
// ------------------------------------------------------------
type CsvRow = Record<string, string>;

function parseCsvSimple(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (lines.length < 2) return [];

  const split = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (ch === "," && !inQ) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const headers = split(lines[0]).map((h) => h.replace(/^"|"$/g, "").trim());
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = split(lines[i]).map((c) => c.replace(/^"|"$/g, ""));
    const row: CsvRow = {};
    for (let j = 0; j < headers.length; j++) row[headers[j]] = cells[j] ?? "";
    rows.push(row);
  }

  return rows;
}

function toCsvCell(v: unknown) {
  const s = String(v ?? "");
  if (/["\n\r,]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function splitPrevSlugs(raw: unknown) {
  return String(raw ?? "")
    .toLowerCase()
    .split(/[,;\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function getFallbackDir() {
  return process.env.FALLBACK_DIR || path.join("public", "fallback");
}

async function loadFallbackCsv(): Promise<CsvRow[]> {
  const dir = getFallbackDir();
  const p = path.join(process.cwd(), dir, "alumni.csv");
  const text = await fs.readFile(p, "utf8");
  return parseCsvSimple(text);
}

async function lookupFromCsvFallback(params: { alumniId?: string; admin: boolean }) {
  if (params.admin) return { kind: "admin-unavailable" as const };

  const needle = normSlug(params.alumniId || "");
  if (!needle) return { kind: "not-found" as const };

  const rows = await loadFallbackCsv();

  const match =
    rows.find((r) => normSlug(r.slug || "") === needle) ||
    rows.find((r) =>
      splitPrevSlugs(r["Previous Slugs"] || (r as any).previousSlugs).includes(needle)
    );

  if (!match) return { kind: "not-found" as const };

  return {
    kind: "ok" as const,
    payload: {
      alumniId: normSlug(match["Profile ID"] || match.alumniId || ""),
      canonicalSlug: normSlug(match.slug || ""),
      redirectedFrom: normSlug(match.slug || "") !== needle ? needle : undefined,
      source: "csv-fallback",
      status: normalizeStatus(match["Status Signifier"] || match.status || ""),
      isPublic: match["Show on Profile?"] || match.isPublic || "",
      name: match.Name || match.name || "",
      roles: match.Role || match.roles || "",
      location: match.Location || match.location || "",
      headshotUrl: match["Headshot URL"] || (match as any).currentHeadshotUrl || "",
      website: match["Artist URL"] || match.website || match["Profile URL"] || "",
      statusFlags: (match as any).statusFlags || match["Status Flags"] || "",
      currentWork: (match as any).currentWork || match["Current Work"] || "",
    },
  };
}

// ------------------------------------------------------------
// Atomic-ish writer (tmp then rename)
// ------------------------------------------------------------
async function atomicWriteFile(filePath: string, content: string) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const tmp = path.join(dir, `.${base}.tmp-${process.pid}-${Date.now()}`);

  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(tmp, content, "utf8");
  await fs.rename(tmp, filePath);
}

function canWriteFallbackToDisk() {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.FALLBACK_WRITE !== "1") return false;
  if ((process.env.FALLBACK_WRITE_TARGET || "") !== "disk") return false;
  return true;
}

// ------------------------------------------------------------
// Status rules (review-only; only blocklist hides)
// ------------------------------------------------------------
function isBlockedStatus(statusRaw: unknown) {
  const s = String(statusRaw || "").trim().toLowerCase();
  return (
    s === "blocked" ||
    s === "removed" ||
    s === "hidden" ||
    s === "private" ||
    s === "suspended" ||
    s === "banned" ||
    s === "deleted" ||
    s === "off"
  );
}

/**
 * Build public-only CSV snapshots from Profile-Live and Profile-Slugs.
 */
function buildFallbackCsvStrings(opts: {
  liveRows: any[][];
  liveIdx: {
    alumniIdIdx: number;
    slugIdx: number;
    nameIdx: number;
    rolesIdx: number;
    locationIdx: number;
    headshotUrlIdx: number;
    websiteIdx: number;
    isPublicIdx: number;
    statusIdx: number;
    updatedAtIdx: number;
    statusFlagsIdx: number;
    currentWorkIdx: number;
  };
  slugTriples: SlugRow[];
}) {
  const {
    liveRows,
    liveIdx: {
      alumniIdIdx,
      slugIdx,
      nameIdx,
      rolesIdx,
      locationIdx,
      headshotUrlIdx,
      websiteIdx,
      isPublicIdx,
      statusIdx,
      updatedAtIdx,
      statusFlagsIdx,
      currentWorkIdx,
    },
    slugTriples,
  } = opts;

  const pub = liveRows.filter((r) => {
    const pubOk = isPublicIdx !== -1 ? truthyCell(r[isPublicIdx]) : false;
    const status = statusIdx !== -1 ? String(r[statusIdx] ?? "") : "";
    return pubOk && !isBlockedStatus(status);
  });

  const alumniLines: string[] = [];
  alumniLines.push(
    [
      "Name",
      "Role",
      "Location",
      "Headshot URL",
      "Artist URL",
      "Show on Profile?",
      "Status Signifier",
      "Status Flags",
      "Current Work",
      "Profile ID",
      "slug",
      "Previous Slugs",
      "lastModified",
    ].join(",")
  );

  for (const r of pub) {
    const alumniId = alumniIdIdx !== -1 ? normSlug(String(r[alumniIdIdx] ?? "")) : "";
    const slug = slugIdx !== -1 ? normSlug(String(r[slugIdx] ?? "")) : "";
    const name = nameIdx !== -1 ? String(r[nameIdx] ?? "").trim() : "";
    const roles = rolesIdx !== -1 ? String(r[rolesIdx] ?? "").trim() : "";
    const location = locationIdx !== -1 ? String(r[locationIdx] ?? "").trim() : "";
    const headshot = headshotUrlIdx !== -1 ? String(r[headshotUrlIdx] ?? "").trim() : "";
    const website = websiteIdx !== -1 ? String(r[websiteIdx] ?? "").trim() : "";
    const statusRaw = statusIdx !== -1 ? String(r[statusIdx] ?? "").trim() : "";
    const status = normalizeStatus(statusRaw);
    const lastModified = updatedAtIdx !== -1 ? String(r[updatedAtIdx] ?? "").trim() : "";
    const statusFlags = statusFlagsIdx !== -1 ? String(r[statusFlagsIdx] ?? "").trim() : "";
    const currentWork = currentWorkIdx !== -1 ? String(r[currentWorkIdx] ?? "").trim() : "";

    alumniLines.push(
      [
        toCsvCell(name),
        toCsvCell(roles),
        toCsvCell(location),
        toCsvCell(headshot),
        toCsvCell(website),
        toCsvCell("Yes"),
        toCsvCell(status),
        toCsvCell(statusFlags),
        toCsvCell(currentWork),
        toCsvCell(alumniId),
        toCsvCell(slug),
        toCsvCell(""),
        toCsvCell(lastModified),
      ].join(",")
    );
  }

  const slugLines: string[] = [];
  slugLines.push(["fromSlug", "toSlug", "createdAt"].join(","));
  for (const t of slugTriples) {
    slugLines.push([toCsvCell(normSlug(t[0])), toCsvCell(normSlug(t[1])), toCsvCell(t[2] || "")].join(","));
  }

  return {
    alumniCsv: alumniLines.join("\n"),
    slugMapCsv: slugLines.join("\n"),
  };
}

async function refreshFallbackSnapshots(opts: {
  liveHeader: any[];
  liveRows: any[][];
  liveIdx: {
    alumniIdIdx: number;
    slugIdx: number;
    nameIdx: number;
    rolesIdx: number;
    locationIdx: number;
    headshotUrlIdx: number;
    websiteIdx: number;
    isPublicIdx: number;
    statusIdx: number;
    updatedAtIdx: number;
    statusFlagsIdx: number;
    currentWorkIdx: number;
  };
  slugTriples: SlugRow[];
}) {
  if (!canWriteFallbackToDisk()) return;

  const dir = getFallbackDir();
  const alumniPath = path.join(process.cwd(), dir, "alumni.csv");
  const slugMapPath = path.join(process.cwd(), dir, "slug-map.csv");

  const { alumniCsv, slugMapCsv } = buildFallbackCsvStrings({
    liveRows: opts.liveRows,
    liveIdx: opts.liveIdx,
    slugTriples: opts.slugTriples,
  });

  await atomicWriteFile(alumniPath, alumniCsv);
  await atomicWriteFile(slugMapPath, slugMapCsv);
}

// ------------------------------------------------------------
// Main route (Profile-Live is the source of truth for reads)
// ------------------------------------------------------------
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const nocache = (searchParams.get("nocache") || "").trim();
  const forceNoStore = nocache === "1" || nocache.toLowerCase() === "true";

  const admin = await isAdminRequest(req);
  const sessionEmail = await getSessionEmailIfAny();
  const sessionEmailNorm = normalizeGmail(sessionEmail);

  // rate limit (per IP, 120 req / min)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(ip, 120, 60_000)) {
    return json({ error: "Too many requests" }, { status: 429, headers: noStoreHeaders() });
  }

  // CSV export mode (no alumniId/email required)
  const exportParam = (searchParams.get("export") || "").trim().toLowerCase();
  const wantsExport =
    exportParam === "alumni.csv" ||
    exportParam === "alumni" ||
    exportParam === "slug-map.csv" ||
    exportParam === "slug-map";

const alumniIdExplicit = normSlug(
  searchParams.get("alumniId") || searchParams.get("asId") || ""
);
const slugExplicit = normSlug(searchParams.get("slug") || "");

const lookupKey = alumniIdExplicit || slugExplicit; // what we’ll actually search by

const emailParamRaw = String(searchParams.get("email") || "").trim();

if (!wantsExport && !lookupKey && !emailParamRaw) {
  return json(
    { error: "email, slug, or alumniId required" },
    { status: 400, headers: noStoreHeaders() }
  );
}

// ✅ In production:
// - alumniId/asId is admin-only (stable internal ID)
// - slug is allowed publicly (but will be gated by isPublic + status)
if (!wantsExport && alumniIdExplicit && !admin && process.env.NODE_ENV === "production") {
  return json({ error: "Forbidden" }, { status: 403, headers: noStoreHeaders() });
}


  const sheetId = process.env.ALUMNI_SHEET_ID;
  const saJson = process.env.GCP_SA_JSON;
  if (!sheetId || !saJson) {
    return json({ error: "Server misconfigured" }, { status: 500, headers: noStoreHeaders() });
  }

  try {
    const sa = parseSA(saJson);
    const gAuth = new google.auth.JWT({
      email: sa.client_email,
      key: sa.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth: gAuth });

    // 0) Read Profile-Live
    const liveResp = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Profile-Live!A:ZZ",
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const liveVals = (liveResp.data.values || []) as any[][];
    const [LH, ...liveRows] = liveVals.length ? liveVals : [[]];

    // Live indices
    const alumniIdIdx = idxOf(LH as string[], ["alumniid", "alumni id", "id"]);
    const slugIdx = idxOf(LH as string[], ["slug"]);
    const nameIdx = idxOf(LH as string[], ["name"]);
    const rolesIdx = idxOf(LH as string[], ["roles", "role"]);
    const locationIdx = idxOf(LH as string[], ["location"]);
    const websiteIdx = idxOf(LH as string[], ["website", "profileurl", "profile url"]);
    const headshotUrlIdx = idxOf(LH as string[], ["currentheadshoturl", "current headshot url"]);
    const isPublicIdx = idxOf(LH as string[], ["ispublic", "is public"]);
    const statusIdx = idxOf(LH as string[], ["status"]);
    const updatedAtIdx = idxOf(LH as string[], ["updatedat", "updated at"]);

    const statusFlagsIdx = idxOf(LH as string[], ["statusflags", "status flags"]);
    const currentWorkIdx = idxOf(LH as string[], ["currentwork", "current work"]);
    const backgroundStyleIdx = idxOf(LH as string[], ["backgroundstyle", "background style"]);

    // ✅ NEW: fields needed for bi-coastal / second location (and consistent UI)
    const isBiCoastalIdx = idxOf(LH as string[], ["isbicoastal", "is bi coastal", "is bi-coastal", "bi-coastal"]);
    const secondLocationIdx = idxOf(LH as string[], ["secondlocation", "second location", "location2", "location 2"]);

    // Additional fields for the update form (keep as-is)
    const emailIdx = idxOf(LH as string[], ["email"]);
    const instagramIdx = idxOf(LH as string[], ["instagram"]);
    const youtubeIdx = idxOf(LH as string[], ["youtube"]);
    const vimeoIdx = idxOf(LH as string[], ["vimeo"]);
    const imdbIdx = idxOf(LH as string[], ["imdb"]);
    const bioShortIdx = idxOf(LH as string[], ["bioshort", "bio short"]);
    const bioLongIdx = idxOf(LH as string[], ["biolong", "bio long"]);
    const pronounsIdx = idxOf(LH as string[], ["pronouns"]);
    const programsIdx = idxOf(LH as string[], ["programs"]);
    const tagsIdx = idxOf(LH as string[], ["tags"]);
    const spotlightIdx = idxOf(LH as string[], ["spotlight"]);
    const currentHeadshotIdIdx = idxOf(LH as string[], ["currentheadshotid", "current headshot id"]);

    if (isDebug(req, "1")) {
      const sample = liveRows.slice(0, 5).map((r) => ({
        alumniId: alumniIdIdx !== -1 ? String(r[alumniIdIdx] ?? "") : "",
        slug: slugIdx !== -1 ? String(r[slugIdx] ?? "") : "",
        email: emailIdx !== -1 ? String(r[emailIdx] ?? "") : "",
        status: statusIdx !== -1 ? String(r[statusIdx] ?? "") : "",
        isPublic: isPublicIdx !== -1 ? String(r[isPublicIdx] ?? "") : "",
        updatedAt: updatedAtIdx !== -1 ? String(r[updatedAtIdx] ?? "") : "",
        backgroundStyle: backgroundStyleIdx !== -1 ? String(r[backgroundStyleIdx] ?? "") : "",
        isBiCoastal: isBiCoastalIdx !== -1 ? String(r[isBiCoastalIdx] ?? "") : "",
        secondLocation: secondLocationIdx !== -1 ? String(r[secondLocationIdx] ?? "") : "",
      }));

      return json(
        {
          sheetId,
          tab: "Profile-Live",
          headerCount: (LH || []).length,
          rowCount: liveRows.length,
          headerPreview: (LH || []).slice(0, 40),
          idx: {
            alumniIdIdx,
            slugIdx,
            emailIdx,
            statusIdx,
            isPublicIdx,
            nameIdx,
            rolesIdx,
            locationIdx,
            websiteIdx,
            headshotUrlIdx,
            updatedAtIdx,
            statusFlagsIdx,
            currentWorkIdx,
            backgroundStyleIdx,
            isBiCoastalIdx,
            secondLocationIdx,
          },
          sample,
        },
        { status: 200, headers: noStoreHeaders() }
      );
    }

    // 1) Read Profile-Slugs (optional) for forwards
    let slugForwardMap: Record<string, string> = {};
    let slugTriples: SlugRow[] = [];
    try {
      const slugsResp = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "Profile-Slugs!A:C",
        valueRenderOption: "UNFORMATTED_VALUE",
      });
      const slugsVals = (slugsResp.data.values || []) as any[][];
      const [, ...slugRowsRaw] = slugsVals.length ? slugsVals : [[]];

      slugTriples = slugRowsRaw
        .map((r) => [String(r?.[0] ?? ""), String(r?.[1] ?? ""), String(r?.[2] ?? "")] as SlugRow)
        .filter((r) => normSlug(r[0]) && normSlug(r[1]));

      slugForwardMap = buildSlugForwardMap(slugTriples);
    } catch {
      slugForwardMap = {};
      slugTriples = [];
    }

    // Export CSV directly from Live + Slugs
    if (wantsExport) {
      const { alumniCsv, slugMapCsv } = buildFallbackCsvStrings({
        liveRows,
        liveIdx: {
          alumniIdIdx,
          slugIdx,
          nameIdx,
          rolesIdx,
          locationIdx,
          headshotUrlIdx,
          websiteIdx,
          isPublicIdx,
          statusIdx,
          updatedAtIdx,
          statusFlagsIdx,
          currentWorkIdx,
        },
        slugTriples,
      });

      const body = exportParam.startsWith("slug") ? slugMapCsv : alumniCsv;

      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          ...(forceNoStore ? noStoreHeaders() : privateCache60Headers()),
        },
      });
    }

    // dev-only snapshot writing whenever Sheets is readable
    void refreshFallbackSnapshots({
      liveHeader: LH,
      liveRows,
      liveIdx: {
        alumniIdIdx,
        slugIdx,
        nameIdx,
        rolesIdx,
        locationIdx,
        headshotUrlIdx,
        websiteIdx,
        isPublicIdx,
        statusIdx,
        updatedAtIdx,
        statusFlagsIdx,
        currentWorkIdx,
      },
      slugTriples,
    }).catch(() => {});

    function notFound() {
      return json({ error: "not found" }, { status: 404, headers: noStoreHeaders() });
    }

    function okHeaders() {
      return forceNoStore ? noStoreHeaders() : privateCache60Headers();
    }

    function enforcePublicGate(row: any[]) {
      if (admin) return true;
      const pubOk = isPublicIdx !== -1 ? truthyCell(row[isPublicIdx]) : false;
      const status = statusIdx !== -1 ? row[statusIdx] : "";
      return pubOk && !isBlockedStatus(status);
    }

    function buildPayload(row: any[], redirectedFrom?: string) {
      const alumniId = alumniIdIdx !== -1 ? normSlug(String(row[alumniIdIdx] ?? "")) : "";
      const canonicalSlug = slugIdx !== -1 ? normSlug(String(row[slugIdx] ?? "")) : "";
      const statusRaw = statusIdx !== -1 ? String(row[statusIdx] ?? "") : "";
      const status = normalizeStatus(statusRaw);

      const isPublic = isPublicIdx !== -1 ? String(row[isPublicIdx] ?? "").trim() : "";

      const headshotUrl = headshotUrlIdx !== -1 ? String(row[headshotUrlIdx] ?? "").trim() : "";
      const headshotId =
        currentHeadshotIdIdx !== -1 ? String(row[currentHeadshotIdIdx] ?? "").trim() : "";

      const statusFlags = statusFlagsIdx !== -1 ? String(row[statusFlagsIdx] ?? "").trim() : "";
      const currentWork = currentWorkIdx !== -1 ? String(row[currentWorkIdx] ?? "").trim() : "";

      const backgroundStyle =
        backgroundStyleIdx !== -1 ? String(row[backgroundStyleIdx] ?? "").trim() : "";

      // ✅ normalize as Live cell strings: "true" / ""
      const isBiCoastal =
        isBiCoastalIdx !== -1 && truthyCell(row[isBiCoastalIdx]) ? "true" : "";
      const secondLocation =
        secondLocationIdx !== -1 ? String(row[secondLocationIdx] ?? "").trim() : "";

      return {
        alumniId,
        canonicalSlug,
        status,
        isPublic,
        source: redirectedFrom ? "slug-redirect" : "live",
        ...(redirectedFrom ? { redirectedFrom } : {}),
        updatedAt: updatedAtIdx !== -1 ? String(row[updatedAtIdx] ?? "").trim() : "",

        name: nameIdx !== -1 ? String(row[nameIdx] ?? "").trim() : "",
        pronouns: pronounsIdx !== -1 ? String(row[pronounsIdx] ?? "").trim() : "",
        roles: rolesIdx !== -1 ? String(row[rolesIdx] ?? "").trim() : "",
        location: locationIdx !== -1 ? String(row[locationIdx] ?? "").trim() : "",
        currentWork,
        bioShort: bioShortIdx !== -1 ? String(row[bioShortIdx] ?? "").trim() : "",
        bioLong: bioLongIdx !== -1 ? String(row[bioLongIdx] ?? "").trim() : "",
        website: websiteIdx !== -1 ? String(row[websiteIdx] ?? "").trim() : "",
        instagram: instagramIdx !== -1 ? String(row[instagramIdx] ?? "").trim() : "",
        youtube: youtubeIdx !== -1 ? String(row[youtubeIdx] ?? "").trim() : "",
        vimeo: vimeoIdx !== -1 ? String(row[vimeoIdx] ?? "").trim() : "",
        imdb: imdbIdx !== -1 ? String(row[imdbIdx] ?? "").trim() : "",
        spotlight: spotlightIdx !== -1 ? String(row[spotlightIdx] ?? "").trim() : "",
        programs: programsIdx !== -1 ? String(row[programsIdx] ?? "").trim() : "",
        tags: tagsIdx !== -1 ? String(row[tagsIdx] ?? "").trim() : "",
        statusFlags,

        backgroundStyle,

        currentHeadshotUrl: headshotUrl || "",
        currentHeadshotId: headshotId || "",

        // ✅ include these for the update form
        isBiCoastal,
        secondLocation,

        // Email:
        // - Admin: always see
        // - Non-admin: only when doing email lookup for self
        email:
          (admin || (emailParamRaw && normalizeGmail(emailParamRaw) === sessionEmailNorm)) &&
          emailIdx !== -1
            ? String(row[emailIdx] ?? "").trim()
            : "",
      };
    }

    // ------------------------------------------------------------
    // Lookup flow:
    // - alumniId param might be: old slug, new slug, or stable alumniId.
    // - canonicalize via Profile-Slugs forward chain.
    // ------------------------------------------------------------
    const incoming = lookupKey;
    const canonical = incoming ? resolveForwardChainLocal(slugForwardMap, incoming) : "";
    const redirectedFrom = canonical && incoming && canonical !== incoming ? incoming : undefined;

    // Debug 2
    if (isDebug(req, "2")) {
      const emailParamNorm = normalizeGmail(emailParamRaw);
      const selfGateWouldPass = !!sessionEmailNorm && !!emailParamNorm && emailParamNorm === sessionEmailNorm;

      const want = canonical || incoming;
      const findRow = (key: string) => {
        const k = normSlug(key);
        if (!k) return null;
        if (slugIdx !== -1) {
          const hit = liveRows.find((r) => normSlug(String(r[slugIdx] ?? "")) === k);
          if (hit) return hit;
        }
        if (alumniIdIdx !== -1) {
          const hit = liveRows.find((r) => normSlug(String(r[alumniIdIdx] ?? "")) === k);
          if (hit) return hit;
        }
        return null;
      };

      const row = want ? findRow(want) : null;

      return json(
        {
          sheetId,
          tab: "Profile-Live",
          incoming,
          canonical,
          redirectedFrom,
          slugForwardCount: Object.keys(slugForwardMap).length,
          admin,
          sessionEmail,
          sessionEmailNorm,
          emailParamRaw,
          emailParamNorm,
          selfGateWouldPass,
          idxPreview: {
            alumniIdIdx,
            slugIdx,
            emailIdx,
            isPublicIdx,
            statusIdx,
            backgroundStyleIdx,
            isBiCoastalIdx,
            secondLocationIdx,
            updatedAtIdx,
          },
          rowPreview: row
            ? {
                alumniId: alumniIdIdx !== -1 ? String(row[alumniIdIdx] ?? "") : "",
                slug: slugIdx !== -1 ? String(row[slugIdx] ?? "") : "",
                email: emailIdx !== -1 ? String(row[emailIdx] ?? "") : "",
                isPublic: isPublicIdx !== -1 ? String(row[isPublicIdx] ?? "") : "",
                status: statusIdx !== -1 ? String(row[statusIdx] ?? "") : "",
                backgroundStyle: backgroundStyleIdx !== -1 ? String(row[backgroundStyleIdx] ?? "") : "",
                isBiCoastal: isBiCoastalIdx !== -1 ? String(row[isBiCoastalIdx] ?? "") : "",
                secondLocation: secondLocationIdx !== -1 ? String(row[secondLocationIdx] ?? "") : "",
                updatedAt: updatedAtIdx !== -1 ? String(row[updatedAtIdx] ?? "") : "",
              }
            : null,
        },
        { status: 200, headers: noStoreHeaders() }
      );
    }

    function findLiveRowByKey(key: string) {
      const want = normSlug(key);
      if (!want) return null;

      if (slugIdx !== -1) {
        const hit = liveRows.find((r) => normSlug(String(r[slugIdx] ?? "")) === want);
        if (hit) return hit;
      }

      if (alumniIdIdx !== -1) {
        const hit = liveRows.find((r) => normSlug(String(r[alumniIdIdx] ?? "")) === want);
        if (hit) return hit;
      }

      return null;
    }

    // 1) By canonical key
    if (canonical) {
      const match = findLiveRowByKey(canonical);
      if (match) {
        if (!enforcePublicGate(match)) return notFound();
        return json(buildPayload(match, redirectedFrom), { status: 200, headers: okHeaders() });
      }

      // 1b) Reverse fallback (rare)
      const reverse = reverseSlugSource(slugForwardMap, incoming);
      if (reverse) {
        const match2 = findLiveRowByKey(reverse);
        if (match2) {
          if (!enforcePublicGate(match2)) return notFound();
          return json(buildPayload(match2, incoming), { status: 200, headers: okHeaders() });
        }
      }
    }

    // 2) Email lookup (admin OR self-only) + STRICT duplicate handling
    if (emailParamRaw) {
      const wantEmail = normalizeGmail(emailParamRaw);

      if (!admin) {
        if (!sessionEmailNorm || wantEmail !== sessionEmailNorm) {
          return json({ error: "Forbidden" }, { status: 403, headers: noStoreHeaders() });
        }
      }

      if (emailIdx === -1) return notFound();

      const matches = liveRows.filter((r) => normalizeGmail(String(r[emailIdx] ?? "")) === wantEmail);

      if (matches.length === 1) {
        const hit = matches[0];
        if (!enforcePublicGate(hit)) return notFound();
        return json(buildPayload(hit), { status: 200, headers: okHeaders() });
      }

      if (matches.length > 1) {
        // ✅ STRICT: always 409 duplicate_email
        if (!admin) {
          return json({ error: "duplicate_email" }, { status: 409, headers: noStoreHeaders() });
        }

        const ids = matches.map((r) => ({
          alumniId: alumniIdIdx !== -1 ? normSlug(String(r[alumniIdIdx] ?? "")) : "",
          slug: slugIdx !== -1 ? normSlug(String(r[slugIdx] ?? "")) : "",
          status: statusIdx !== -1 ? String(r[statusIdx] ?? "") : "",
          isPublic: isPublicIdx !== -1 ? String(r[isPublicIdx] ?? "") : "",
          updatedAt: updatedAtIdx !== -1 ? String(r[updatedAtIdx] ?? "") : "",
        }));

        return json(
          {
            error: "duplicate_email",
            email: wantEmail,
            matchCount: matches.length,
            matches: ids,
          },
          { status: 409, headers: noStoreHeaders() }
        );
      }

      // Profile-Aliases fallback (optional)
      try {
        const aliasResp = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: "Profile-Aliases!A:B",
          valueRenderOption: "UNFORMATTED_VALUE",
        });
        const aliasVals = (aliasResp.data.values || []) as any[][];
        const [, ...aRows] = aliasVals.length ? aliasVals : [[]];

        const mapHit = aRows.find(([e, aid]) => {
          if (!e || !aid) return false;
          return normalizeGmail(String(e)) === wantEmail;
        });

        if (mapHit) {
          const ownerId = normSlug(String(mapHit[1] ?? ""));
          const hit2 = findLiveRowByKey(ownerId);
          if (hit2) {
            if (!enforcePublicGate(hit2)) return notFound();
            return json(buildPayload(hit2), { status: 200, headers: okHeaders() });
          }
        }
      } catch {
        // optional
      }
    }

    return notFound();
  } catch (e: any) {
    // Sheets failed: fallback (public only)
    const fb = await lookupFromCsvFallback({
      alumniId: lookupKey,
      admin,
    });


    if (fb.kind === "admin-unavailable") {
      return json(
        { error: "Admin lookup unavailable (Sheets unreachable)" },
        { status: 503, headers: noStoreHeaders() }
      );
    }

    if (fb.kind === "ok") {
      return json(fb.payload, {
        status: 200,
        headers: forceNoStore ? noStoreHeaders() : privateCache60Headers(),
      });
    }

    return json({ error: "not found" }, { status: 404, headers: noStoreHeaders() });
  }
}
