// /lib/uploader.ts
// Lightweight XHR uploader with byte-level progress, cancel, pause/resume (restart), and retry/backoff.
// NOTE: "Pause" is implemented by aborting the current upload and marking the task paused.
//       "Resume" restarts that file from the beginning (true HTTP resume would require server-side support).

export type UploadKind = "headshot" | "album" | "reel" | "event";

export type TaskStatus =
  | "queued"
  | "uploading"
  | "paused"
  | "completed"
  | "failed"
  | "canceled";

export type UploadResponse = any;

export type UploadTask = {
  id: string;
  kind: UploadKind;
  file: File;
  status: TaskStatus;
  loaded: number;
  total: number;
  retries: number;
  xhr?: XMLHttpRequest | null;
};

export type BucketProgress = { uploaded: number; total: number; pct: number };

export type UploaderCallbacks = {
  onFileStart?: (task: UploadTask) => void;
  onFileProgress?: (task: UploadTask) => void; // task.loaded/task.total are current file bytes
  onFileComplete?: (task: UploadTask, response: UploadResponse) => void;
  onFileError?: (task: UploadTask, error: Error) => void;

  // Aggregated per-kind progress (sums bytes across all tasks of that kind in this uploader instance)
  onKindProgress?: (kind: UploadKind, progress: BucketProgress) => void;

  onQueueEmpty?: () => void;
};

export type UploaderOptions = {
  endpoint?: string;              // default "/api/upload"
  maxRetries?: number;            // default 2
  backoffBaseMs?: number;         // default 600
  concurrent?: number;            // default 1 (keeps order and pointer logic simple)
  callbacks?: UploaderCallbacks;
};

export type EnqueueOptions = {
  kind: UploadKind;
  files: File[];
  formFields: Record<string, string>; // e.g. { alumniId, kind (will be set), name (we set from file), ... }
};

export type Uploader = {
  enqueue: (opts: EnqueueOptions) => void;
  start: () => void;

  pauseKind: (kind: UploadKind) => void;
  resumeKind: (kind: UploadKind, formFields?: Record<string, string>) => void;

  cancelKind: (kind: UploadKind) => void;
  cancelAll: () => void;

  // read-only views
  getTasks: () => UploadTask[];
  getKindProgress: (kind: UploadKind) => BucketProgress;
  getTaskById: (id: string) => UploadTask | undefined;
};

export function createUploader(opts: UploaderOptions = {}): Uploader {
  const endpoint = opts.endpoint ?? "/api/upload";
  const maxRetries = Math.max(0, opts.maxRetries ?? 2);
  const backoffBaseMs = Math.max(100, opts.backoffBaseMs ?? 600);
  const concurrent = Math.max(1, Math.min(4, opts.concurrent ?? 1));
  const cb = opts.callbacks ?? {};

  // internal queues/state
  const tasks: UploadTask[] = [];
  const pausedKinds = new Set<UploadKind>();
  const canceledKinds = new Set<UploadKind>();
  let activeCount = 0;
  let started = false;

  // aggregated progress by kind
  const agg: Record<UploadKind, BucketProgress> = {
    headshot: { uploaded: 0, total: 0, pct: 0 },
    album:    { uploaded: 0, total: 0, pct: 0 },
    reel:     { uploaded: 0, total: 0, pct: 0 },
    event:    { uploaded: 0, total: 0, pct: 0 },
  };

  function updateAgg(kind: UploadKind) {
    const kindTasks = tasks.filter(t => t.kind === kind);
    const uploaded = kindTasks.reduce((s, t) => s + t.loaded, 0);
    const total    = kindTasks.reduce((s, t) => s + (t.total || t.file.size || 0), 0);
    const pct = total > 0 ? Math.min(100, Math.round((uploaded / total) * 100)) : 0;
    agg[kind] = { uploaded, total, pct };
    cb.onKindProgress?.(kind, agg[kind]);
  }

  function setTaskStatus(task: UploadTask, status: TaskStatus) {
    task.status = status;
  }

  function shouldStopForKind(kind: UploadKind) {
    return pausedKinds.has(kind) || canceledKinds.has(kind);
  }

  function canDispatchNext(): boolean {
    if (!started) return false;
    if (activeCount >= concurrent) return false;
    // find a queued task whose kind is not paused/canceled
    return tasks.some(t => t.status === "queued" && !shouldStopForKind(t.kind));
  }

  function dispatchLoop() {
    while (canDispatchNext()) {
      const nextTask = tasks.find(t => t.status === "queued" && !shouldStopForKind(t.kind));
      if (!nextTask) break;
      void uploadWithRetry(nextTask);
    }

    // if nothing active and nothing dispatchable, signal empty
    if (activeCount === 0 && !tasks.some(t => t.status === "queued" && !shouldStopForKind(t.kind))) {
      cb.onQueueEmpty?.();
    }
  }

  function uploadWithRetry(task: UploadTask): Promise<void> {
    activeCount++;
    setTaskStatus(task, "uploading");
    cb.onFileStart?.(task);

    return new Promise<void>((resolve) => {
      const attempt = (retryIndex: number) => {
        if (shouldStopForKind(task.kind)) {
          activeCount--;
          // Keep task as paused/canceled status; don't mark failed
          resolve();
          dispatchLoop();
          return;
        }
        uploadOnce(task).then((response) => {
          setTaskStatus(task, "completed");
          task.loaded = task.total = task.file.size;
          updateAgg(task.kind);
          cb.onFileComplete?.(task, response);
          activeCount--;
          resolve();
          dispatchLoop();
        }).catch((err: Error & { status?: number }) => {
          // if the task was canceled or paused during uploadOnce, don't retry here
          if (task.status === "paused" || task.status === "canceled") {
            activeCount--;
            resolve();
            dispatchLoop();
            return;
          }

          const retriable = isRetriable(err);
          if (retriable && retryIndex < maxRetries && !shouldStopForKind(task.kind)) {
            task.retries = retryIndex + 1;
            const delay = Math.round(backoffBaseMs * Math.pow(2, retryIndex));
            setTimeout(() => attempt(retryIndex + 1), delay);
          } else {
            setTaskStatus(task, "failed");
            cb.onFileError?.(task, err);
            activeCount--;
            resolve();
            dispatchLoop();
          }
        });
      };

      attempt(0);
    });
  }

  function isRetriable(err: any): boolean {
    // network or 5xx/429 are retriable; 4xx usually not
    const status = err?.status;
    if (status == null) return true; // network
    if (status >= 500) return true;
    if (status === 429) return true;
    return false;
  }

  function uploadOnce(task: UploadTask): Promise<any> {
    return new Promise((resolve, reject) => {
      if (canceledKinds.has(task.kind)) {
        setTaskStatus(task, "canceled");
        return reject(Object.assign(new Error("Upload canceled"), { status: 0 }));
      }
      if (pausedKinds.has(task.kind)) {
        setTaskStatus(task, "paused");
        return reject(Object.assign(new Error("Upload paused"), { status: 0 }));
      }

      const fd = new FormData();
      fd.set("file", task.file);
      // Important: We pass kind/name here; alumniId is set by the enqueuer in formFields.
      // We'll stash the last provided formFields per kind for resume() convenience.
      const meta = lastFormFieldsByKind.get(task.kind) ?? {};
      fd.set("alumniId", meta["alumniId"] || "");
      fd.set("kind", task.kind);
      fd.set("name", task.file.name);

      for (const [k, v] of Object.entries(meta)) {
        if (k !== "alumniId") fd.set(k, v);
      }

      const xhr = new XMLHttpRequest();
      task.xhr = xhr;
      task.loaded = 0;
      task.total = task.file.size;

      xhr.open("POST", endpoint);
      xhr.responseType = "json";

      xhr.upload.onprogress = (ev) => {
        if (!ev.lengthComputable) return;
        // Single-file progress
        task.loaded = ev.loaded;
        task.total = ev.total || task.file.size;
        cb.onFileProgress?.(task);
        updateAgg(task.kind);
      };

      xhr.onload = () => {
        const status = xhr.status;
        const json = xhr.response;
        task.xhr = null;
        if (status >= 200 && status < 300) {
          // ensure final progress snaps to 100%
          task.loaded = task.total = task.file.size;
          updateAgg(task.kind);
          resolve(json);
        } else {
          const err = Object.assign(new Error(json?.error || "Upload failed"), { status });
          reject(err);
        }
      };

      xhr.onerror = () => {
        task.xhr = null;
        reject(Object.assign(new Error("Network error during upload"), { status: 0 }));
      };

      xhr.onabort = () => {
        // onabort can be caused by pause/cancel
        task.xhr = null;
        const status: TaskStatus = canceledKinds.has(task.kind) ? "canceled" : pausedKinds.has(task.kind) ? "paused" : "failed";
        setTaskStatus(task, status);
        // Reject so retry logic or caller can decide next steps
        reject(Object.assign(new Error("Upload aborted"), { status: 0 }));
      };

      xhr.send(fd);
    });
  }

  // Store last seen formFields per kind (helps resume after a pause)
  const lastFormFieldsByKind = new Map<UploadKind, Record<string, string>>();

  function enqueue({ kind, files, formFields }: EnqueueOptions) {
    lastFormFieldsByKind.set(kind, { ...(formFields || {}) });
    for (const f of files) {
      const t: UploadTask = {
        id: `${kind}:${cryptoRandomId()}:${f.name}:${f.size}`,
        kind,
        file: f,
        status: "queued",
        loaded: 0,
        total: f.size,
        retries: 0,
        xhr: null,
      };
      tasks.push(t);
      // grow total for the bucket
      updateAgg(kind);
    }
    if (started) dispatchLoop();
  }

  function start() {
    started = true;
    dispatchLoop();
  }

  function pauseKind(kind: UploadKind) {
    pausedKinds.add(kind);
    // Abort any inflight tasks of this kind to "pause" them
    tasks
      .filter(t => t.kind === kind && t.status === "uploading" && t.xhr)
      .forEach(t => {
        try { t.xhr?.abort(); } catch {}
        setTaskStatus(t, "paused");
      });
  }

  function resumeKind(kind: UploadKind, formFields?: Record<string, string>) {
    if (formFields) lastFormFieldsByKind.set(kind, { ...(formFields || {}) });
    pausedKinds.delete(kind);
    // any previously paused tasks remain in status "paused" but we’ll flip them to "queued"
    tasks
      .filter(t => t.kind === kind && t.status === "paused")
      .forEach(t => setTaskStatus(t, "queued"));
    if (started) dispatchLoop();
  }

  function cancelKind(kind: UploadKind) {
    canceledKinds.add(kind);
    // abort inflight
    tasks
      .filter(t => t.kind === kind && t.status === "uploading" && t.xhr)
      .forEach(t => {
        try { t.xhr?.abort(); } catch {}
        setTaskStatus(t, "canceled");
      });
    // mark queued/paused as canceled so they won't dispatch
    tasks
      .filter(t => t.kind === kind && (t.status === "queued" || t.status === "paused"))
      .forEach(t => setTaskStatus(t, "canceled"));
    updateAgg(kind);
  }

  function cancelAll() {
    (["headshot","album","reel","event"] as UploadKind[]).forEach(k => cancelKind(k));
  }

  function getTasks(): UploadTask[] {
    return tasks.slice();
  }

  function getKindProgress(kind: UploadKind): BucketProgress {
    return { ...agg[kind] };
  }

function getTaskById(id: string): UploadTask | undefined {
  return tasks.find(t => t.id === id);
}

  return {
    enqueue,
    start,
    pauseKind,
    resumeKind,
    cancelKind,
    cancelAll,
    getTasks,
    getTaskById,
    getKindProgress,
  };
}

/** Small id helper (no external libs) */
function cryptoRandomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // @ts-ignore
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
