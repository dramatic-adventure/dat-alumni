// app/admin/alumni/[alumniId]/media/page.tsx
import AdminMediaManager from "./ui/AdminMediaManager";

export default function Page({ params }: { params: { alumniId: string } }) {
  // TODO: enforce admin auth here
  return <AdminMediaManager alumniId={decodeURIComponent(params.alumniId)} />;
}
