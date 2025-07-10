// app/alumni/[slug]/head.tsx
import { Metadata } from "next";
import { loadAlumniBySlug } from "@/lib/loadAlumni";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const alumni = await loadAlumniBySlug(params.slug);

  if (!alumni) {
    return {
      title: "Alumni Not Found | DAT",
      description: "This alumni profile could not be found.",
      viewport: "width=device-width, initial-scale=1",
    };
  }

  const { name } = alumni;

  return {
    title: `${name} | DAT Alumni`,
    description: `Discover the story of ${name} through Dramatic Adventure Theatre's alumni network.`,
    viewport: "width=device-width, initial-scale=1",
  };
}
