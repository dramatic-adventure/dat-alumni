import AdminMediaManager from "./ui/AdminMediaManager";

export default async function Page({
  params,
}: {
  params: Promise<{ alumniId: string }>;
}) {
  const { alumniId } = await params;

  // TODO: enforce admin auth here
  return <AdminMediaManager alumniId={decodeURIComponent(alumniId)} />;
}