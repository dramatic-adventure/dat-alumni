"use client";

import { signIn } from "next-auth/react";

export default function LoginButton({ callbackUrl }: { callbackUrl: string }) {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl })}
      className="inline-block whitespace-nowrap rounded-xl bg-[#6c00af] px-8 py-3 font-semibold uppercase tracking-[0.35rem] text-[#f2f2f2] transition-[transform,filter,box-shadow] duration-150 hover:-translate-y-[1px] hover:brightness-[1.07] hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif" }}
    >
      Sign In with Google
    </button>
  );
}
