// /app/api/alumni/lookup/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { rateLimit } from "@/lib/rateLimit"; // simple in-memory limiter

export const runtime = "nodejs";

function parseSA(jsonStr: string) {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return JSON.parse(jsonStr.replace(/\\n/g, "\n"));
  }
}

function indexOfHeader(header: string[], names: string[]) {
  const lower = header.map((h) => String(h || "").trim().toLowerCase());
  for (const n of names) {
    const i = lower.indexOf(n);
    if (i !== -1) return i;
  }
  return -1;
}

function normalizeGmail(raw: string) {
  const e = String(raw || "").trim().toLowerCase();
  const [user, domain] = e.split("@");
  if (!user || !domain) return e;

  const canonDomain = domain === "googlemail.com" ? "gmail.com" : domain;
  if (canonDomain !== "gmail.com") return `${user}@${canonDomain}`;

  // strip "+tag" and dots for gmail.com
  const noPlus = user.split("+")[0];
  const noDots = noPlus.replace(/\./g, "");
  return `${noDots}@gmail.com`;
}

export async function GET(req: Request) {
  try {
    // ── rate limit (per IP, 120 req / min)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(ip, 120, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const emailParam = (searchParams.get("email") || "").trim().toLowerCase();
    const alumniIdParam = (searchParams.get("alumniId") || "").trim().toLowerCase();

    if (!emailParam && !alumniIdParam) {
      return NextResponse.json({ error: "email or alumniId required" }, { status: 400 });
    }

    const sheetId = process.env.ALUMNI_SHEET_ID;
    const saJson = process.env.GCP_SA_JSON;
    if (!sheetId || !saJson) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    const sa = parseSA(saJson);

    const auth = new google.auth.JWT({
      email: sa.client_email,
      key: sa.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    // Pull Profile-Live (wider range to include asset/status columns)
    const liveRange = "Profile-Live!A:ZZ";
    const live = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: liveRange,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const liveRows = (live.data.values || []) as any[][];
    const [H, ...rows] = liveRows.length ? liveRows : [[]];

    const idx = (names: string | string[]) =>
      Array.isArray(names) ? indexOfHeader(H as string[], names) : indexOfHeader(H as string[], [names]);

    const idIdx = idx(["alumniid", "slug", "alumni id"]);
    const statusIdx = idx(["status"]);

    // Collect any "email-ish" columns (email, gmail, altEmail, etc.)
    const emailCols: number[] = (H || [])
      .map((h: string, i: number) => ({ h: String(h || "").toLowerCase(), i }))
      .filter(({ h }) => /(email|gmail)/.test(h))
      .map(({ i }) => i);

    // Helper to build response from a live row
    function buildLiveResponse(row: any[], source: "live" | "alias-live") {
      const alumniId = idIdx !== -1 ? String(row[idIdx] || "").trim().toLowerCase() : "";
      const status = statusIdx !== -1 ? String(row[statusIdx] || "").trim().toLowerCase() : "";
      const emails = emailCols.map((i) => String(row[i] || "")).filter(Boolean);

      const currentHeadshotIdIdx = idx(["currentheadshotid"]);
      const featuredAlbumIdIdx = idx(["featuredalbumid"]);
      const featuredReelIdIdx = idx(["featuredreelid"]);
      const featuredEventIdIdx = idx(["featuredeventid"]);

      const assets = {
        currentHeadshotId: currentHeadshotIdIdx !== -1 ? String(row[currentHeadshotIdIdx] || "") : "",
        featuredAlbumId: featuredAlbumIdIdx !== -1 ? String(row[featuredAlbumIdIdx] || "") : "",
        featuredReelId: featuredReelIdIdx !== -1 ? String(row[featuredReelIdIdx] || "") : "",
        featuredEventId: featuredEventIdIdx !== -1 ? String(row[featuredEventIdIdx] || "") : "",
      };

      return { alumniId, status, assets, emails, source };
    }

    // 1) If alumniId provided, match directly in Profile-Live
    if (alumniIdParam && rows.length && idIdx !== -1) {
      const match = rows.find((r) => String(r[idIdx] || "").trim().toLowerCase() === alumniIdParam);
      if (match) {
        return NextResponse.json(buildLiveResponse(match, "live"));
      }
    }

    // 2) If email provided, try direct scan of Profile-Live
    if (emailParam && rows.length && emailCols.length) {
      const normEmail = normalizeGmail(emailParam);
      for (const r of rows) {
        const candidates = emailCols.map((i) => String(r[i] || "")).filter(Boolean);
        const normed = new Set(candidates.map(normalizeGmail));
        if (normed.has(normEmail)) {
          return NextResponse.json(buildLiveResponse(r, "live"));
        }
      }

      // 3) Optional alias sheet as fallback (Profile-Aliases!A:B => email -> alumniId)
      try {
        const aliasResp = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: "Profile-Aliases!A:B",
          valueRenderOption: "UNFORMATTED_VALUE",
        });
        const aliasRows = (aliasResp.data.values || []) as any[][];
        if (aliasRows.length > 1) {
          const [, ...aRows] = aliasRows;
          const nEmail = normalizeGmail(emailParam);
          const aliasHit = aRows.find(([e, aid]) => e && aid && normalizeGmail(String(e)) === nEmail);
          if (aliasHit) {
            const aliasId = String(aliasHit[1]).trim().toLowerCase();
            if (rows.length && idIdx !== -1) {
              const liveRow = rows.find((rr) => String(rr[idIdx] || "").trim().toLowerCase() === aliasId);
              if (liveRow) {
                return NextResponse.json(buildLiveResponse(liveRow, "alias-live"));
              }
            }
            return NextResponse.json({ alumniId: aliasId, source: "alias" });
          }
        }
      } catch {
        /* alias sheet optional */
      }
    }

    // 4) Fallback: most recent in Profile-Changes (email -> alumniId)
    if (emailParam) {
      const chgRange = "Profile-Changes!A:ZZ";
      const chg = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: chgRange,
        valueRenderOption: "UNFORMATTED_VALUE",
      });
      const chgRows = (chg.data.values || []) as any[][];
      if (chgRows.length > 1) {
        const [h, ...rows2] = chgRows;
        const emailIdx = indexOfHeader(h, ["email"]);
        const slugIdx = indexOfHeader(h, ["alumniid", "slug", "alumni id"]);
        if (emailIdx !== -1 && slugIdx !== -1) {
          const nEmail = normalizeGmail(emailParam);
          for (let i = rows2.length - 1; i >= 0; i--) {
            const r = rows2[i];
            const e = normalizeGmail(String(r[emailIdx] || "").toLowerCase().trim());
            const s = String(r[slugIdx] || "").toLowerCase().trim();
            if (e === nEmail && s) {
              return NextResponse.json({ alumniId: s, source: "changes" });
            }
          }
        }
      }
    }

    return NextResponse.json({ error: "not found" }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 });
  }
}
