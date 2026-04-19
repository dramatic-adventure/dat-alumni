// app/login/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LoginButton from "./LoginButton";

export const revalidate = 0;

/** Only allow same-origin relative callback paths. Block protocol-relative URLs. */
function safeCallback(raw: string | undefined): string {
  const v = String(raw || "").trim();
  if (!v) return "/alumni/update";
  if (!v.startsWith("/")) return "/alumni/update";
  if (v.startsWith("//")) return "/alumni/update";
  return v;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const rawCb = Array.isArray(sp?.callbackUrl)
    ? sp?.callbackUrl[0]
    : sp?.callbackUrl;
  const callbackUrl = safeCallback(rawCb);

  const session = await auth();
  if (session) redirect(callbackUrl);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1
        className="mb-4 text-3xl font-bold"
        style={{
          fontFamily: "var(--font-anton), system-ui, sans-serif",
          textTransform: "uppercase",
        }}
      >
        Sign In
      </h1>
      <p
        className="mb-8"
        style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
        }}
      >
        Sign in with Google to manage your alumni profile.
      </p>

      <LoginButton callbackUrl={callbackUrl} />

      <p
        className="mt-10 text-sm opacity-75"
        style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
        }}
      >
        Need help? Contact DAT for an invite link.
      </p>
    </main>
  );
}
