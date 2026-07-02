// app/field-kit/admin/page.tsx
//
// Field Kit staff console (ADMIN-ONLY). The AccountMenu link to here is a
// convenience; THIS is the boundary: gate server-side with requireFieldKitPage
// (defense in depth — load no data for non-roster), then notFound() for any
// non-admin so the route is indistinguishable from a missing page.

import { notFound } from "next/navigation";
import AdminConsole from "@/components/field-kit/AdminConsole";
import type { AdminRollCallInitial, AdminChoiceInitial } from "@/components/field-kit/AdminOps";
import { listNotifications } from "@/lib/notifications";
import { getRallyPoint } from "@/lib/rallyPoint";
import { getCurrentRollCall, getRollCallResponses } from "@/lib/rollCall";
import { getCurrentCompanyChoice, getCompanyChoiceVotes, tallyVotes } from "@/lib/companyChoice";
import { loadFieldKitCrew } from "@/lib/loadFieldKitCrew";
import { loadProgramItinerary } from "@/lib/loadProgram";
import { resolveToday } from "@/lib/programItinerary";
import { requireFieldKitPage, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { normId } from "@/lib/sheetsResilience";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function FieldKitAdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const asId = Array.isArray(sp?.asId) ? sp?.asId[0] : sp?.asId;

  const access = await requireFieldKitPage(FIELD_KIT_PROGRAM_ID, asId);
  if (!access) return null; // not on the roster — the layout renders the gate.
  if (!access.isAdmin) notFound(); // admins only.

  // One parallel wave — every read is TTL-cached underneath, no waterfalls.
  const [history, rally, rollCall, choice, crew, itinerary] = await Promise.all([
    listNotifications(access.programId),
    getRallyPoint(access.programId),
    getCurrentRollCall(access.programId),
    getCurrentCompanyChoice(access.programId),
    loadFieldKitCrew(access.programId),
    loadProgramItinerary(access.programId),
  ]);

  // Slice 5 — build the initial ops boards server-side (same shapes as the
  // leader-gated GET endpoints the console refreshes from).
  let initialRollCall: AdminRollCallInitial | null = null;
  if (rollCall) {
    const responses = await getRollCallResponses(rollCall.id);
    const nameOf = new Map(crew.map((m) => [normId(m.slug), m.name]));
    const bySlug = new Set(responses.map((r) => normId(r.alumniSlug)));
    initialRollCall = {
      rollCall,
      counts: {
        here: responses.filter((r) => r.status === "here").length,
        needsHelp: responses.filter((r) => r.status === "needs-help").length,
        responded: responses.length,
        total: crew.length,
      },
      responded: responses.map((r) => ({
        slug: r.alumniSlug,
        name: nameOf.get(normId(r.alumniSlug)) || r.alumniSlug,
        status: r.status,
        respondedAt: r.respondedAt,
      })),
      notResponded: crew
        .filter((m) => !bySlug.has(normId(m.slug)))
        .map((m) => ({ slug: m.slug, name: m.name })),
    };
  }

  let initialChoice: AdminChoiceInitial | null = null;
  if (choice) {
    const votes = await getCompanyChoiceVotes(choice.id);
    const voted = new Set(votes.map((v) => normId(v.alumniSlug)));
    initialChoice = {
      choice,
      tallies: tallyVotes(choice.choices, votes),
      votedCount: votes.length,
      total: crew.length,
      notVoted: crew
        .filter((m) => !voted.has(normId(m.slug)))
        .map((m) => ({ slug: m.slug, name: m.name })),
    };
  }

  const todayDayId = itinerary ? resolveToday(itinerary).todayDayId ?? "" : "";

  return (
    <AdminConsole
      programId={access.programId}
      initialHistory={history}
      initialRally={rally}
      initialRollCall={initialRollCall}
      initialChoice={initialChoice}
      todayDayId={todayDayId}
    />
  );
}
