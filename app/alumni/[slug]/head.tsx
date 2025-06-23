// app/alumni/[slug]/head.tsx

import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return {
    title: `${params.slug} | DAT Alumni`,
    description: `Discover the story of ${params.slug} through Dramatic Adventure Theatre's alumni network.`,
    viewport: "width=device-width, initial-scale=1", // 👈 ensures responsiveness
  };
}
