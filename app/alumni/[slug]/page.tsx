import { notFound } from "next/navigation";
import { loadVisibleAlumni, loadAlumniBySlug } from "@/lib/loadAlumni";
import { getAllStories } from "@/lib/loadRows";
import AlumniProfilePage from "@/components/alumni/AlumniProfilePage";

type Params = { slug: string };

export default async function AlumniPage({ params }: { params: Params }) {
  const { slug } = params;

  console.log("🛠 SLUG from params:", slug);

  const alumni = await loadAlumniBySlug(slug);
  console.log("🔍 Alumni lookup result:", alumni);

  if (!alumni) return notFound();

  const allStories = await getAllStories();

  return (
    <>
      <AlumniProfilePage
  data={{
    slug: alumni.slug,
    name: alumni.name,
    roles: alumni.roles || [],
    location: alumni.location || "",
    headshotUrl: alumni.headshotUrl || "",
    identityTags: alumni.identityTags || [],
    statusFlags: alumni.statusFlags || [],
    programBadges: alumni.programBadges || [],
    programSeasons: alumni.programSeasons || [],
    artistStatement: alumni.artistStatement || "",
    fieldNotes: alumni.fieldNotes || [],
    imageUrls: alumni.imageUrls || [],
    posterUrls: alumni.posterUrls || [],
    email: alumni.email || "",
    website: alumni.website || "",
    socials: alumni.socials || [],
    updates: alumni.updates || [],
  }}
  allStories={allStories}
      />
      <section className="bg-[#241123] pt-0 pb-10">
      </section>
    </>
  );
}

export async function generateStaticParams(): Promise<Params[]> {
  const alumni = await loadVisibleAlumni();
  console.log("🧪 Static Slugs:", alumni.map((a) => a.slug));
  return alumni.map((a) => ({ slug: a.slug }));
}
