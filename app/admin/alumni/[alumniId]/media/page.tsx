import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminMediaManager from "./ui/AdminMediaManager";

function isAdminEmail(email?: string | null) {
  const raw = process.env.ADMIN_EMAILS || "";
  const set = new Set(
    raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
  );
  return !!(email && set.has(String(email).toLowerCase()));
}

export const revalidate = 0;

export default async function Page({
  params,
}: {
  params: Promise<{ alumniId: string }>;
}) {
  const session = await auth();
  if (!session || !isAdminEmail(session.user?.email)) redirect("/alumni/update");

  const { alumniId } = await params;

  return <AdminMediaManager alumniId={decodeURIComponent(alumniId)} />;
}
