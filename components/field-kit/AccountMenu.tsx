// components/field-kit/AccountMenu.tsx
//
// Field Kit top-bar "more" menu. The global marketing header is suppressed on
// /field-kit (see components/ui/SiteChrome.tsx), so this is the only in-app way
// to reach your profile, sign out, or (eventually) install the app. Client
// component: needs the session + click interaction. SessionProvider is mounted
// app-wide in app/providers.tsx.

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MoreVertical, Printer, Copy, Share2, Shield } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { T, FONT } from "@/components/field-kit/tokens";
import { fetchItinerary } from "@/lib/fetchItinerary";
import { useItineraryShare } from "@/components/field-kit/useItineraryShare";
import ShareWarningModal from "@/components/field-kit/ShareWarningModal";
import SignOutWarningModal from "@/components/field-kit/SignOutWarningModal";
import TripAlerts from "@/components/field-kit/TripAlerts";
import { getAll as getQueuedCaptures } from "@/lib/captureQueue";
import { getAll as getQueuedOps, clearAllOps } from "@/lib/opsQueue";
import { getAll as getQueuedTraceMutations, clearAllTraceMutations } from "@/lib/traceMutationQueue";
import { clearTraceMirror } from "@/lib/traceMirror";
import { clearAllSnapshots } from "@/lib/itinerarySnapshot";
import { clearFieldKitCaches } from "@/lib/fieldKitCache";

// Chrome/Android fires this before showing its native install prompt; we capture
// it so the install can be triggered from our own menu item instead.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function initialsOf(nameOrEmail: string): string {
  const s = String(nameOrEmail || "").trim();
  if (!s) return "·";
  if (s.includes("@")) return s[0]!.toUpperCase();
  const parts = s.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || s[0]!.toUpperCase();
}

const menuItem: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "11px 14px",
  fontFamily: FONT.grotesk,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: T.ink,
  textDecoration: "none",
  background: "transparent",
  border: "none",
  cursor: "pointer",
};

const iconItem: React.CSSProperties = {
  ...menuItem,
  display: "flex",
  alignItems: "center",
  gap: 9,
};

export default function AccountMenu({
  programId,
  isAdmin = false,
}: {
  programId: string;
  isAdmin?: boolean;
}) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  // Itinerary Print / Copy / Share — same warning-gated actions as the itinerary
  // page, but the menu must FETCH the itinerary on demand (network-first, snapshot
  // when offline) since the layout doesn't carry it.
  const getItinerary = useCallback(
    async () => (await fetchItinerary(programId)).itinerary,
    [programId]
  );
  const share = useItineraryShare(getItinerary);

  const requestShare = (action: Parameters<typeof share.request>[0]) => {
    setOpen(false);
    share.request(action);
  };

  // Sign-out on-device clearing (warn-then-preserve). Always safe to wipe: the
  // cached gated pages (Cache Storage) and the itinerary snapshot (IndexedDB) —
  // losing either just means a slower next load, nothing is lost. The capture
  // queue is different: an item still queued here is unsynced work, so it's
  // NEVER cleared by sign-out. If any remain, warn and let the artist choose
  // rather than risk it silently syncing under the next signed-in user.
  const [signOutWarningCount, setSignOutWarningCount] = useState<number | null>(null);

  async function clearOnDeviceCaches() {
    // clearAllOps wipes the ops queue + this device's own answers (Slice 5),
    // clearAllTraceMutations + clearTraceMirror wipe queued edits/deletes and
    // the on-device traces copy — per-user data on a shared device. Reached
    // only when the queues are empty or the artist chose "sign out anyway".
    await Promise.all([
      clearFieldKitCaches(),
      clearAllSnapshots(),
      clearAllOps(),
      clearAllTraceMutations(),
      clearTraceMirror(),
    ]);
  }

  async function handleSignOutClick() {
    setOpen(false);
    // Unsynced work = queued captures + queued check-ins/votes + queued trace
    // edits/deletes. Any of these would sync under the NEXT signed-in user, so
    // they all gate the warning.
    const [queuedCaptures, queuedOps, queuedTraceMutations] = await Promise.all([
      getQueuedCaptures(),
      getQueuedOps(),
      getQueuedTraceMutations(),
    ]);
    const queued = queuedCaptures.length + queuedOps.length + queuedTraceMutations.length;
    if (queued > 0) {
      setSignOutWarningCount(queued);
      return;
    }
    await clearOnDeviceCaches();
    void signOut({ callbackUrl: "/" });
  }

  async function confirmSignOutAnyway() {
    setSignOutWarningCount(null);
    await clearOnDeviceCaches();
    void signOut({ callbackUrl: "/" });
  }

  // PWA install state. `deferredPrompt` is the stashed beforeinstallprompt event
  // (Android/desktop Chrome). `isIOS` triggers the manual Share-sheet hint where
  // that event never fires. `standalone` hides the affordance once installed.
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const inStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setStandalone(Boolean(inStandalone));

    const ua = window.navigator.userAgent || "";
    // iOS Safari (incl. iPadOS reporting as Mac with touch) never fires
    // beforeinstallprompt, so detect it to show the manual instruction instead.
    const iOS = /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
    setIsIOS(iOS);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferredPrompt(null);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setOpen(false);
  }

  const user = session?.user;
  const name = user?.name || "";
  const email = user?.email || "";
  const image = user?.image || "";
  const label = name || email || "Account";

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 30,
          height: 30,
          borderRadius: 8,
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: "rgba(246,239,227,0.72)",
        }}
      >
        <MoreVertical size={20} aria-hidden />
      </button>

      {open && (
        <>
          {/* click-away catcher */}
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 50, background: "transparent", border: "none", cursor: "default" }}
          />
          <div
            role="menu"
            style={{
              position: "absolute",
              top: "calc(100% + 10px)",
              right: 0,
              zIndex: 51,
              minWidth: 220,
              backgroundColor: T.paper,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              boxShadow: "0 14px 34px rgba(0,0,0,0.45)",
              overflow: "hidden",
            }}
          >
            {/* account header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: `1px solid ${T.sep}` }}>
              <span
                aria-hidden
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  flexShrink: 0,
                  border: `1.5px solid ${T.yellow}`,
                  backgroundColor: T.card,
                  backgroundImage: image ? `url(${image})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONT.grotesk,
                  fontSize: 11,
                  fontWeight: 700,
                  color: T.ink,
                }}
              >
                {!image && initialsOf(label)}
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: FONT.dm, fontSize: 13, fontWeight: 700, color: T.ink }}>
                  {name || "Signed in"}
                </span>
                {email && (
                  <span style={{ display: "block", fontFamily: FONT.dm, fontSize: 11.5, color: T.muted, wordBreak: "break-all" }}>
                    {email}
                  </span>
                )}
              </span>
            </div>

            {/* account actions */}
            <Link href="/alumni/update" role="menuitem" onClick={() => setOpen(false)} style={menuItem}>
              Your profile
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => void handleSignOutClick()}
              style={{ ...menuItem, color: T.pink }}
            >
              Sign out
            </button>

            {/* Staff console — convenience link, shown only to admins. The
                /field-kit/admin page enforces admin access server-side; this
                link is not the security boundary. */}
            {isAdmin && (
              <Link href="/field-kit/admin" role="menuitem" onClick={() => setOpen(false)} style={iconItem}>
                <Shield size={15} aria-hidden /> Staff console
              </Link>
            )}

            {/* Itinerary export — warning-gated Print / Copy / Share. */}
            <div style={{ borderTop: `1px solid ${T.sep}` }}>
              <button type="button" role="menuitem" onClick={() => requestShare("print")} style={iconItem}>
                <Printer size={15} aria-hidden /> Print / Save itinerary
              </button>
              <button type="button" role="menuitem" onClick={() => requestShare("copy")} style={iconItem}>
                <Copy size={15} aria-hidden /> Copy itinerary
              </button>
              {share.canShare && (
                <button type="button" role="menuitem" onClick={() => requestShare("share")} style={iconItem}>
                  <Share2 size={15} aria-hidden /> Share itinerary
                </button>
              )}
            </div>

            {/* Trip alerts (web push) opt-in. Self-gates on push support +
                iOS-standalone; renders nothing where push isn't available. */}
            <TripAlerts programId={programId} />

            {/* Install — shown only when installable and not already running as
                the installed app. Android/desktop get a one-tap prompt; iOS gets
                the manual Share → Add to Home Screen instruction. */}
            {!standalone && (deferredPrompt || isIOS) && (
              <div style={{ borderTop: `1px solid ${T.sep}` }}>
                {deferredPrompt ? (
                  <>
                    <button type="button" role="menuitem" onClick={handleInstall} style={menuItem}>
                      Install the Field&nbsp;Kit
                    </button>
                    <p style={{ fontFamily: FONT.dm, fontSize: 11, lineHeight: 1.45, color: T.muted, margin: 0, padding: "0 14px 12px", textTransform: "none", letterSpacing: 0 }}>
                      Add to your home screen for quick access in the field.
                    </p>
                  </>
                ) : (
                  <>
                    <div style={{ ...menuItem, cursor: "default" }}>Install the Field&nbsp;Kit</div>
                    <p style={{ fontFamily: FONT.dm, fontSize: 11, lineHeight: 1.45, color: T.muted, margin: 0, padding: "0 14px 12px", textTransform: "none", letterSpacing: 0 }}>
                      Tap Share, then Add to Home Screen.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Warning + feedback live OUTSIDE the dropdown so they persist after the
          menu closes (the menu closes the moment an action is requested). */}
      <ShareWarningModal
        open={share.pending != null}
        action={share.pending}
        onCancel={share.cancel}
        onConfirm={share.confirm}
      />
      <SignOutWarningModal
        open={signOutWarningCount != null}
        count={signOutWarningCount ?? 0}
        onCancel={() => setSignOutWarningCount(null)}
        onConfirm={() => void confirmSignOutAnyway()}
      />
      {share.notice && (
        <div role="status" style={NOTICE_TOAST}>
          {share.notice}
        </div>
      )}
    </div>
  );
}

const NOTICE_TOAST: React.CSSProperties = {
  position: "fixed",
  top: "calc(env(safe-area-inset-top) + 56px)",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 60,
  fontFamily: FONT.grotesk,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: T.ink,
  backgroundColor: "rgba(14,10,19,0.92)",
  border: `1px solid ${T.border}`,
  borderRadius: 999,
  padding: "8px 14px",
  boxShadow: "0 8px 24px rgba(14,10,19,0.45)",
  pointerEvents: "none",
};
