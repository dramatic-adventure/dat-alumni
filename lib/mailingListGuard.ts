// /lib/mailingListGuard.ts
// ─────────────────────────────────────────────────────────────────────────────
// Shared spam defenses for the public mailing-list signup.
//
// WHY THIS EXISTS
//   /api/mailing-list originally had only a client-side honeypot. That did
//   nothing against what actually hit the form: first waves of generated
//   Gmail burner accounts, then a subscription-bombing campaign submitting
//   real people's addresses so DAT's welcome email floods their inboxes.
//   This module holds the server-side checks, so both the live route and the
//   sheet-cleanup script score rows identically.
//
// DESIGN PRINCIPLE: precision over recall.
//   An earlier version of this file scored "gibberish" with consonant-run,
//   keyboard-mash and digit-ratio heuristics. Executed against the real
//   subscriber data it quarantined ZERO of 256 actual spam rows while
//   flagging real names (Ernst Schmidt, Tigran Mkrtchyan, Vietnamese
//   phone-number Gmails). Every signal below is kept only if it is near-certain
//   on its own; anything that merely "looks botty" is not scored. The primary
//   bot control is Cloudflare Turnstile at the form (see lib/turnstile.ts) —
//   content scoring is a backstop, not the wall.
//
// NOTE: deliberately NOT marked "server-only". This is pure logic with no
// secrets and no I/O, and scripts/flag-mailing-list-spam.ts imports it from a
// plain tsx process so the sheet cleanup scores rows exactly the way the live
// endpoint does. Keep it that way — don't add credential or fs access here.
// ─────────────────────────────────────────────────────────────────────────────

/* ── Origin classification ───────────────────────────────────────────────────
 * Modern browsers send `Origin` on POSTs, but "always" is not safe to assume:
 * privacy extensions and certain Referrer-Policy setups strip it, sandboxed
 * webviews and cross-origin redirects send the literal string "null", and
 * proxy browsers (Opera Mini extreme mode) are unverified. So the route
 * CLASSIFIES the origin and records suspect submissions for review — it never
 * silently discards them. Hardcoded (with an env override) for the same reason
 * lib/csvUrls.ts is: Netlify's Lambda env bundle is up against AWS's 4KB cap.
 */
const DEFAULT_ALLOWED_ORIGINS = [
  "https://stories.dramaticadventure.com",
  "https://www.dramaticadventure.com",
  "https://dramaticadventure.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

/** Deploy previews for THIS site only: https://<hash>--dat-alumni.netlify.app.
 *  A bare ".netlify.app" suffix would allowlist every Netlify customer. */
const ALLOWED_ORIGIN_SUFFIXES = ["--dat-alumni.netlify.app"];
const ALLOWED_ORIGIN_HOSTS = ["dat-alumni.netlify.app"];

export function allowedOrigins(): string[] {
  const extra = (process.env.MAILING_LIST_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...DEFAULT_ALLOWED_ORIGINS, ...extra];
}

export type OriginVerdict = "allowed" | "missing" | "foreign";

/**
 * Classify the request's Origin. "missing" covers absent headers and the
 * literal "null" — both can be legitimate clients, so the route records those
 * rows instead of dropping them.
 */
export function classifyOrigin(req: Request): { verdict: OriginVerdict; origin: string } {
  const origin = (req.headers.get("origin") || "").trim();
  if (!origin || origin === "null") return { verdict: "missing", origin };

  if (allowedOrigins().includes(origin)) return { verdict: "allowed", origin };

  try {
    const host = new URL(origin).hostname;
    if (ALLOWED_ORIGIN_HOSTS.includes(host)) return { verdict: "allowed", origin };
    if (ALLOWED_ORIGIN_SUFFIXES.some((sfx) => host.endsWith(sfx))) {
      return { verdict: "allowed", origin };
    }
  } catch {
    // Unparsable Origin value — treat as foreign.
  }
  return { verdict: "foreign", origin };
}

/* ── Client IP ───────────────────────────────────────────────────────────────
 * x-nf-client-connection-ip is set by Netlify itself and cannot be forged by
 * the client. x-forwarded-for is checked LAST and only its final element is
 * used: proxies append, so everything before the last hop is client-supplied —
 * a bot sending a random XFF per request would otherwise get a fresh rate-limit
 * bucket every time.
 */
export function getClientIp(req: Request): string {
  const nf = req.headers.get("x-nf-client-connection-ip")?.trim();
  if (nf) return nf;
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const xf = (req.headers.get("x-forwarded-for") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return xf[xf.length - 1] || "unknown";
}

/* ── Email normalization ───────────────────────────────────────────────────── */

export function normalizeEmail(raw: unknown): string {
  return String(raw ?? "").trim().toLowerCase();
}

/**
 * Canonical Gmail form: dots and +tags in the local part are ignored by Gmail,
 * and subscription bombers cycle dot patterns specifically to slip past dedupe
 * that only lowercases. Mirrors normalizeGmail in lib/ownership.ts — duplicated
 * here (pure, no imports) so the tsx flagging script can share it without
 * dragging in "server-only" modules.
 */
export function normalizeGmail(raw: string): string {
  const e = normalizeEmail(raw);
  const [user, domain] = e.split("@");
  if (!user || !domain) return e;
  const canon = domain === "googlemail.com" ? "gmail.com" : domain;
  if (canon !== "gmail.com") return `${user}@${canon}`;
  const noPlus = user.split("+")[0];
  const noDots = noPlus.replace(/\./g, "");
  return `${noDots}@gmail.com`;
}

/**
 * Structural validity only — deliberately permissive about which characters a
 * local part may contain, strict about the things that break systems
 * (length, CRLF header injection, missing dot in the domain).
 */
export function isStructurallyValidEmail(email: string): boolean {
  if (!email) return false;
  if (email.length > 254) return false;
  if (/[\r\n\t]/.test(email)) return false; // header injection
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return false;

  const [local, domain] = email.split("@");
  if (!local || local.length > 64) return false;
  if (!domain || domain.length > 253) return false;
  if (domain.startsWith("-") || domain.endsWith("-")) return false;
  if (domain.includes("..")) return false;
  return true;
}

/**
 * Throwaway-inbox providers. Not exhaustive — no such list can be — but these
 * cover the generators bulk signup scripts reach for first.
 */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "sharklasers.com",
  "10minutemail.com",
  "10minutemail.net",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "yopmail.com",
  "trashmail.com",
  "dispostable.com",
  "getnada.com",
  "maildrop.cc",
  "fakeinbox.com",
  "mintemail.com",
  "spamgourmet.com",
  "mailnesia.com",
  "tempinbox.com",
  "emailondeck.com",
  "moakt.com",
  "mohmal.com",
  "luxusmail.org",
  "byom.de",
  "cock.li",
  "grr.la",
  "spam4.me",
  "einrot.com",
  "dropmail.me",
  "harakirimail.com",
]);

export function isDisposableDomain(email: string): boolean {
  const domain = email.split("@")[1] || "";
  return DISPOSABLE_DOMAINS.has(domain);
}

/* ── Scoring ─────────────────────────────────────────────────────────────────
 * Each signal here is individually near-certain, so ONE is enough to
 * quarantine (recorded in the sheet, no email sent to anyone). Measured
 * against the full historical dataset:
 *
 *   - dot-density: 113 of 256 rows. Gmail never issues dotted variants and
 *     real people don't type "j.e.s.s.i.ca.ba.r.rio.s.202.2"; the attacker
 *     generates them to defeat dedupe. Ordinary human patterns like
 *     "mary.obrien.1988" (2 dots, long segments) score clean.
 *   - disposable domains and URLs-in-name: classic bot artifacts, no
 *     legitimate overlap.
 *
 * What is deliberately NOT here: consonant runs, keyboard-mash, digit ratios,
 * word+digit shapes. Executed against real data they caught nothing and
 * quarantined real internationals — see the header comment.
 */

export type SignupScore = {
  /** 0 = no red flag. Any triggered signal quarantines. */
  score: number;
  reasons: string[];
};

/**
 * True for Gmail local parts with ≥3 dots where at least half the dot-separated
 * segments are 1–2 characters ("kat.z.r.h.o.n.d.a", "b.rian.y.s.0.829").
 */
export function isDotDenseGmail(email: string): boolean {
  const [local, domain] = normalizeEmail(email).split("@");
  if (!local || (domain !== "gmail.com" && domain !== "googlemail.com")) return false;
  const segments = local.split(".");
  if (segments.length < 4) return false; // fewer than 3 dots
  const short = segments.filter((s) => s.length <= 2).length;
  return short / segments.length >= 0.5;
}

export function scoreSignup(input: { email: string; name?: string }): SignupScore {
  const reasons: string[] = [];
  const email = normalizeEmail(input.email);
  const name = String(input.name ?? "").trim();

  if (isDotDenseGmail(email)) {
    reasons.push("email: dot-obfuscated gmail address");
  }
  if (isDisposableDomain(email)) {
    reasons.push("email: disposable domain");
  }
  if (name) {
    if (/https?:\/\/|www\.|<a\s|\[url/i.test(name)) {
      reasons.push("name: contains a link");
    }
    if (name.length > 80) {
      reasons.push("name: absurdly long");
    }
  }

  return { score: reasons.length, reasons };
}

/** Quarantine threshold — every remaining signal is high-precision on its own. */
export const QUARANTINE_SCORE = 1;

/* ── HTML escaping ─────────────────────────────────────────────────────────── */

/**
 * The notification email interpolates subscriber-supplied name/email into
 * HTML. Without escaping, a bot can inject markup (or a phishing link) into
 * the DAT inbox. Cheap to prevent; do it at every interpolation site.
 */
export function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
