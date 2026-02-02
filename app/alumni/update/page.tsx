// app/alumni/update/page.tsx
import { auth } from "@/auth";
import UpdateForm from "./update-form";
import { cookies, headers } from "next/headers";

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
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await auth();

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
    searchParams?.asId ??
    searchParams?.alumniId ??
    searchParams?.asSlug ??
    searchParams?.slug;

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
      <div className="mx-auto w-full max-w-6xl outline outline-2 outline-red-500">
        {isAdmin && asId && !impersonateAlumniId ? (
          <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm">
            Couldn’t resolve <b>{asId}</b> to an alumniId.
          </div>
        ) : null}

        {/* ✅ This wrapper is what we’ll scope the global “studio button hover” styles to */}
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
