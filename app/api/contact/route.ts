// /app/api/contact/route.ts
import "server-only";
import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";
import { normalizeGmail, withRetry, idxOf, getOwnerEmailForAlumniId as getOwnerEmailForAlumniIdFromOwners } from "@/lib/ownership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  alumniId: string;
  fromName?: string;
  fromEmail: string;
  message: string;

  /**
   * Honeypot field. Your public form should include this input but hide it with CSS.
   * If a bot fills it, we pretend success but do NOT send.
   */
  website?: string;
};

const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";
const LIVE_TAB = process.env.ALUMNI_LIVE_TAB || process.env.ALUMNI_TAB || "Profile-Live";
const OWNERS_TAB = process.env.ALUMNI_OWNERS_TAB || "Profile-Owners";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const CONTACT_FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "";
const CONTACT_INBOX_EMAIL = process.env.CONTACT_INBOX_EMAIL || "";

// Comma-separated list of allowed origins, e.g.
// "https://stories.dramaticadventure.com,https://www.dramaticadventure.com"
const CONTACT_ALLOWED_ORIGINS = process.env.CONTACT_ALLOWED_ORIGINS || "";

function norm(s: unknown) {
  return String(s ?? "").trim();
}
function clamp(s: string, max: number) {
  return s.length > max ? s.slice(0, max) : s;
}

function isAllowedOrigin(req: Request): boolean {
  // If you don't set CONTACT_ALLOWED_ORIGINS, we don't block.
  const allow = CONTACT_ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
  if (!allow.length) return true;

  const origin = (req.headers.get("origin") || "").trim();
  // If no Origin header (server-to-server, curl), allow.
  if (!origin) return true;

  return allow.includes(origin);
}

function getClientIp(req: Request): string {
  // Netlify + generic reverse proxy headers
  const xf = req.headers.get("x-forwarded-for") || "";
  const first = xf.split(",")[0]?.trim();
  if (first) return first;

  const nf = req.headers.get("x-nf-client-connection-ip")?.trim();
  if (nf) return nf;

  const xr = req.headers.get("x-real-ip")?.trim();
  if (xr) return xr;

  return "unknown";
}

function looksLikeEmail(s: string): boolean {
  const v = String(s || "").trim();
  if (!v) return false;
  if (v.length > 254) return false;
  // Simple sanity regex; good enough for validation + preventing header injection
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return false;
  // prevent CRLF/header injection
  if (/[\r\n]/.test(v)) return false;
  return true;
}

function countLinks(s: string): number {
  const m = String(s || "").match(/\bhttps?:\/\/\S+/gi);
  return m ? m.length : 0;
}

/**
 * Basic in-memory rate limiting (per runtime instance).
 * Not perfect across cold starts, but dramatically reduces abuse.
 */
const RL = globalThis as unknown as {
  __datContactRl?: Map<string, { n: number; resetAt: number }>;
};
const rlStore = (RL.__datContactRl ||= new Map());

function rateLimitHit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cur = rlStore.get(key);
  if (!cur || now >= cur.resetAt) {
    rlStore.set(key, { n: 1, resetAt: now + windowMs });
    return false;
  }
  cur.n += 1;
  return cur.n > limit;
}

async function getLivePublicEmailForAlumniId(alumniId: string): Promise<string> {
  const sheets = sheetsClient();
  const res = await withRetry(
    () =>
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${LIVE_TAB}!A:ZZ`,
        valueRenderOption: "UNFORMATTED_VALUE",
      }),
    "Sheets get Profile-Live (contact)"
  );

  const all = (res.data.values ?? []) as any[][];
  if (all.length < 2) return "";
  const header = (all[0] ?? []).map((h) => String(h ?? "").trim());
  const rows = all.slice(1);

  const alumniIdIdx = idxOf(header, ["alumniId", "alumniid", "id"]);
  const publicEmailIdx = idxOf(header, ["publicEmail", "public_email", "public email"]);
  if (alumniIdIdx < 0 || publicEmailIdx < 0) return "";

  const row = rows.find((r) => String(r?.[alumniIdIdx] ?? "").trim() === alumniId);
  if (!row) return "";

  return String(row?.[publicEmailIdx] ?? "").trim();
}

async function sendViaResend(args: { to: string; subject: string; text: string; replyTo: string }) {
  if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");
  if (!CONTACT_FROM_EMAIL) throw new Error("Missing CONTACT_FROM_EMAIL");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: CONTACT_FROM_EMAIL,
      to: [args.to],
      subject: args.subject,
      text: args.text,
      reply_to: args.replyTo,
      ...(CONTACT_INBOX_EMAIL ? { bcc: [CONTACT_INBOX_EMAIL] } : {}),
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Resend send failed (${res.status}): ${t}`);
  }
}

export async function POST(req: Request) {
  if (!spreadsheetId) {
    return NextResponse.json({ ok: false, error: "Missing ALUMNI_SHEET_ID" }, { status: 500 });
  }

  if (!isAllowedOrigin(req)) {
    // Don't give attackers useful info; generic failure.
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let body: Body | null = null;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const ip = getClientIp(req);

  const alumniId = norm(body?.alumniId);
  const fromEmailRaw = norm(body?.fromEmail);
  const fromEmail = normalizeGmail(fromEmailRaw);
  const fromName = clamp(norm(body?.fromName || "Someone"), 80);
  const message = clamp(norm(body?.message), 4000);

  // ✅ Honeypot: bots fill hidden fields. Pretend success; do not send.
  const website = norm((body as any)?.website);
  if (website) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (!alumniId)
    return NextResponse.json({ ok: false, error: "Missing alumniId" }, { status: 400 });

  if (!fromEmail)
    return NextResponse.json({ ok: false, error: "Missing fromEmail" }, { status: 400 });

  if (!looksLikeEmail(fromEmail))
    return NextResponse.json({ ok: false, error: "Invalid fromEmail" }, { status: 400 });

  if (!message)
    return NextResponse.json({ ok: false, error: "Empty message" }, { status: 400 });

  if (message.length < 10)
    return NextResponse.json({ ok: false, error: "Message too short" }, { status: 400 });

  // ✅ Abuse controls: limit links
  if (countLinks(message) > 2) {
    return NextResponse.json({ ok: false, error: "Too many links" }, { status: 400 });
  }

  // ✅ Rate limiting: per-IP + per-alumniId
  // Adjust numbers as desired, but these are a solid starting point.
  if (rateLimitHit(`ip:${ip}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded" }, { status: 429 });
  }
  if (rateLimitHit(`to:${alumniId}`, 4, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded" }, { status: 429 });
  }
  // Destination preference:
  // 1) Profile-Owners ownerEmail (private routing table)
  // 2) Profile-Live publicEmail (server-only, optional fallback)
  const ownerEmail = await getOwnerEmailForAlumniIdFromOwners(spreadsheetId, alumniId);
  const livePublicEmail = await getLivePublicEmailForAlumniId(alumniId);
  const toRaw = norm(ownerEmail) || norm(livePublicEmail);
  const to = normalizeGmail(toRaw);

  // ✅ Avoid creating an oracle spammers can use to test which alumniIds are deliverable.
  // If we can't resolve a valid destination, pretend success but do not send.
  if (!to) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (!looksLikeEmail(to)) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const subject = `DAT Alumni Contact: New message via site`;
  const text = [
    `You received a message via the DAT Alumni site.`,
    ``,
    `Recipient profile: ${alumniId}`,
    `Sender: ${fromName} <${fromEmail}>`,
    ``,
    `Message:`,
    message,
    ``,
    `---`,
    `Reply directly to the sender using the Reply-To address.`,
    `This relay does not reveal your email publicly.`,
  ].join("\n");

  await sendViaResend({
    to,
    subject,
    text,
    replyTo: fromEmail,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}