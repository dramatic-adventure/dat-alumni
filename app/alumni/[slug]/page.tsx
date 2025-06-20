import { notFound } from "next/navigation";
import { loadVisibleAlumni, loadAlumniBySlug } from "@/lib/loadAlumni";
import { getAllStories } from "@/lib/loadRows"; // ✅ New import
import AlumniProfilePage from "@/components/alumni/AlumniProfilePage";
import Footer from "@/components/ui/Footer";
import type { Metadata } from "next";

type Params = { slug: string };

export default async function AlumniPage({ params }: { params: Params }) {
  const alumni = await loadAlumniBySlug(params.slug);
  if (!alumni) return notFound();

  const allStories = await getAllStories(); // ✅ Full unfiltered story list

  return (
    <>
      <AlumniProfilePage
        data={{
          slug: alumni.slug,
          name: alumni.name,
          role: alumni.role ?? "",
          headshotUrl: alumni.headshotUrl ?? "",
          identityTags: alumni.identityTags ?? [],
          statusFlags: alumni.statusFlags ?? [],
          programBadges: alumni.programBadges ?? [],
          artistStatement: alumni.artistStatement ?? "",
          fieldNotes: alumni.fieldNotes ?? [],
          imageUrls: alumni.imageUrls ?? [],
          posterUrls: alumni.posterUrls ?? [],
        }}
        allStories={allStories} // ✅ Pass to filter later in ProfileCard
      />
      <section className="bg-[#241123] pt-0 pb-10">
        <Footer />
      </section>
    </>
  );
}

export async function generateStaticParams(): Promise<Params[]> {
  const alumni = await loadVisibleAlumni();
  return alumni.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const alumni = await loadAlumniBySlug(params.slug);
  if (!alumni) {
    return {
      title: "Alumni Not Found – Dramatic Adventure Theatre",
      description: "This alumni profile could not be found.",
    };
  }

  const description = `Meet ${alumni.name} — a featured alumni from Dramatic Adventure Theatre.`;

  return {
    title: alumni.name,
    description,
    alternates: {
      canonical: `https://alumni.dramaticadventure.com/alumni/${alumni.slug}`,
    },
    openGraph: {
      title: alumni.name,
      description,
      url: `https://alumni.dramaticadventure.com/alumni/${alumni.slug}`,
      type: "profile",
      images: [
        {
          url: "/default-og-image.jpg",
          width: 1200,
          height: 630,
          alt: alumni.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: alumni.name,
      description,
      images: ["/default-og-image.jpg"],
    },
  };
}
