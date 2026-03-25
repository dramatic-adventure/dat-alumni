import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickFirstString(v: string | string[] | undefined): string | null {
  if (!v) return null;
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : null;
  return typeof v === "string" ? v : null;
}

export default async function DonateSuccessRedirect({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const sessionId =
    pickFirstString(sp?.session_id) ?? pickFirstString(sp?.sessionId);

  const qs = sessionId
    ? `?checkout=success&session_id=${encodeURIComponent(sessionId)}`
    : `?checkout=success`;

  redirect(`/donate${qs}`);
}
