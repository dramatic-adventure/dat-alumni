// app/field-kit/library/view/[id]/page.tsx
//
// In-app reader route for one Field Library resource (Slice 5 follow-up).
// Exists because opening files in a new tab stranded standalone-app users:
// Safari web apps (Mac) and iOS home-screen installs have no back chrome, so
// the PDF replaced the kit with no way home. This page keeps the file inside
// the kit's own chrome with an always-visible "back to the shelf" bar
// (components/field-kit/ResourceViewer.tsx).
//
// Gate + lookup mirror the library page: requireFieldKitPage (defense in
// depth — the file proxy re-checks auth anyway) and the Sheet-backed resource
// store. Offline: the route rides the SW's nav caching after first visit; the
// framed file itself is served from the fk-lib cache (public/sw.js).

import { notFound } from "next/navigation";
import ResourceViewer from "@/components/field-kit/ResourceViewer";
import ImpersonationBanner from "@/components/field-kit/ImpersonationBanner";
import { requireFieldKitPage, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { getResourceById } from "@/lib/resources";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function ResourceViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id: rawId }, sp] = await Promise.all([params, searchParams ?? Promise.resolve(undefined)]);
  const asId = Array.isArray(sp?.asId) ? sp?.asId[0] : sp?.asId;
  const id = decodeURIComponent(String(rawId || "")).trim();

  const [access, resource] = await Promise.all([
    requireFieldKitPage(FIELD_KIT_PROGRAM_ID, asId),
    id ? getResourceById(FIELD_KIT_PROGRAM_ID, id) : Promise.resolve(null),
  ]);
  if (!access) return null; // not on the roster — the layout renders the gate.
  if (!resource) notFound();

  return (
    <>
      {access.impersonating && <ImpersonationBanner slug={access.slug} />}
      <ResourceViewer resource={resource} />
    </>
  );
}
