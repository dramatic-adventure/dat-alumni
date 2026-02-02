// app/api/alumni/owner/route.ts
import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";
import { requireAuth } from "@/lib/requireAuth";

export const runtime = "nodejs";

/** case-insensitive header lookup */
function idxOf(header: string[], candidates: string[]) {
  const lower = header.map((h) => String(h || "").trim().toLowerCase());
  for (const c of candidates) {
    const i = lower.indexOf(c.toLowerCase());
    if (i !== -1) return i;
  }
  return -1;
}

function normId(x: unknown) {
  return String(x ?? "").trim().toLowerCase();
}

/** Normalize gmail/googlemail and strip +tag/dots for gmail */
function normalizeGmail(raw: string) {
  const e = String(raw || "").trim().toLowerCase();
  const [user, domain] = e.split("@");
  if (!user || !domain) return e;

  const canonDomain = domain === "googlemail.com" ? "gmail.com" : domain;
  if (canonDomain !== "gmail.com") return `${user}@${canonDomain}`;

  const noPlus = user.split("+")[0];
  const noDots = noPlus.replace(/\./g, "");
  return `${noDots}@gmail.com`;
}

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const spreadsheetId = process.env.ALUMNI_SHEET_ID;
  if (!spreadsheetId) {
    return NextResponse.json({ ok: false, error: "Missing ALUMNI_SHEET_ID" }, { status: 500 });
  }

  const email = normalizeGmail(auth.email || "");
  if (!email) return NextResponse.json({ ok: false, error: "Missing email" }, { status: 400 });

  const sheets = sheetsClient();

  const live = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Profile-Live!A:ZZ",
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const liveRows = (live.data.values ?? []) as any[][];
  if (liveRows.length < 2) {
    return NextResponse.json({ ok: false, error: "Profile-Live empty" }, { status: 500 });
  }

  const [H, ...rows] = liveRows;
  const idIdx = idxOf(H, ["alumniid", "alumni id", "id"]);
  const emailIdx = idxOf(H, ["email"]);

  if (idIdx === -1 || emailIdx === -1) {
    return NextResponse.json({ ok: false, error: "Profile-Live missing alumniId/email" }, { status: 500 });
  }

  for (const r of rows) {
    const e = normalizeGmail(String(r[emailIdx] || ""));
    if (e && e === email) {
      const alumniId = normId(r[idIdx]);
      return NextResponse.json({ ok: true, alumniId });
    }
  }

  return NextResponse.json({ ok: false, error: "No alumniId found for session email" }, { status: 404 });
}
