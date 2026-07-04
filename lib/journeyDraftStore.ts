// lib/journeyDraftStore.ts
//
// Slice 6 — client-only persistence + sync for JourneyDrafts (§4-R Q7).
//
//   • Local truth: every edit autosaves to IndexedDB (the shared "dat-field-kit"
//     DB, DRAFT_STORE) — instant and offline-safe, so "Saved on this device" is
//     always literally true.
//   • Server copy: a debounced, last-write-wins background push to
//     /api/field-kit/draft (private Netlify Blobs per author+program) so a lost
//     phone doesn't lose the draft and desktop can continue what a phone
//     started. Conflict policy: the artist is the only editor of their own
//     draft, so pure last-write-wins by updatedAt (mirrors the capture queue's
//     philosophy); on load we adopt whichever copy — local or server — is newer.
//
// SSR-safe: IndexedDB calls no-op without the browser API; network calls only
// happen from explicit client interactions/effects.

import { openDb, hasIDB, objectStore, reqToPromise, DRAFT_STORE } from "@/lib/fieldKitDb";
import { coerceJourneyDraft, type JourneyDraft } from "@/lib/journeyDraft";

const ENDPOINT = "/api/field-kit/draft";
const PUSH_DEBOUNCE_MS = 4_000;

type DraftRecord = {
  /** `${kind}:${programId}` — one draft per program per kind on this device. */
  key: string;
  draft: JourneyDraft;
  /** True when the local copy has edits the server hasn't seen. */
  dirty: boolean;
};

export function draftKey(kind: JourneyDraft["kind"], programId: string): string {
  return `${kind}:${programId.trim().toLowerCase()}`;
}

// ── IndexedDB primitives ──────────────────────────────────────────────────────

async function getRecord(key: string): Promise<DraftRecord | null> {
  if (!hasIDB()) return null;
  const db = await openDb();
  const rec = await reqToPromise(objectStore(db, DRAFT_STORE, "readonly").get(key));
  return (rec as DraftRecord | undefined) ?? null;
}

async function putRecord(rec: DraftRecord): Promise<void> {
  if (!hasIDB()) return;
  const db = await openDb();
  await reqToPromise(objectStore(db, DRAFT_STORE, "readwrite").put(rec));
}

// ── Save (the autosave target — call on every debounced edit) ────────────────

export async function saveDraftLocal(draft: JourneyDraft): Promise<void> {
  await putRecord({ key: draftKey(draft.kind, draft.programId), draft, dirty: true });
  schedulePush(draft.kind, draft.programId);
}

// ── Background push (debounced; also kicked by online/visibility) ────────────

const pushTimers = new Map<string, ReturnType<typeof setTimeout>>();
const pushing = new Set<string>();

export type DraftSyncState = "local-only" | "syncing" | "synced" | "offline";
type SyncListener = (key: string, state: DraftSyncState) => void;
const syncListeners = new Set<SyncListener>();

export function subscribeDraftSync(l: SyncListener): () => void {
  syncListeners.add(l);
  return () => {
    syncListeners.delete(l);
  };
}

function emit(key: string, state: DraftSyncState) {
  for (const l of syncListeners) l(key, state);
}

function schedulePush(kind: JourneyDraft["kind"], programId: string): void {
  if (typeof window === "undefined") return;
  const key = draftKey(kind, programId);
  const existing = pushTimers.get(key);
  if (existing) clearTimeout(existing);
  pushTimers.set(
    key,
    setTimeout(() => {
      pushTimers.delete(key);
      void pushDraft(key);
    }, PUSH_DEBOUNCE_MS)
  );
}

/** Push the local copy to the server now (blur / "sync now" / online events). */
export async function pushDraft(key: string, asId?: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (pushing.has(key)) return false;
  const rec = await getRecord(key);
  if (!rec || !rec.dirty) return true;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    emit(key, "offline");
    return false;
  }

  pushing.add(key);
  emit(key, "syncing");
  try {
    const res = await fetch(ENDPOINT, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft: rec.draft, ...(asId ? { asId } : {}) }),
    });
    if (!res.ok) {
      emit(key, "local-only");
      return false;
    }
    // Only clear dirty if no NEWER local edit landed while we were in flight.
    const latest = await getRecord(key);
    if (latest && latest.draft.updatedAt === rec.draft.updatedAt) {
      await putRecord({ ...latest, dirty: false });
    }
    emit(key, "synced");
    return true;
  } catch {
    emit(key, navigator.onLine === false ? "offline" : "local-only");
    return false;
  } finally {
    pushing.delete(key);
  }
}

// ── Load (device ↔ server merge: newer updatedAt wins) ───────────────────────

export async function loadDraft(
  kind: JourneyDraft["kind"],
  programId: string,
  asId?: string
): Promise<JourneyDraft | null> {
  const key = draftKey(kind, programId);
  const local = (await getRecord(key))?.draft ?? null;

  let remote: JourneyDraft | null = null;
  if (typeof navigator === "undefined" || navigator.onLine !== false) {
    try {
      const qs = new URLSearchParams({ kind, programId });
      if (asId) qs.set("asId", asId);
      const res = await fetch(`${ENDPOINT}?${qs}`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { draft?: unknown };
        remote = data.draft ? coerceJourneyDraft(data.draft) : null;
      }
    } catch {
      // Offline / flaky — the local copy is the truth for now.
    }
  }

  if (!local) {
    if (remote) await putRecord({ key, draft: remote, dirty: false });
    return remote;
  }
  if (!remote) return local;

  if (remote.updatedAt > local.updatedAt) {
    await putRecord({ key, draft: remote, dirty: false });
    return remote;
  }
  // Slice 7: equal updatedAt = same artist lineage (nothing unsynced here) — adopt
  // the server copy when the auto-assembler enriched it since we last looked.
  // The assembler never bumps updatedAt, so this is the only way its work shows up.
  if (
    remote.updatedAt === local.updatedAt &&
    (remote.assembledAt ?? "") > (local.assembledAt ?? "")
  ) {
    await putRecord({ key, draft: remote, dirty: false });
    return remote;
  }
  return local;
}

// ── Connectivity triggers (idempotent, mirrors captureSync.start) ────────────

let started = false;
export function startDraftSync(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  const pushAllDirty = async () => {
    if (!hasIDB()) return;
    const db = await openDb();
    const all = (await reqToPromise(
      objectStore(db, DRAFT_STORE, "readonly").getAll()
    )) as DraftRecord[];
    for (const rec of all ?? []) {
      if (rec.dirty) void pushDraft(rec.key);
    }
  };
  window.addEventListener("online", () => void pushAllDirty());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void pushAllDirty();
  });
  void pushAllDirty();
}
