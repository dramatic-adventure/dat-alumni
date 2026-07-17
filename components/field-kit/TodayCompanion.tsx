// components/field-kit/TodayCompanion.tsx
//
// FIELD KIT — HOME / TODAY. The data-backed subset of the V17 mockup Shell
// (shell/Shell.tsx) ported onto live itinerary data. Server component: it only
// renders props (no interactivity this slice).
//
// Mission-board status: Rally Point (Slice 3), Roll Call + Company Choice
// (Slice 5) are LIVE — rendered as real cards by app/field-kit/page.tsx
// alongside this component (RallyPointBanner, RollCallCard, CompanyChoiceCard).
// "Today's resources" links to the Field Library (Slice 5). Still honestly
// omitted (no live data store yet): the artist headshot and the cohort avatar
// stack.
//
// NOTE: partnerOrgName is imported from the server-safe ./partnerOrgName module,
// NOT from parts.tsx (which is "use client" — calling its functions from this
// server component throws).

import Link from "next/link";
import { Pill, ClubChip } from "@/components/field-kit/parts";
import { partnerOrgName } from "@/components/field-kit/partnerOrgName";
import TimeAnchorList from "@/components/field-kit/TimeAnchorList";
import { T, FONT, accent } from "@/components/field-kit/tokens";
import { dayById, chapterForDay, allDays } from "@/lib/programItinerary";
import type {
  ProgramItinerary,
  ResolvedToday,
  ItineraryDay,
  Chapter,
} from "@/lib/programItinerary";

const SHELL = { maxWidth: 560, margin: "0 auto" } as const;
const PAGE = { padding: "32px clamp(14px, 4vw, 40px) 40px" } as const;

export default function TodayCompanion({
  itinerary,
  today,
}: {
  itinerary: ProgramItinerary;
  today: ResolvedToday;
}) {
  const day = today.todayDayId ? dayById(itinerary, today.todayDayId) : undefined;

  if (today.state === "during" && day) {
    const chapter = chapterForDay(itinerary, day.id);
    return (
      <div style={PAGE}>
        <div style={SHELL}>
          <DuringToday itinerary={itinerary} day={day} chapter={chapter} />
        </div>
      </div>
    );
  }

  if (today.state === "before") {
    return (
      <div style={PAGE}>
        <div style={SHELL}>
          <BeforeTrip itinerary={itinerary} />
        </div>
      </div>
    );
  }

  if (today.state === "after") {
    return (
      <div style={PAGE}>
        <div style={SHELL}>
          <AfterTrip itinerary={itinerary} />
        </div>
      </div>
    );
  }

  // "during" with no resolvable day, or "unknown" — never crash on a missing day.
  return (
    <div style={PAGE}>
      <div style={SHELL}>
        <UnknownToday itinerary={itinerary} />
      </div>
    </div>
  );
}

// ── Masthead — "Field Kit" + program label ───────────────────────────────────
function Masthead({ label }: { label: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h1 style={{ fontFamily: FONT.anton, fontSize: "clamp(30px, 9vw, 40px)", lineHeight: 0.95, textTransform: "uppercase", color: T.ink, margin: 0 }}>
        Field Kit
      </h1>
      {label && (
        <p style={{ fontFamily: FONT.grotesk, fontSize: 11, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: T.teal, margin: "6px 0 0" }}>
          {label}
        </p>
      )}
    </div>
  );
}

// ── "Full journey →" link to the Itinerary ───────────────────────────────────
function FullJourneyLink() {
  return (
    <Link
      href="/field-kit/itinerary"
      style={{ fontFamily: FONT.grotesk, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.teal, textDecoration: "none" }}
    >
      Full journey →
    </Link>
  );
}

// ── DURING — the day is resolved ──────────────────────────────────────────────
function DuringToday({
  itinerary,
  day,
  chapter,
  countdown,
}: {
  itinerary: ProgramItinerary;
  day: ItineraryDay;
  chapter: Chapter | undefined;
  countdown?: number | null;
}) {
  const acc = chapter ? accent(chapter.accent) : T.teal;
  const partner = day.partnerOrg ? partnerOrgName(day.partnerOrg) : "";
  const times = day.times.slice(0, 5);

  return (
    <>
      <Masthead label={itinerary.label} />

      {/* context line */}
      <p style={{ fontFamily: FONT.grotesk, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.ink, margin: "0 0 4px" }}>
        Day {day.dayNum}{day.location ? ` · ${day.location}` : ""}
      </p>
      {day.dateLabel && (
        <p style={{ fontFamily: FONT.grotesk, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, margin: "0 0 14px" }}>
          {day.dateLabel}
        </p>
      )}

      {/* Pre-departure countdown (Day 0 only) — shown alongside the day content. */}
      {countdown != null && countdown > 0 && (
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 8, marginBottom: 14, padding: "6px 12px", borderRadius: 999, backgroundColor: "rgba(245,200,66,0.12)", border: `1px solid ${T.border}` }}>
          <span style={{ fontFamily: FONT.anton, fontSize: 22, lineHeight: 1, color: T.yellow }}>{countdown}</span>
          <span style={{ fontFamily: FONT.grotesk, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted }}>
            {countdown === 1 ? "day to go" : "days to go"}
          </span>
        </div>
      )}

      {day.spirit && (
        <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 13.5, color: acc, opacity: 0.9, margin: "0 0 6px", lineHeight: 1.45 }}>
          {day.spirit}
        </p>
      )}
      <h2 style={{ fontFamily: FONT.dm, fontWeight: 700, fontSize: 19, color: T.ink, margin: "0 0 6px", lineHeight: 1.25 }}>
        {day.title}
      </h2>
      {day.what && (
        <p style={{ fontFamily: FONT.dm, fontSize: 14, lineHeight: 1.55, color: T.ink, opacity: 0.8, margin: "0 0 16px" }}>
          {day.what}
        </p>
      )}

      {/* today's schedule — shares TimeAnchorList with the Itinerary screen */}
      {times.length > 0 && (
        <div style={{ borderRadius: 12, border: `1px solid ${T.border}`, backgroundColor: T.card, padding: "11px 14px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: FONT.grotesk, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: T.yellow }}>
              Today&rsquo;s schedule
            </span>
            <FullJourneyLink />
          </div>
          <TimeAnchorList times={times} acc={acc} isToday />
        </div>
      )}

      {/* footer chips — chapter, drama club, cohort, partner */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {chapter && (
          <Pill color={acc} solid>
            Act {chapter.num} · {chapter.verb}
          </Pill>
        )}
        {day.dramaClub && <ClubChip slug={day.dramaClub} color={acc} />}
        {day.cohortNote && (
          <span style={{ fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted }}>
            {day.cohortNote}
          </span>
        )}
        {partner && <span style={{ fontFamily: FONT.dm, fontSize: 11.5, color: T.teal }}>{partner}</span>}
      </div>

      {/* capture CTA — /field-kit/capture is live */}
      <CaptureCta />

      {/* Field Library (Slice 5) — shown once the program has resources; counts
          the picks surfaced for THIS day from the real itinerary. */}
      {itinerary.resources && itinerary.resources.length > 0 && (
        <LibraryLink resources={itinerary.resources} dayId={day.id} />
      )}

      {/* Emergency & Contacts (Slice 7) — shown once the program has contact rows. */}
      {itinerary.contacts && itinerary.contacts.length > 0 && <ContactsLink />}

      {/* pack for today — skip when empty */}
      {day.prep.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={sectionLabel}>Pack for today</p>
          {day.prep.map((p) => (
            <div key={p} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 0" }}>
              <span aria-hidden style={{ width: 15, height: 15, borderRadius: 4, border: `1.5px solid ${T.dim}`, flexShrink: 0 }} />
              <span style={{ fontFamily: FONT.dm, fontSize: 12.5, color: T.ink, opacity: 0.85 }}>{p}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// One-tap capture — links to the live /field-kit/capture screen.
function CaptureCta() {
  return (
    <Link
      href="/field-kit/capture"
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        textDecoration: "none", backgroundColor: T.yellow, color: "#241123",
        borderRadius: 12, padding: "13px 16px",
      }}
    >
      <span>
        <span style={{ display: "block", fontFamily: FONT.grotesk, fontSize: 9.5, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 2 }}>
          Capture the moment
        </span>
        <span style={{ fontFamily: FONT.dm, fontSize: 12.5, opacity: 0.85 }}>
          Note, quote, image, sound, voice
        </span>
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span aria-hidden style={{ fontSize: 22 }}>✦</span>
      </span>
    </Link>
  );
}

// The Field Library link — quiet row under the capture CTA. Surfaces how many
// resources are pinned to today so the artist knows there's something waiting.
function LibraryLink({
  resources,
  dayId,
}: {
  resources: NonNullable<ProgramItinerary["resources"]>;
  dayId: string;
}) {
  const todayCount = resources.filter((r) => r.dayId === dayId).length;
  return (
    <Link
      href="/field-kit/library"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        textDecoration: "none",
        marginTop: 10,
        padding: "11px 14px",
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        backgroundColor: T.card,
      }}
    >
      <span>
        <span style={{ display: "block", fontFamily: FONT.grotesk, fontSize: 9.5, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: T.teal, marginBottom: 2 }}>
          The Field Library
        </span>
        <span style={{ fontFamily: FONT.dm, fontSize: 12, color: T.muted }}>
          {todayCount > 0
            ? `${todayCount} ${todayCount === 1 ? "resource" : "resources"} for today · ${resources.length} on the shelf`
            : `${resources.length} ${resources.length === 1 ? "resource" : "resources"} on the shelf`}
        </span>
      </span>
      <span aria-hidden style={{ fontFamily: FONT.grotesk, fontSize: 14, color: T.teal, flexShrink: 0 }}>→</span>
    </Link>
  );
}

// Emergency & Contacts link — same quiet row treatment as LibraryLink. The
// destination page + its data are offline-capable after one visit, so this row
// is worth a tap before wheels-up.
function ContactsLink() {
  return (
    <Link
      href="/field-kit/contacts"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        textDecoration: "none",
        marginTop: 10,
        padding: "11px 14px",
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        backgroundColor: T.card,
      }}
    >
      <span>
        <span style={{ display: "block", fontFamily: FONT.grotesk, fontSize: 9.5, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: T.pink, marginBottom: 2 }}>
          Emergency &amp; Contacts
        </span>
        <span style={{ fontFamily: FONT.dm, fontSize: 12, color: T.muted }}>
          Numbers, staff, and the WhatsApp group — works offline
        </span>
      </span>
      <span aria-hidden style={{ fontFamily: FONT.grotesk, fontSize: 14, color: T.pink, flexShrink: 0 }}>→</span>
    </Link>
  );
}

// ── BEFORE — pre-departure ────────────────────────────────────────────────────
// Day 0 *is* the pre-departure content, so render the first itinerary day (the
// lowest day number — typically the Day 0 departure/travel day) in FULL, with the
// countdown to its date kept on top. Falls back to a minimal screen only if no
// itinerary days are authored yet.
function BeforeTrip({ itinerary }: { itinerary: ProgramItinerary }) {
  const day0 = firstDay(itinerary);
  const departureIso = day0?.fullDate || firstDatedDay(itinerary)?.fullDate || "";
  const countdown = departureIso ? daysUntil(departureIso) : null;

  if (day0) {
    return (
      <DuringToday
        itinerary={itinerary}
        day={day0}
        chapter={chapterForDay(itinerary, day0.id)}
        countdown={countdown}
      />
    );
  }

  // No itinerary days authored yet — minimal pre-departure fallback.
  return (
    <>
      <Masthead label={itinerary.label} />
      <p style={{ fontFamily: FONT.grotesk, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.ink, margin: "0 0 4px" }}>
        Day 0{itinerary.location ? ` · ${itinerary.location}` : ""}
      </p>
      {itinerary.dates && (
        <p style={{ fontFamily: FONT.grotesk, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, margin: "0 0 18px" }}>
          {itinerary.dates}
        </p>
      )}
      <p style={{ fontFamily: FONT.dm, fontSize: 14.5, lineHeight: 1.55, color: T.ink, opacity: 0.82, margin: "0 0 18px" }}>
        Your day-by-day journey lights up here once the trip begins.
      </p>
      <FullJourneyLink />
    </>
  );
}

// ── AFTER — the trip has wrapped ──────────────────────────────────────────────
function AfterTrip({ itinerary }: { itinerary: ProgramItinerary }) {
  return (
    <>
      <Masthead label={itinerary.label} />
      <p style={{ fontFamily: FONT.dm, fontSize: 14.5, lineHeight: 1.55, color: T.ink, opacity: 0.82, margin: "0 0 18px" }}>
        That&rsquo;s a wrap. The trip has ended — revisit the full journey any time, and your traces from the
        field will live on.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FullJourneyLink />
        <Link
          href="/field-kit/traces"
          style={{ fontFamily: FONT.grotesk, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted, textDecoration: "none" }}
        >
          Your traces →
        </Link>
      </div>
    </>
  );
}

// ── UNKNOWN / no resolvable day — gentle fallback ─────────────────────────────
function UnknownToday({ itinerary }: { itinerary: ProgramItinerary }) {
  return (
    <>
      <Masthead label={itinerary.label} />
      <p style={{ fontFamily: FONT.dm, fontSize: 14.5, lineHeight: 1.55, color: T.ink, opacity: 0.82, margin: "0 0 18px" }}>
        Today&rsquo;s details aren&rsquo;t posted yet. Check the full journey for what&rsquo;s ahead.
      </p>
      <FullJourneyLink />
    </>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────
const sectionLabel: React.CSSProperties = {
  fontFamily: FONT.grotesk, fontSize: 9.5, fontWeight: 700,
  letterSpacing: "0.2em", textTransform: "uppercase", color: T.muted, margin: "0 0 8px",
};

/** The lowest-numbered day (e.g. Day 0, the pre-departure day), or undefined. */
function firstDay(it: ProgramItinerary): ItineraryDay | undefined {
  return [...allDays(it)].sort((a, b) => a.dayNum - b.dayNum)[0];
}

function firstDatedDay(it: ProgramItinerary): ItineraryDay | undefined {
  return [...allDays(it)]
    .filter((d) => d.fullDate)
    .sort((a, b) => a.fullDate.localeCompare(b.fullDate))[0];
}

/** Whole days from local "today" to an ISO yyyy-mm-dd date; null if unparseable. */
function daysUntil(iso: string): number | null {
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - todayMid.getTime()) / 86_400_000);
}
