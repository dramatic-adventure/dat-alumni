// lib/sendEmail.ts
//
// The one shared email helper for the whole site (site-BUILD-SPEC-gmail-email.md).
// Sends through the Gmail API as the dedicated sending mailbox, authenticated by
// a per-mailbox OAuth refresh token scoped to gmail.send ONLY — deliberately not
// the Sheets/Drive service account (domain-wide delegation was rejected: it can
// impersonate any Workspace user) and not an app password (not scopable to
// send-only). See §3 of the spec before changing the auth mechanism.
//
// Secrets come from lib/emailSecrets.ts (Netlify Blobs, env-var fallback for
// local dev). CONTACT_FROM_EMAIL stays a plain env var — tiny and non-secret.
//
// Never throws: returns { ok: false, error } so callers keep their own
// fatal-vs-non-fatal semantics.

import "server-only";
import { google } from "googleapis";
import MailComposer from "nodemailer/lib/mail-composer";
import {
  getGmailClientId,
  getGmailClientSecret,
  getGmailRefreshToken,
} from "@/lib/emailSecrets";

const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "";

type GmailClient = ReturnType<typeof google.gmail>;

// Cached per warm instance so the access token (auto-refreshed and held on the
// OAuth2 client by googleapis) is reused across sends instead of re-minted.
let cachedGmail: GmailClient | null = null;

async function gmailClient(): Promise<GmailClient | null> {
  if (cachedGmail) return cachedGmail;
  const [clientId, clientSecret, refreshToken] = await Promise.all([
    getGmailClientId(),
    getGmailClientSecret(),
    getGmailRefreshToken(),
  ]);
  if (!clientId || !clientSecret || !refreshToken) return null;
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  cachedGmail = google.gmail({ version: "v1", auth: oauth2 });
  return cachedGmail;
}

export async function emailConfigured(): Promise<boolean> {
  if (!FROM_EMAIL) return false;
  return (await gmailClient()) !== null;
}

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  bcc?: string | string[];
  /** content is base64 (matches what the apply route already builds). */
  attachments?: { filename: string; content: string }[];
};

export async function sendEmail(opts: SendEmailOptions): Promise<{ ok: boolean; error?: string }> {
  const gmail = await gmailClient();
  if (!gmail || !FROM_EMAIL) {
    return { ok: false, error: "Email not configured (GMAIL_OAUTH_* / CONTACT_FROM_EMAIL)" };
  }

  try {
    const mail = new MailComposer({
      from: FROM_EMAIL,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      replyTo: opts.replyTo,
      bcc: opts.bcc,
      attachments: opts.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        encoding: "base64",
      })),
    });
    const message = await new Promise<Buffer>((resolve, reject) => {
      mail.compile().build((err, msg) => (err ? reject(err) : resolve(msg)));
    });

    if (opts.attachments?.length) {
      // Attachment sends can exceed the plain JSON endpoint's payload cap
      // (apply allows up to 18 MB of files ≈ 24 MB of MIME); the media-upload
      // path accepts raw RFC822 up to Gmail's 35 MB message limit.
      await gmail.users.messages.send({
        userId: "me",
        requestBody: {},
        media: { mimeType: "message/rfc822", body: message.toString() },
      });
    } else {
      await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw: message.toString("base64url") },
      });
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
