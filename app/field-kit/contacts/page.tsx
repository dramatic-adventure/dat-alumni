// app/field-kit/contacts/page.tsx
//
// Emergency & Contacts (Slice 7) — read-only card of emergency numbers, ground
// control, field staff, traveling artists, and WhatsApp groups. Gates (defense
// in depth) and reads the itinerary — the contacts ride its payload + TTL
// caches (lib/contacts.ts). Offline: the page HTML is cached by the service
// worker's nav caching after first visit, and the data is already in the
// precached itinerary payload — an emergency card has to work with no signal.

import ContactsCompanion from "@/components/field-kit/ContactsCompanion";
import ImpersonationBanner from "@/components/field-kit/ImpersonationBanner";
import { requireFieldKitPage, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { loadProgramItinerary } from "@/lib/loadProgram";
import { T, FONT } from "@/components/field-kit/tokens";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const asId = Array.isArray(sp?.asId) ? sp?.asId[0] : sp?.asId;

  // Gate + itinerary read are independent — run concurrently (same shape as
  // Library/Today; no waterfall).
  const [access, itinerary] = await Promise.all([
    requireFieldKitPage(FIELD_KIT_PROGRAM_ID, asId),
    loadProgramItinerary(FIELD_KIT_PROGRAM_ID),
  ]);
  if (!access) return null; // not on the roster — the layout renders the gate.
  if (!itinerary || !itinerary.contacts?.length) return <ContactsEmpty />;

  return (
    <>
      {access.impersonating && <ImpersonationBanner slug={access.slug} />}
      <ContactsCompanion contacts={itinerary.contacts} programLabel={itinerary.label} />
    </>
  );
}

function ContactsEmpty() {
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "72px clamp(18px, 5vw, 40px)", textAlign: "center" }}>
      <p style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: T.teal, margin: "0 0 12px" }}>
        Emergency &amp; Contacts
      </p>
      <h1 style={{ fontFamily: FONT.anton, fontSize: "clamp(28px, 6.5vw, 48px)", lineHeight: 0.96, textTransform: "uppercase", color: T.ink, margin: "0 0 16px" }}>
        The card is being written.
      </h1>
      <p style={{ fontFamily: FONT.dm, fontSize: 14.5, lineHeight: 1.55, color: T.ink, opacity: 0.78, margin: 0 }}>
        Emergency numbers, staff contacts, and the on-the-ground WhatsApp groups land here as the
        road team adds them.
      </p>
    </main>
  );
}
