"use client";

import { signOut } from "next-auth/react";

export default function InviteConfirmControls({ token }: { token: string }) {
  const invitePath = `/alumni/update?invite=${encodeURIComponent(token)}`;
  const confirmPath = `${invitePath}&confirm=1`;

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <a
        href={confirmPath}
        className="inline-block whitespace-nowrap rounded-xl bg-[#6c00af] px-8 py-3 font-semibold uppercase tracking-[0.35rem] text-[#f2f2f2] transition-[transform,filter,box-shadow] duration-150 hover:-translate-y-[1px] hover:brightness-[1.07] hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif" }}
      >
        Claim as this account
      </a>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: invitePath })}
        className="inline-block whitespace-nowrap rounded-xl border border-white/30 bg-transparent px-8 py-3 font-semibold uppercase tracking-[0.35rem] text-current transition-[transform,filter,box-shadow] duration-150 hover:-translate-y-[1px] hover:brightness-[1.07] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif" }}
      >
        Use a different Google account
      </button>
    </div>
  );
}
