// useDraft.ts
import { useCallback, useEffect, useRef, useState } from "react";

type DraftOpts<T> = {
  key: string; // unique (e.g., `alumniId:section`)
  initial: T;
  debounceMs?: number; // default 500
  enabled?: boolean; // default true
};

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export function useDraft<T extends object>({
  key,
  initial,
  debounceMs = 500,
  enabled = true,
}: DraftOpts<T>) {
  const [value, setValue] = useState<T>(initial);
  const [restored, setRestored] = useState(false);
  const timer = useRef<number | null>(null);

  // restore once
  useEffect(() => {
    if (!enabled) return;

    const raw = (() => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    })();

    const parsed = safeParse<Partial<T>>(raw);

    if (parsed) {
      setValue((prev) => ({ ...prev, ...parsed }));
      setRestored(true);
      return;
    }

    // If there *was* something stored but it was invalid/empty, clear it
    // so we don't keep re-triggering parse errors elsewhere.
    if (raw != null && raw.trim() !== "") {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
    // If raw is empty string / whitespace, also clear to be safe.
    if (raw != null && raw.trim() === "") {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  // debounce persist
  useEffect(() => {
    if (!enabled) return;
    if (timer.current) window.clearTimeout(timer.current);

    timer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* quota, ignore */
      }
    }, debounceMs);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [value, key, debounceMs, enabled]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {}
  }, [key]);

  return { value, setValue, restored, clearDraft };
}
