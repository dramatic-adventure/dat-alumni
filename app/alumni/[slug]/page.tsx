import { notFound } from "next/navigation";
import { loadVisibleAlumni, loadAlumniBySlug } from "@/lib/loadAlumni";
import { getAllStories } from "@/lib/loadRows";
import AlumniProfilePage from "@/components/alumni/AlumniProfilePage";
import Footer from "@/components/ui/Footer";

type Params = { slug: string };

export default async function AlumniPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const alumni = await loadAlumniBySlug(slug);
  if (!alumni) return notFound();

  const allStories = await getAllStories();

  return (
    <>
      <AlumniProfilePage
        data={{
          slug: alumni.slug,
          name: alumni.name,
          role: alumni.role ?? "",
          headshotUrl: alumni.headshotUrl ?? "",
          location: alumni.location ?? "",
          identityTags: alumni.identityTags ?? [],
          statusFlags: alumni.statusFlags ?? [],
          programBadges: alumni.programBadges ?? [],
          artistStatement: alumni.artistStatement ?? "",
          fieldNotes: alumni.fieldNotes ?? [],
          imageUrls: alumni.imageUrls ?? [],
          posterUrls: alumni.posterUrls ?? [],
          email: alumni.email ?? "",
          website: alumni.website ?? "",
          socials: alumni.socials ?? [],
        }}
        allStories={allStories}
      />
      <section className="bg-[#241123] pt-0 pb-10">
        <Footer />
      </section>
    </>
  );
}

export async function generateStaticParams(): Promise<Params[]> {
  const alumni = await loadVisibleAlumni();
  console.log("🧪 Static Slugs:", alumni.map((a) => a.slug)); // ← Add this
  return alumni.map((a) => ({ slug: a.slug }));
}