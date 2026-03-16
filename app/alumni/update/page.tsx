// app/alumni/update/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UpdateForm from "./update-form";
import { cookies, headers } from "next/headers";
import { redeemInviteToken } from "@/lib/invites";

export const revalidate = 0;

function isAdminEmail(email?: string | null) {
  const raw = process.env.ADMIN_EMAILS || "";
  const set = new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
  return !!(email && set.has(String(email).toLowerCase()));
}

function normId(v: unknown) {
  return String(v || "").trim();
}

function looksLikeAlumniId(v: string) {
  const s = (v || "").trim();
  if (!s) return false;

  if (/^(ALU|ALUM|ALUMNI)[-_]/i.test(s)) return true;
  if (/^[0-9]+$/.test(s)) return true;
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
  )
    return true;

  return false;
}

// Resolve slug -> alumniId using:
// 1) /api/alumni/lookup (Profile-Live; admin-gated)
// 2) fallback /api/profiles/resolve (Profile-Data CSV; public-ish)
async function resolveSlugToAlumniId(slugOrId: string) {
  const s = normId(slugOrId);
  if (!s) return "";

  // ✅ Next.js 15+: headers()/cookies() are async
  const h = await headers();
  const proto = h.get("x-forwarded-proto") || "http";
  const host =
    h.get("x-forwarded-host") ||
    h.get("host") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "") ||
    "localhost:3000";

  const base = `${proto}://${host}`;

  // ✅ Forward cookies so admin-gated routes see the session
  const cookieHeader = (await cookies()).toString();
  const reqHeaders = cookieHeader ? { cookie: cookieHeader } : undefined;

  // 1) Try admin-gated Live lookup first
  try {
    const url1 =
      `${base}/api/alumni/lookup` +
      `?alumniId=${encodeURIComponent(s)}` +
      `&slug=${encodeURIComponent(s)}` +
      `&nocache=1`;

    const res1 = await fetch(url1, { cache: "no-store", headers: reqHeaders });
    if (res1.ok) {
      const json1 = (await res1.json().catch(() => null)) as any;
      const id1 = normId(json1?.alumniId);
      if (id1) return id1;
    }
  } catch {
    // ignore and fall through
  }

  // 2) Fallback: resolve from Profile-Data CSV
  try {
    const url2 = `${base}/api/profiles/resolve?slug=${encodeURIComponent(s)}`;
    const res2 = await fetch(url2, { cache: "no-store", headers: reqHeaders });
    if (!res2.ok) return "";
    const json2 = (await res2.json().catch(() => null)) as any;
    return normId(json2?.alumniId);
  } catch {
    return "";
  }
}

export default async function UpdatePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const sp = searchParams ? await searchParams : undefined;

  // ── Invite token handling ──────────────────────────────────────
  const inviteRaw = sp?.invite;
  const inviteToken = normId(Array.isArray(inviteRaw) ? inviteRaw[0] : inviteRaw);

  // If there's an invite token but no session, send them to sign-in
  // preserving the invite token in the callback URL
  if (inviteToken && !session) {
    const callback = encodeURIComponent(`/alumni/update?invite=${inviteToken}`);
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1
          className="mb-4 text-3xl font-bold"
          style={{
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            textTransform: "uppercase",
          }}
        >
          You&apos;ve been invited!
        </h1>
        <p
          className="mb-6"
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          }}
        >
          Sign in with Google to claim your alumni profile.
        </p>
        <a
          href={`/api/auth/signin?callbackUrl=${callback}`}
          className="inline-block whitespace-nowrap rounded-xl bg-[#6c00af] px-8 py-3 font-semibold uppercase tracking-[0.35rem] text-[#f2f2f2] transition-[transform,filter,box-shadow] duration-150 hover:-translate-y-[1px] hover:brightness-[1.07] hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif" }}
        >
          Sign In with Google
        </a>
      </div>
    );
  }

  // If signed in with an invite token, attempt redemption
  if (inviteToken && session?.user?.email) {
    const result = await redeemInviteToken(inviteToken, session.user.email);

    if (!result.ok) {
      const messages: Record<string, string> = {
        expired: "This invite link has expired. Please ask for a new one.",
        already_used: "This invite link has already been used.",
        already_owned: "This profile is already linked to an account.",
        invalid: "This invite link is invalid.",
      };
      return (
        <div className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h1
            className="mb-4 text-3xl font-bold"
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              textTransform: "uppercase",
            }}
          >
            Invite Link Issue
          </h1>
          <p
            className="mb-8"
            style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif" }}
          >
            {messages[result.reason] ?? "Something went wrong with this invite link."}
          </p>
          <a
            href="/alumni/update"
            className="inline-block whitespace-nowrap rounded-xl bg-[#6c00af] px-8 py-3 font-semibold uppercase tracking-[0.35rem] text-[#f2f2f2] transition-[transform,filter,box-shadow] duration-150 hover:-translate-y-[1px] hover:brightness-[1.07] hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif" }}
          >
            Go to Profile Studio
          </a>
        </div>
      );
    }

    // ✅ Redemption succeeded — redirect to clean URL so the token
    // isn't re-processed on refresh and the profile loads normally
    redirect("/alumni/update");
  }

  // ── Standard (non-invite) flow ─────────────────────────────────
  if (!session) {
    const callback = encodeURIComponent("/alumni/update");
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1
          className="mb-4 text-3xl font-bold"
          style={{
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            textTransform: "uppercase",
          }}
        >
          Update Your Alumni Profile
        </h1>
        <p
          className="mb-6"
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          }}
        >
          Please sign in with Google to continue.
        </p>

        <a
          href={`/api/auth/signin?callbackUrl=${callback}`}
          className="inline-block whitespace-nowrap rounded-xl bg-[#6c00af] px-8 py-3 font-semibold uppercase tracking-[0.35rem] text-[#f2f2f2] transition-[transform,filter,box-shadow] duration-150 hover:-translate-y-[1px] hover:brightness-[1.07] hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif" }}
        >
          Sign In
        </a>
      </div>
    );
  }

  const email = (session.user?.email || "").toLowerCase();
  const isAdmin = isAdminEmail(email);

  // ✅ allow impersonation for admin only (keep it strict)
  const raw =
    sp?.asId ??
    sp?.alumniId ??
    sp?.asSlug ??
    sp?.slug;

  const asIdRaw = Array.isArray(raw) ? raw[0] : raw;
  const asId = normId(asIdRaw);

  let impersonateAlumniId = "";
  let impersonateSlug = "";

  if (isAdmin && asId) {
    if (looksLikeAlumniId(asId)) {
      impersonateAlumniId = asId;
    } else {
      impersonateSlug = asId;
      impersonateAlumniId = await resolveSlugToAlumniId(impersonateSlug);
    }
  }

  return (
    <main className="w-full px-4 sm:px-6 lg:px-10 py-6">
      <div className="mx-auto w-full max-w-6xl">
        {isAdmin && (
          <div className="mb-4 flex justify-end">
            <a
              href="/admin/invites"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-widest opacity-60 transition hover:opacity-100"
              style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif" }}
            >
              ⚙ Admin
            </a>
          </div>
        )}
        {isAdmin && asId && !impersonateAlumniId ? (
          <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm">
            Couldn&apos;t resolve <b>{asId}</b> to an alumniId.
          </div>
        ) : null}

        {/* ✅ This wrapper is what we'll scope the global "studio button hover" styles to */}
        <div id="profile-studio" className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 lg:p-8">
          <UpdateForm
            key={impersonateAlumniId || email}
            email={email}
            isAdmin={isAdmin}
            alumniId={impersonateAlumniId}
            impersonating={!!impersonateAlumniId}
          />
        </div>
      </div>
    </main>
  );
}
