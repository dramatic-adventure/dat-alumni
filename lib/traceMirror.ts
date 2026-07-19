// lib/traceMirror.ts
//
// Client-only IndexedDB mirror of the signed-in member's OWN traces — the last
// list the device saw from the server, kept current with optimistic local
// mutations. It exists so "My Traces" always shows the most current data the
// device HAS, in every connectivity state:
//   • offline: the service worker serves the last cached page HTML, whose
//     embedded server rows may predate recent syncs — the mirror is newer.
//   • queued mutations: an edit/delete made offline overlays the mirror
//     immediately, so the change is visible on every subsequent open even
//     before it reaches the server.
//
// Records carry an `owner` scope ("self" or the impersonated asId) so an
// admin previewing as an artist never mixes lists. Sign-out wipes the store
// (shared-device hygiene, same contract as the ops state).

import { openDb, hasIDB, objectStore, reqToPromise, TRACE_MIRROR_STORE } from "@/lib/fieldKitDb";
import type { FieldCapture } from "@/lib/loadFieldKitCaptures";

export type MirroredTrace = FieldCapture & {
  /** "self" for the signed-in member, or the asId being impersonated. */
  owner: string;
  /** ISO — when this record was last written locally. */
  mirroredAt: string;
};

export function ownerKey(asId?: string): string {
  return (asId ?? "").trim() || "self";
}

/** Replace the owner's mirrored list with `captures` (the freshest known view). */
export async function putMirror(owner: string, captures: FieldCapture[]): Promise<void> {
  if (!hasIDB()) return;
  const db = await openDb();
  const existing = ((await reqToPromise(
    objectStore(db, TRACE_MIRROR_STORE, "readonly").getAll()
  )) ?? []) as MirroredTrace[];

  const now = new Date().toISOString();
  const store = objectStore(db, TRACE_MIRROR_STORE, "readwrite");
  const ops: Promise<unknown>[] = [];
  // Drop the owner's rows that are no longer present (deleted server-side or locally).
  const keep = new Set(captures.map((c) => c.captureId));
  for (const rec of existing) {
    if (rec.owner === owner && !keep.has(rec.captureId)) {
      ops.push(reqToPromise(store.delete(rec.captureId)));
    }
  }
  for (const c of captures) {
    ops.push(reqToPromise(store.put({ ...c, owner, mirroredAt: now } satisfies MirroredTrace)));
  }
  await Promise.all(ops);
}

/** The owner's mirrored traces, newest first (same order Traces renders). */
export async function getMirror(owner: string): Promise<FieldCapture[]> {
  if (!hasIDB()) return [];
  const db = await openDb();
  const all = ((await reqToPromise(
    objectStore(db, TRACE_MIRROR_STORE, "readonly").getAll()
  )) ?? []) as MirroredTrace[];
  return all
    .filter((r) => r.owner === owner)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .map(({ owner: _o, mirroredAt: _m, ...capture }) => capture);
}

/** Wipe the mirror. Used on sign-out (AccountMenu) — shared-device hygiene. */
export async function clearTraceMirror(): Promise<void> {
  if (!hasIDB()) return;
  const db = await openDb();
  await reqToPromise(objectStore(db, TRACE_MIRROR_STORE, "readwrite").clear());
}
