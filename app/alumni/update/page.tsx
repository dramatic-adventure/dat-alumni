// app/alumni/update/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UpdateForm from "./update-form";
import InviteConfirmControls from "./InviteConfirmControls";
import {
  getAlumniIdForOwnerEmail,
  resolveSlugToAlumniId,
} from "@/lib/ownership";
import {
  redeemInviteToken,
  getInvitePreview,
  type InvitePreview,
} from "@/lib/invites";

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

// ─── Small presentational helpers (kept inline so we don't fan out new files) ──

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-center">{children}</main>
  );
}

function H1({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mb-4 text-3xl font-bold"
      style={{
        fontFamily: "var(--font-anton), system-ui, sans-serif",
        textTransform: "uppercase",
      }}
    >
      {children}
    </h1>
  );
}

function P({ children, className = "mb-6" }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={className}
      style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif" }}
    >
      {children}
    </p>
  );
}

function PurpleLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-block whitespace-nowrap rounded-xl bg-[#6c00af] px-8 py-3 font-semibold uppercase tracking-[0.35rem] text-[#f2f2f2] transition-[transform,filter,box-shadow] duration-150 hover:-translate-y-[1px] hover:brightness-[1.07] hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif" }}
    >
      {children}
    </a>
  );
}

export default async function UpdatePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const sp = searchParams ? await searchParams : undefined;
  const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";

  // ── Invite token parsing ───────────────────────────────────────
  const inviteRaw = sp?.invite;
  const inviteToken = normId(Array.isArray(inviteRaw) ? inviteRaw[0] : inviteRaw);

  const confirmRaw = sp?.confirm;
  const confirmValue = normId(Array.isArray(confirmRaw) ? confirmRaw[0] : confirmRaw);
  const confirm = confirmValue === "1" || confirmValue === "true";

  // ── Invite path: not signed in → sign-in prompt (preserve token) ──
  if (inviteToken && !session) {
    const callback = encodeURIComponent(`/alumni/update?invite=${inviteToken}`);
    return (
      <Shell>
        <H1>You&apos;ve been invited!</H1>
        <P>Sign in with Google to claim your alumni profile.</P>
        <PurpleLink href={`/login?callbackUrl=${callback}`}>
          Sign In with Google
        </PurpleLink>
      </Shell>
    );
  }

  // ── Invite path: signed in, not yet confirmed → show confirmation UI ──
  if (inviteToken && session?.user?.email && !confirm) {
    let preview: InvitePreview = { ok: false, reason: "invalid" };
    try {
      preview = await getInvitePreview(inviteToken);
    } catch {
      preview = { ok: false, reason: "invalid" };
    }

    if (!preview.ok) {
      return (
        <Shell>
          <H1>Invite Link Issue</H1>
          <P>This invite link is invalid.</P>
          <PurpleLink href="/alumni/update">Go to Profile Studio</PurpleLink>
        </Shell>
      );
    }

    if (preview.used) {
      return (
        <Shell>
          <H1>Invite Already Used</H1>
          <P>
            This invite link has already been claimed. If you believe this is a
            mistake, please contact DAT.
          </P>
          <PurpleLink href="/alumni/update">Go to Profile Studio</PurpleLink>
        </Shell>
      );
    }

    if (preview.expired) {
      return (
        <Shell>
          <H1>Invite Expired</H1>
          <P>This invite link has expired. Please ask DAT for a new one.</P>
          <PurpleLink href="/alumni/update">Go to Profile Studio</PurpleLink>
        </Shell>
      );
    }

    const signedInEmail = String(session.user.email || "").toLowerCase();
    return (
      <Shell>
        <H1>Claim your profile</H1>
        <P>
          You&apos;ve been invited to claim the profile for{" "}
          <b>{preview.alumniName || preview.alumniId}</b>.
        </P>
        <P className="mb-8">
          You&apos;re currently signed in as <b>{signedInEmail}</b>. Once you
          confirm, this profile will be permanently linked to this Google
          account.
        </P>
        <InviteConfirmControls token={inviteToken} />
      </Shell>
    );
  }

  // ── Invite path: signed in + explicit confirm → redeem ─────────
  if (inviteToken && session?.user?.email && confirm) {
    const result = await redeemInviteToken(inviteToken, session.user.email);
    if (!result.ok) {
      const messages: Record<string, string> = {
        expired: "This invite link has expired. Please ask for a new one.",
        already_used: "This invite link has already been used.",
        already_owned: "This profile is already linked to an account.",
        invalid: "This invite link is invalid.",
      };
      return (
        <Shell>
          <H1>Invite Link Issue</H1>
          <P>{messages[result.reason] ?? "Something went wrong with this invite link."}</P>
          <PurpleLink href="/alumni/update">Go to Profile Studio</PurpleLink>
        </Shell>
      );
    }
    // Redeemed — bounce to clean URL so the token isn't re-processed.
    redirect("/alumni/update");
  }

  // ── Non-invite path: not signed in → /login ────────────────────
  if (!session) {
    const callback = encodeURIComponent("/alumni/update");
    redirect(`/login?callbackUrl=${callback}`);
  }

  // ── Signed in, no invite: normal editor flow ───────────────────
  const email = (session!.user?.email || "").toLowerCase();
  const admin = isAdminEmail(email);

  // Canonical server-side resolution of the viewer's owned profile.
  let viewerAlumniId = "";
  if (spreadsheetId && email) {
    try {
      viewerAlumniId = await getAlumniIdForOwnerEmail(spreadsheetId, email);
    } catch {
      viewerAlumniId = "";
    }
  }

  // Admin impersonation (unchanged semantics, now resolved directly via Sheets).
  const raw = sp?.asId ?? sp?.alumniId ?? sp?.asSlug ?? sp?.slug;
  const asIdRaw = Array.isArray(raw) ? raw[0] : raw;
  const asId = normId(asIdRaw);

  let impersonateAlumniId = "";
  let impersonateSlug = "";

  if (admin && asId) {
    if (looksLikeAlumniId(asId)) {
      impersonateAlumniId = asId;
    } else {
      impersonateSlug = asId;
      try {
        impersonateAlumniId = await resolveSlugToAlumniId(
          spreadsheetId,
          impersonateSlug
        );
      } catch {
        impersonateAlumniId = "";
      }
    }
  }

  const effectiveAlumniId = impersonateAlumniId || viewerAlumniId;

  // Non-admin signed in but no claimed profile → first-class unclaimed state.
  if (!effectiveAlumniId && !admin) {
    return (
      <Shell>
        <H1>No profile linked to this account</H1>
        <P>
          You&apos;re signed in as <b>{email}</b>, but there&apos;s no alumni
          profile linked to this Google account yet.
        </P>
        <P className="mb-8">
          If you have an invite link from DAT, open it now. Otherwise please
          contact DAT to request one.
        </P>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <PurpleLink href="mailto:hello@dramaticadventure.com?subject=Alumni%20profile%20invite">
            Contact DAT
          </PurpleLink>
        </div>
      </Shell>
    );
  }

  return (
    <main className="w-full px-4 sm:px-6 lg:px-10 py-6">
      <div className="mx-auto w-full max-w-6xl">
        {admin && asId && !impersonateAlumniId ? (
          <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm">
            Couldn&apos;t resolve <b>{asId}</b> to an alumniId.
          </div>
        ) : null}

        {/* ✅ This wrapper is what we'll scope the global "studio button hover" styles to */}
        <div
          id="profile-studio"
          className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 lg:p-8"
        >
          <UpdateForm
            key={impersonateAlumniId || viewerAlumniId || email}
            email={email}
            isAdmin={admin}
            alumniId={impersonateAlumniId}
            impersonating={!!impersonateAlumniId}
          />
        </div>
      </div>
    </main>
  );
}
