// app/alumni/[slug]/page.tsx

/**
 * 🧠 PARAMS SANITY CHECK (Next.js 15 – App Router)
 *
 * 🚫 DON’T:
 *   export async function Page({ params }: { params: Promise<{ slug: string }> }) {
 *     const { slug } = await params; // ❌ Build error, runtime failure
 *   }
 *
 * ✅ DO:
 *   export async function Page({ params }: { params: { slug: string } }) {
 *     const { slug } = params; // ✅ Works!
 *   }
 *
 * 🔁 WHY:
 *   - In Next.js App Router, `params` is always passed as a plain object.
 *   - Typing it as a Promise causes avoidable chaos.
 *
 * 📌 Mantra:
 *   “Just because a function is async, doesn’t mean its props are Promises.”
 */

// app/alumni/[slug]/page.tsx

// app/alumni/[slug]/page.tsx

import { notFound } from "next/navigation";
import { loadVisibleAlumni, loadAlumniBySlug } from "@/lib/loadAlumni";
import { getStoriesByAlumniSlug } from "@/lib/loadRows";
import AlumniProfilePage from "@/components/alumni/AlumniProfilePage";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

type Params = { slug: string };

/**
 * 🖼️ PAGE: Renders a full Alumni Profile based on the dynamic [slug]
 */
export default async function AlumniPage({
  params,
}: {
  params: Params;
}) {
  const alumni = await loadAlumniBySlug(params.slug);
  if (!alumni) return notFound();

  const relatedStories = await getStoriesByAlumniSlug(alumni.slug);

  return (
    <>
      <AlumniProfilePage data={alumni} relatedStories={relatedStories} />
      <section className="bg-[#241123] pt-[0vh] md:pt-[0vh] pb-10">
        <Footer />
      </section>
    </>
  );
}

/**
 * 📦 STATIC PARAMS: Pre-render all eligible alumni profiles
 */
export async function generateStaticParams(): Promise<Params[]> {
  const alumni = await loadVisibleAlumni();
  return alumni.map((a) => ({ slug: a.slug }));
}

/**
 * 🧠 METADATA: For Open Graph, SEO, and social previews
 */
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
          url: "/default-og-image.jpg", // Replace later
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
