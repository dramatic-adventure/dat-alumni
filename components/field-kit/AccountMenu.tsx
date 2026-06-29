// components/field-kit/AccountMenu.tsx
//
// Field Kit top-bar "more" menu. The global marketing header is suppressed on
// /field-kit (see components/ui/SiteChrome.tsx), so this is the only in-app way
// to reach your profile, sign out, or (eventually) install the app. Client
// component: needs the session + click interaction. SessionProvider is mounted
// app-wide in app/providers.tsx.

"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { T, FONT } from "@/components/field-kit/tokens";

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

export default function AccountMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

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
              onClick={() => void signOut({ callbackUrl: "/" })}
              style={{ ...menuItem, color: T.pink }}
            >
              Sign out
            </button>

            {/* Install — STUB. PLUG-AND-PLAY SEAM for the PWA task: wire this to
                the install prompt (Android/desktop) / show iOS "Add to Home
                Screen" instructions, and enable once the service worker exists. */}
            <div style={{ borderTop: `1px solid ${T.sep}` }}>
              <div
                aria-disabled
                title="Coming soon"
                style={{ ...menuItem, cursor: "default", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, opacity: 0.55 }}
              >
                <span>Install the Field&nbsp;Kit</span>
                <span style={{ fontSize: 8.5, letterSpacing: "0.12em", color: T.muted }}>Soon</span>
              </div>
              <p style={{ fontFamily: FONT.dm, fontSize: 11, lineHeight: 1.45, color: T.muted, margin: 0, padding: "0 14px 12px", textTransform: "none", letterSpacing: 0 }}>
                Add to your home screen for offline access — coming soon.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
