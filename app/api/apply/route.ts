// app/api/apply/route.ts
import "server-only";
import { NextResponse } from "next/server";
import { findOpportunity } from "@/lib/loadOpportunities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const CONTACT_FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "";
const APPLY_INBOX_EMAIL =
  process.env.APPLY_INBOX_EMAIL ||
  process.env.CONTACT_INBOX_EMAIL ||
  "hello@dramaticadventure.com";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB per file
const MAX_TOTAL_BYTES = 18 * 1024 * 1024; // 18 MB combined (Resend caps around 40MB total)
const ALLOWED_MIME_PREFIXES = ["image/", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument"];

function escapeHtml(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value: string | undefined) {
  if (!value || !value.trim()) return "";
  return `
    <tr>
      <td style="padding:0.55rem 0;color:#6C00AF;font-weight:700;width:34%;vertical-align:top;">${label}</td>
      <td style="padding:0.55rem 0;color:#241123;white-space:pre-wrap;">${escapeHtml(value)}</td>
    </tr>`;
}

function sanitizeFilename(name: string, fallback: string): string {
  const base = (name || fallback).replace(/[^\w.\-]+/g, "_");
  return base.length > 80 ? base.slice(0, 80) : base || fallback;
}

function isAllowedMime(type: string): boolean {
  if (!type) return false;
  return ALLOWED_MIME_PREFIXES.some((p) => type.toLowerCase().startsWith(p));
}

async function fileToAttachment(
  file: File | null,
  fallbackName: string,
): Promise<
  { ok: true; attachment: { filename: string; content: string }; bytes: number; mime: string }
  | { ok: false; error?: string }
  | { ok: "skip" }
> {
  if (!file || file.size === 0) return { ok: "skip" };
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: `${fallbackName} is too large (max 8 MB).` };
  }
  if (!isAllowedMime(file.type)) {
    return {
      ok: false,
      error: `${fallbackName} must be an image, PDF, or Word document.`,
    };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  return {
    ok: true,
    attachment: {
      filename: sanitizeFilename(file.name, fallbackName),
      content: buf.toString("base64"),
    },
    bytes: file.size,
    mime: file.type,
  };
}

export async function POST(req: Request) {
  // ── Parse multipart form ──
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const get = (key: string) => String(form.get(key) ?? "").trim();

  const opportunityId = get("opportunityId");
  const opportunityTitle = get("opportunityTitle");
  const name = get("name");
  const email = get("email");
  const phone = get("phone");
  const pronouns = get("pronouns");
  const location = get("location");
  const hub = get("hub");
  const roleInterest = get("roleInterest");
  const yearsExperience = get("yearsExperience");
  const links = get("links");
  const whyDAT = get("whyDAT");
  const anythingElse = get("anythingElse");
  const website = get("website"); // honeypot

  if (website) {
    return NextResponse.json({ ok: true });
  }

  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email are required." },
      { status: 422 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 422 },
    );
  }

  // ── Files ──
  const headshot = form.get("headshot") instanceof File ? (form.get("headshot") as File) : null;
  const resume = form.get("resume") instanceof File ? (form.get("resume") as File) : null;
  const coverLetter = form.get("coverLetter") instanceof File ? (form.get("coverLetter") as File) : null;

  const attachments: { filename: string; content: string }[] = [];
  const attachmentSummary: string[] = [];
  let totalBytes = 0;

  for (const [file, fallback] of [
    [headshot, "headshot"],
    [resume, "resume"],
    [coverLetter, "cover-letter"],
  ] as [File | null, string][]) {
    const r = await fileToAttachment(file, fallback);
    if (r.ok === false) {
      return NextResponse.json({ error: r.error }, { status: 422 });
    }
    if (r.ok === true) {
      totalBytes += r.bytes;
      if (totalBytes > MAX_TOTAL_BYTES) {
        return NextResponse.json(
          { error: "Total attachments exceed 18 MB. Please reduce file sizes." },
          { status: 422 },
        );
      }
      attachments.push(r.attachment);
      attachmentSummary.push(`${r.attachment.filename} (${(r.bytes / 1024).toFixed(0)} KB · ${r.mime})`);
    }
  }

  // Resolve opportunity for context (best-effort)
  let opp = null;
  if (opportunityId) {
    try {
      opp = await findOpportunity(opportunityId);
    } catch {
      // ignore
    }
  }

  const title = opp?.title || opportunityTitle || "General Interest";
  const subject = `🎭 New Application: ${name} → ${title}`;
  const accent = "#6C00AF";

  const htmlBody = `
    <div style="font-family:system-ui,sans-serif;max-width:660px;margin:0 auto;">
      <div style="background:${accent};color:#fff;padding:1.5rem 2rem;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:1.4rem;letter-spacing:0.04em;">New DAT Opportunity Application</h1>
        <p style="margin:0.35rem 0 0;opacity:0.85;font-size:0.92rem;">For: ${escapeHtml(title)}</p>
      </div>
      <div style="background:#fdf9f1;border:1px solid #e5d8c0;border-top:0;border-radius:0 0 12px 12px;padding:1.75rem 2rem;">
        <table style="width:100%;border-collapse:collapse;font-size:0.93rem;">
          ${row("Opportunity", opp ? `${opp.title} (${opp.id})` : opportunityTitle || "General")}
          ${row("Name", name)}
          ${row("Email", email)}
          ${row("Phone", phone)}
          ${row("Pronouns", pronouns)}
          ${row("Location", location)}
          ${row("Hub of Interest", hub)}
          ${row("Role / Department", roleInterest)}
          ${row("Years of Experience", yearsExperience)}
          ${row("Links / Portfolio", links)}
          ${row("Attachments", attachmentSummary.length ? attachmentSummary.join("\n") : "—")}
        </table>

        ${
          whyDAT?.trim()
            ? `<div style="margin-top:1.25rem;padding:1.25rem 1.5rem;background:rgba(108,0,175,0.06);border:1px solid rgba(108,0,175,0.18);border-radius:10px;">
                 <p style="margin:0 0 0.5rem;color:${accent};font-weight:700;font-size:0.82rem;letter-spacing:0.1em;text-transform:uppercase;">Why DAT?</p>
                 <p style="margin:0;color:#241123;line-height:1.7;font-size:0.95rem;white-space:pre-wrap;">${escapeHtml(whyDAT)}</p>
               </div>`
            : ""
        }

        ${
          anythingElse?.trim()
            ? `<div style="margin-top:1rem;padding:1.25rem 1.5rem;background:rgba(108,0,175,0.04);border:1px solid rgba(108,0,175,0.12);border-radius:10px;">
                 <p style="margin:0 0 0.5rem;color:${accent};font-weight:700;font-size:0.82rem;letter-spacing:0.1em;text-transform:uppercase;">Anything Else</p>
                 <p style="margin:0;color:#241123;line-height:1.7;font-size:0.95rem;white-space:pre-wrap;">${escapeHtml(anythingElse)}</p>
               </div>`
            : ""
        }

        <div style="margin-top:1.75rem;padding-top:1.25rem;border-top:1px solid #e5d8c0;">
          <a href="mailto:${encodeURIComponent(email)}?subject=Re:%20Your%20DAT%20application"
             style="display:inline-block;padding:0.75rem 1.5rem;background:${accent};color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:0.82rem;letter-spacing:0.1em;text-transform:uppercase;">
            Reply to ${escapeHtml(name)}
          </a>
        </div>
      </div>
    </div>
  `;

  // Graceful fallback for local dev
  if (!RESEND_API_KEY || !CONTACT_FROM_EMAIL) {
    console.log("[apply] Resend not configured — submission logged locally:", {
      title,
      name,
      email,
      opportunityId,
      attachments: attachmentSummary,
    });
    return NextResponse.json({ ok: true });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL,
        to: [APPLY_INBOX_EMAIL],
        reply_to: email,
        subject,
        html: htmlBody,
        ...(attachments.length ? { attachments } : {}),
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[apply] Resend error:", err);
      return NextResponse.json({ error: "Email failed to send." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[apply] Unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
