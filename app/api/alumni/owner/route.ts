// app/api/alumni/owner/route.ts
import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";
import { requireAuth } from "@/lib/requireAuth";

export const runtime = "nodejs";

function isDevBypassAllowed() {
  return process.env.NODE_ENV !== "production";
}

function hasValidAdminHeader(req: Request) {
  const key = String(req.headers.get("x-admin-key") || "").trim();
  const token = String(req.headers.get("x-admin-token") || "").trim();

  const envKey = String(process.env.ADMIN_API_KEY || "").trim();
  const envToken = String(process.env.ADMIN_TOKEN || "").trim();

  return (!!envKey && key === envKey) || (!!envToken && token === envToken);
}

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

/**
 * Resolve stable owner alumniId for a login email (Profile-Owners → Aliases optional)
 */
async function resolveOwnerAlumniId(
  sheets: ReturnType<typeof sheetsClient>,
  spreadsheetId: string,
  email: string
): Promise<string> {
  const nEmail = normalizeGmail(email);
  if (!nEmail) return "";

  // 1) Profile-Owners (source of truth)
  const owners = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Profile-Owners!A:ZZ",
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const ownersRows = owners.data.values ?? [];
  if (ownersRows.length > 1) {
    const [H, ...rows] = ownersRows as any[][];
    const idIdx = idxOf(H, ["alumniid", "alumni id", "id"]);
    const ownerEmailIdx = idxOf(H, ["owneremail", "owner email"]);
    if (idIdx !== -1 && ownerEmailIdx !== -1) {
      for (const r of rows) {
        const e = normalizeGmail(String(r[ownerEmailIdx] || ""));
        if (e && e === nEmail) return normId(r[idIdx]);
      }
    }
  }

  // 2) Optional legacy Profile-Aliases fallback
  try {
    const alias = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Profile-Aliases!A:B",
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const aRows = alias.data.values ?? [];
    if (aRows.length > 1) {
      const [, ...rest] = aRows;
      const hit = rest.find(
        ([e, aid]) => e && aid && normalizeGmail(String(e)) === nEmail
      );
      if (hit) return normId(hit[1]);
    }
  } catch {
    // optional
  }

  return "";
}

export async function GET(req: Request) {
  // always discourage caching (this endpoint is identity-sensitive)
  const noStoreHeaders = {
    "Cache-Control": "no-store, max-age=0",
    Pragma: "no-cache",
  };

  const spreadsheetId = process.env.ALUMNI_SHEET_ID;
  if (!spreadsheetId) {
    return NextResponse.json(
      { ok: false, error: "Missing ALUMNI_SHEET_ID" },
      { status: 500, headers: noStoreHeaders }
    );
  }

  let sheets: ReturnType<typeof sheetsClient>;

  // ✅ DEV-ONLY admin header bypass for local curl/debug:
  // Accept ?email=... OR ?alumniId=...
  // If neither is provided, fall back to ADMIN_ALUMNI_ID (DEV only).
  if (isDevBypassAllowed() && hasValidAdminHeader(req)) {
    const url = new URL(req.url);

    const directId = normId(url.searchParams.get("alumniId") || "");
    if (directId) {
      return NextResponse.json(
        { ok: true, alumniId: directId, devBypass: true },
        { status: 200, headers: noStoreHeaders }
      );
    }

    const email = normalizeGmail(url.searchParams.get("email") || "");
    if (email) {
      sheets = sheetsClient();
      const ownerId = await resolveOwnerAlumniId(sheets, spreadsheetId, email);
      if (!ownerId) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "No alumniId found for that email (Profile-Owners/Profile-Aliases).",
          },
          { status: 404, headers: noStoreHeaders }
        );
      }
      return NextResponse.json(
        { ok: true, alumniId: ownerId, devBypass: true },
        { headers: noStoreHeaders }
      );
    }

    const fallback = normId(process.env.ADMIN_ALUMNI_ID || "");
    if (!fallback) {
      return NextResponse.json(
        {
          ok: false,
          error: "Admin bypass requires ?email=... or ?alumniId=... (DEV only).",
        },
        { status: 400, headers: noStoreHeaders }
      );
    }

    return NextResponse.json(
      { ok: true, alumniId: fallback, devBypass: true },
      { headers: noStoreHeaders }
    );
  }

  // ✅ Normal path: requires real session auth
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const email = normalizeGmail(auth.email || "");
  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Missing session email" },
      { status: 400, headers: noStoreHeaders }
    );
  }

  sheets = sheetsClient();
  const ownerId = await resolveOwnerAlumniId(sheets, spreadsheetId, email);
  if (!ownerId) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "No alumniId found for session email (Profile-Owners/Profile-Aliases).",
      },
      { status: 404, headers: noStoreHeaders }
    );
  }

  return NextResponse.json(
    { ok: true, alumniId: ownerId },
    { headers: noStoreHeaders }
  );
}