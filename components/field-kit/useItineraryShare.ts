// components/field-kit/useItineraryShare.ts
//
// Shared controller for the itinerary Print / Copy / Share actions, used by BOTH
// the itinerary-page toolbar and the account menu. Each action is gated by the
// privacy warning (ShareWarningModal): request() opens the modal, confirm() runs
// the action. The warning is acknowledged once PER SESSION (sessionStorage) so
// back-to-back actions don't nag, but it re-appears on the next app launch.
//
// The caller supplies getItinerary() — the page passes the itinerary it already
// has; the account menu fetches it (network-first, snapshot offline) — so this
// hook is agnostic to where the data comes from.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  printItinerary,
  copyItinerary,
  shareItinerary,
  canShareItinerary,
} from "@/lib/itineraryExport";
import type { ProgramItinerary } from "@/lib/programItinerary";

export type ShareAction = "print" | "copy" | "share";

const SESSION_KEY = "fk:itinerary-share-ack";

function isAcknowledged(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function setAcknowledged(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // sessionStorage unavailable (private mode / SSR) — warn every time instead.
  }
}

export function useItineraryShare(getItinerary: () => Promise<ProgramItinerary | null>) {
  const [pending, setPending] = useState<ShareAction | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // canShare is resolved on the client only, to avoid a hydration mismatch on the
  // Share button (navigator.share is absent server-side).
  const [canShare, setCanShare] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCanShare(canShareItinerary());
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);

  const flash = useCallback((msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2600);
  }, []);

  const run = useCallback(
    async (action: ShareAction) => {
      const it = await getItinerary();
      if (!it) {
        flash("No itinerary available offline yet.");
        return;
      }
      if (action === "print") {
        printItinerary(it);
      } else if (action === "copy") {
        flash((await copyItinerary(it)) ? "Itinerary copied" : "Couldn’t copy");
      } else if (action === "share") {
        const ok = await shareItinerary(it);
        if (!ok) flash("Sharing unavailable");
      }
    },
    [getItinerary, flash]
  );

  // Open the warning (or run immediately if already acknowledged this session).
  const request = useCallback(
    (action: ShareAction) => {
      if (isAcknowledged()) {
        void run(action);
        return;
      }
      setPending(action);
    },
    [run]
  );

  const confirm = useCallback(() => {
    const action = pending;
    setAcknowledged();
    setPending(null);
    if (action) void run(action);
  }, [pending, run]);

  const cancel = useCallback(() => setPending(null), []);

  return { pending, request, confirm, cancel, notice, canShare };
}
