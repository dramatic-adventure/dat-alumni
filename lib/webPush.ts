// lib/webPush.ts
//
// Slice 3 (Notifications) — the send side of the web-push backbone. Given a
// programId and a {title, body, link}, fan out to that program ROSTER's stored
// subscriptions (lib/fieldKitAccess#clusterRoster), and prune any that the push
// service reports dead (404/410). Pure server util — both the admin "send
// immediately" path and the scheduled dispatch route call this.
//
// VAPID is configured lazily (NEXT_PUBLIC_VAPID_PUBLIC_KEY from env;
// VAPID_PRIVATE_KEY + VAPID_SUBJECT from Netlify Blobs via
// lib/notificationSecrets, env as fallback) so importing this module never
// throws at load when keys are absent (e.g. a preview deploy without push
// configured).

import "server-only";
import webpush from "web-push";
import { clusterRoster } from "@/lib/fieldKitAccess";
import { normId } from "@/lib/sheetsResilience";
import {
  listSubscriptionsForProgram,
  deleteSubscriptionsByEndpoint,
} from "@/lib/pushSubscriptions";
import { getVapidPrivateKey, getVapidSubject } from "@/lib/notificationSecrets";

export type PushMessage = { title: string; body: string; link?: string };

export type SendResult = { sent: number; pruned: number; failed: number; total: number };

const DEFAULT_LINK = "/field-kit/itinerary";

let configured = false;

/** Configure web-push once. Returns false if VAPID keys are missing. */
async function ensureConfigured(): Promise<boolean> {
  if (configured) return true;
  const publicKey = String(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").trim();
  const privateKey = await getVapidPrivateKey();
  const subject = (await getVapidSubject()) || "mailto:hello@dramaticadventure.com";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export function isPushConfigured(): Promise<boolean> {
  return ensureConfigured();
}

/**
 * Send a push to every roster member of `programId` who has a stored
 * subscription. Scoped strictly to that program's roster, so one program can
 * never notify another's artists. Dead endpoints (404/410) are pruned.
 */
export async function sendToProgram(
  programId: string,
  message: PushMessage
): Promise<SendResult> {
  return sendToProgramFiltered(programId, message, null);
}

/**
 * Slice 5 — send a push to a SUBSET of a program's roster (e.g. the leader tier
 * for a "needs help" alert). `slugs` are normalized before matching; a slug not
 * on the roster never receives anything (subset can only narrow, never widen).
 */
export async function sendToSlugs(
  programId: string,
  slugs: Iterable<string>,
  message: PushMessage
): Promise<SendResult> {
  const want = new Set(Array.from(slugs, (s) => normId(s)).filter(Boolean));
  return sendToProgramFiltered(programId, message, want);
}

async function sendToProgramFiltered(
  programId: string,
  message: PushMessage,
  onlySlugs: Set<string> | null
): Promise<SendResult> {
  if (!(await ensureConfigured())) {
    throw new Error("Push not configured: missing NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY");
  }

  const roster = clusterRoster(programId);
  const subs = (await listSubscriptionsForProgram(programId)).filter(
    (s) =>
      roster.has(normId(s.alumniSlug)) &&
      (!onlySlugs || onlySlugs.has(normId(s.alumniSlug)))
  );

  const payload = JSON.stringify({
    title: message.title,
    body: message.body,
    link: message.link?.trim() || DEFAULT_LINK,
  });

  const dead: string[] = [];
  let sent = 0;
  let failed = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload);
        sent += 1;
      } catch (e: unknown) {
        const code = (e as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          dead.push(s.endpoint);
        } else {
          failed += 1;
          console.warn(`[webPush] send failed (${code ?? "?"}) for ${s.alumniSlug}`);
        }
      }
    })
  );

  if (dead.length) await deleteSubscriptionsByEndpoint(dead);

  return { sent, pruned: dead.length, failed, total: subs.length };
}
