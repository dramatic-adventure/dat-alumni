// app/api/admin/diag-profile/route.ts
import { NextResponse } from "next/server";
import { getSlugForward, loadAlumniBySlug } from "@/lib/loadAlumni";
import { getAllStories } from "@/lib/loadRows";
import { getSlugAliases, normSlug } from "@/lib/slugAliases";
import { filterRowsByAliases } from "@/lib/rowsByAliases";
import { loadCsv } from "@/lib/loadCsv";

export const runtime = "nodejs";

// tiny CSV parser that handles quotes/commas/newlines
type Row = Record<string, string>;
function parseCsv(text: string): Row[] {
  const rows: string[][] = [];
  let cell = "", row: string[] = [], inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQ = false;
      } else cell += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
      else if (ch !== "\r") cell += ch;
    }
  }
  row.push(cell); rows.push(row);
  if (!rows.length) return [];
  const header = rows[0].map(h => (h || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"));
  const out: Row[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r]; if (!cells || cells.every(c => c === "")) continue;
    const obj: Row = {};
    for (let c = 0; c < header.length; c++) obj[header[c] || `col-${c}`] = (cells[c] ?? "").trim();
    out.push(obj);
  }
  return out;
}

function pick(r: Row, keys: string[]) {
  for (const k of keys) if (k in r && r[k]) return r[k];
  return "";
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const incoming = normSlug(url.searchParams.get("slug") || "");
    if (!incoming) return NextResponse.json({ ok: false, error: "slug required" }, { status: 400 });

    // 1) forward resolution
    const target = normSlug(await getSlugForward(incoming) || "");
    const loadKey = target || incoming;

    // 2) load alum
    const alum = await loadAlumniBySlug(loadKey);
    if (!alum) {
      return NextResponse.json({
        ok: true,
        incoming,
        target: target || null,
        found: false,
        message: "No alumni row found",
      });
    }

    const canonical = normSlug(alum.slug || loadKey);

    // 3) aliases
    const aliases = await getSlugAliases(canonical || incoming);
    const aliasList = Array.from(aliases).sort();

    // 4) stories
    const allStories = await getAllStories();
    const matchedStories = filterRowsByAliases(
      allStories,
      aliases,
      alum.name,
      {
        slugFields: ["slug", "alumniSlug", "profileSlug"],
        nameFields: ["name", "alumniName"],
        akaFields: ["aka", "aliases", "previousNames", "formerNames"],
      }
    );
    const storySample = matchedStories.slice(0, 5).map((s: any) => s.title || s.headline || s.name || s.slug);

    // 5) collections (CSV) — same logic as page, but inline for diag
    const candidates: string[] = [];
    if (process.env.NEXT_PUBLIC_COLLECTIONS_CSV_URL) candidates.push(process.env.NEXT_PUBLIC_COLLECTIONS_CSV_URL);
    if (process.env.COLLECTIONS_CSV_URL) candidates.push(process.env.COLLECTIONS_CSV_URL);
    if (process.env.ALUMNI_SHEET_ID) {
      const tab = process.env.COLLECTIONS_TAB || "Profile-Collections";
      candidates.push(
        `https://docs.google.com/spreadsheets/d/${process.env.ALUMNI_SHEET_ID}/export?format=csv&sheet=${encodeURIComponent(tab)}`
      );
    }

    let csvText = "";
    let collectionsSource = "";
    for (const c of candidates) {
      try {
        csvText = await loadCsv(c, "collections.csv");
        if (csvText) { collectionsSource = c; break; }
      } catch { /* continue */ }
    }

    const collInfo = { tried: candidates, using: collectionsSource || null, images: 0, posters: 0, sample: [] as string[] };
    if (csvText) {
      const rows = parseCsv(csvText);
      const slugKeys = ["slug", "alumnislug", "profile-slug"];
      const idKeys = ["alumniid", "alumni-id", "artistid", "artist-id"];
      const typeKeys = ["type", "collection-type", "kind"];
      const urlKeys = ["url", "image-url", "src", "href"];

      const idLower = String((alum as any).alumniId || (alum as any).id || "").toLowerCase();
      const imgs: string[] = [];
      const posts: string[] = [];

      for (const r of rows) {
        const rSlug = normSlug(pick(r, slugKeys));
        const rId = (pick(r, idKeys) || "").trim().toLowerCase();
        const matches = (rSlug && aliases.has(rSlug)) || (!!idLower && rId === idLower);
        if (!matches) continue;

        const t = (pick(r, typeKeys) || "").toLowerCase();
        const u = pick(r, urlKeys);
        if (!u) continue;
        if (/(poster|keyart|one-sheet)/.test(t)) posts.push(u);
        else imgs.push(u);
      }

      collInfo.images = imgs.length;
      collInfo.posters = posts.length;
      collInfo.sample = [...imgs.slice(0, 2), ...posts.slice(0, 2)];
    }

    // 6) field completeness (quick glance)
    const filled = (v: any) => !!(Array.isArray(v) ? v.length : (v ?? "").toString().trim());
    const completeness = {
      headshotUrl: filled(alum.headshotUrl),
      roles: filled(alum.roles),
      artistStatement: filled(alum.artistStatement),
      imageUrls: filled(alum.imageUrls),
      posterUrls: filled(alum.posterUrls),
      socials: filled(alum.socials),
      updates: filled(alum.updates),
    };

    return NextResponse.json({
      ok: true,
      incoming,
      target: target || null,
      canonical,
      found: true,
      aliases: aliasList,
      alumPreview: {
        slug: alum.slug,
        name: alum.name,
        role: alum.roles?.[0] || "",
        headshotUrl: alum.headshotUrl || "",
      },
      completeness,
      stories: {
        count: matchedStories.length,
        sample: storySample,
      },
      collections: collInfo,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
