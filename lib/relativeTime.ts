// lib/relativeTime.ts
//
// Tiny, dependency-free relative-time formatter for the Field Kit's "synced …"
// readouts (SyncStatus + the offline banner). Coarse buckets are intentional —
// the field document doesn't need second-precision freshness.

export function formatRelativeTime(from: number, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - from) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
