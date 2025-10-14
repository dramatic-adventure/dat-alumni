// --- useDraft.ts (or inline near top of update-form.tsx) ---
import { useCallback, useEffect, useRef, useState } from "react";

type DraftOpts<T> = {
  key: string;           // unique (e.g., `alumniId:section`)
  initial: T;
  debounceMs?: number;   // default 500
  enabled?: boolean;     // default true
};

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
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        setValue((prev) => ({ ...prev, ...parsed }));
        setRestored(true);
      }
    } catch {/* ignore */}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  // debounce persist
  useEffect(() => {
    if (!enabled) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {/* quota, ignore */}
    }, debounceMs);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [value, key, debounceMs, enabled]);

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(key); } catch {}
  }, [key]);

  return { value, setValue, restored, clearDraft };
}
