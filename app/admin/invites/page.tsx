// app/admin/invites/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { loadAlumni } from "@/lib/loadAlumni";
import InvitesClient from "./InvitesClient";

function isAdminEmail(email?: string | null) {
  const raw = process.env.ADMIN_EMAILS || "";
  const set = new Set(
    raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
  );
  return !!(email && set.has(String(email).toLowerCase()));
}

export const revalidate = 0;

export default async function AdminInvitesPage() {
  const session = await auth();
  if (!session || !isAdminEmail(session.user?.email)) redirect("/alumni/update");

  const alumni = await loadAlumni();
  const list = alumni
    .filter((a) => a.slug && a.name)
    .map((a) => ({ alumniId: a.slug, alumniName: a.name }))
    .sort((a, b) => a.alumniName.localeCompare(b.alumniName));

  return <InvitesClient alumni={list} />;
}
