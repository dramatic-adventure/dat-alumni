// components/field-kit/ItineraryCompanion.tsx
//
// THE ITINERARY — the live day-by-day field document, ported from the V17
// mockup (itinerary/ItineraryCompanion.tsx) onto live data. Server component:
// it only renders props (no interactivity this slice). The day "Capture" /
// "Resources" actions are non-interactive stubs until later slices.
//
// Differences from the mockup, by design:
//   • Reads a live ProgramItinerary (no sampleProgram fixtures).
//   • Mini-stats + the lede sentence are DERIVED from the data (the mockup
//     hand-authored "Five chapters, ten days" — which was wrong).
//   • "Today" comes from resolveToday() (date-derived), with before/after-trip
//     fallbacks, instead of a hardcoded PROGRAM.todayDayId.

import { Pill, ClubChip } from "@/components/field-kit/parts";
import { partnerOrgName } from "@/components/field-kit/partnerOrgName";
import TimeAnchorList from "@/components/field-kit/TimeAnchorList";
import { T, FONT, accent } from "@/components/field-kit/tokens";
import type {
  ProgramItinerary,
  Chapter,
  ItineraryDay,
  ChapterStatus,
  ResolvedToday,
} from "@/lib/programItinerary";

const STATUS_COPY: Record<ChapterStatus, { label: string; color: string }> = {
  complete: { label: "Chapter published", color: "#1f9d57" },
  draft: { label: "Chapter in progress", color: T.pink },
  empty: { label: "Chapter not started", color: T.muted },
};

type DayState = "past" | "today" | "future";

function dayStateOf(day: ItineraryDay, today: ResolvedToday, todayNum: number | undefined): DayState {
  if (today.state === "before") return "future";
  if (today.state === "after") return "past";
  if (today.todayDayId && day.id === today.todayDayId) return "today";
  if (todayNum == null) return "future";
  return day.dayNum < todayNum ? "past" : "future";
}

export default function ItineraryCompanion({
  itinerary,
  today,
}: {
  itinerary: ProgramItinerary;
  today: ResolvedToday;
}) {
  const allDays = itinerary.chapters.flatMap((c) => c.days);
  const todayDay = today.todayDayId ? allDays.find((d) => d.id === today.todayDayId) : undefined;
  const todayNum = todayDay?.dayNum;

  // Derived counts (never hand-authored).
  const nChapters = itinerary.chapters.length;
  const nDays = allDays.length;
  const clubSlugs = new Set<string>();
  const partnerSlugs = new Set<string>();
  for (const c of itinerary.chapters) {
    if (c.dramaClub) clubSlugs.add(c.dramaClub);
    if (c.partnerOrg) partnerSlugs.add(c.partnerOrg);
    for (const d of c.days) {
      if (d.dramaClub) clubSlugs.add(d.dramaClub);
      if (d.partnerOrg) partnerSlugs.add(d.partnerOrg);
    }
  }

  return (
    <div style={{ padding: "32px clamp(14px, 4vw, 56px) 40px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Hero overview */}
        <p style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: T.teal, margin: "0 0 10px" }}>
          {itinerary.label}
        </p>
        <h1 style={{ fontFamily: FONT.anton, fontSize: "clamp(34px, 6.5vw, 70px)", lineHeight: 0.92, textTransform: "uppercase", color: T.ink, margin: "0 0 14px" }}>
          The Journey,<br />day by day.
        </h1>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 22 }}>
          <span aria-hidden style={{ display: "inline-block", width: 26, height: 2, marginTop: 9, backgroundColor: T.pink, borderRadius: 1, flexShrink: 0 }} />
          <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: "clamp(14px, 1.7vw, 18px)", color: T.ink, opacity: 0.84, margin: 0, lineHeight: 1.45 }}>
            {[itinerary.essence, itinerary.dates ? `${itinerary.dates}.` : "", statLede(nChapters, nDays, clubSlugs.size)]
              .filter(Boolean)
              .join(" ")}
          </p>
        </div>

        {/* mini stats — derived */}
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginBottom: 30, paddingBottom: 22, borderBottom: `1px solid ${T.sep}` }}>
          <Stat n={String(nChapters)} label={nChapters === 1 ? "Chapter" : "Chapters"} color={T.pink} />
          <Stat n={String(nDays)} label="Field days" color={T.teal} />
          {clubSlugs.size > 0 && <Stat n={String(clubSlugs.size)} label={clubSlugs.size === 1 ? "Drama club" : "Drama clubs"} color={T.purple} />}
          {partnerSlugs.size > 0 && <Stat n={String(partnerSlugs.size)} label={partnerSlugs.size === 1 ? "Partner org" : "Partner orgs"} color={T.grape} />}
        </div>

        {/* The spine */}
        <div style={{ position: "relative" }}>
          <span aria-hidden style={{ position: "absolute", left: 18, top: 8, bottom: 8, width: 2, backgroundColor: T.sep }} />
          {itinerary.chapters.map((ch) => (
            <ChapterBlock key={ch.id} chapter={ch} today={today} todayNum={todayNum} />
          ))}
        </div>
      </div>
    </div>
  );
}

function statLede(nCh: number, nDays: number, nClubs: number): string {
  const parts = [
    `${nCh} ${nCh === 1 ? "chapter" : "chapters"}`,
    `${nDays} ${nDays === 1 ? "day" : "days"} in the field`,
  ];
  if (nClubs > 0) parts.push(`${nClubs} ${nClubs === 1 ? "drama club" : "drama clubs"}`);
  return parts.join(", ") + ".";
}

function Stat({ n, label, color }: { n: string; label: string; color: string }) {
  return (
    <div>
      <p style={{ fontFamily: FONT.anton, fontSize: 30, lineHeight: 1, color, margin: 0 }}>{n}</p>
      <p style={{ fontFamily: FONT.grotesk, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, margin: "2px 0 0" }}>{label}</p>
    </div>
  );
}

function ChapterBlock({ chapter, today, todayNum }: { chapter: Chapter; today: ResolvedToday; todayNum: number | undefined }) {
  const acc = accent(chapter.accent);
  const status = STATUS_COPY[chapter.status];
  const hasToday = chapter.days.some((d) => dayStateOf(d, today, todayNum) === "today");

  return (
    <section style={{ position: "relative", paddingLeft: 50, marginBottom: 28 }}>
      {/* numbered ink/gold marker */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 2,
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: T.ink,
          color: T.yellow,
          fontFamily: FONT.anton,
          fontSize: "1.1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: hasToday ? `0 0 0 4px ${acc}33` : "none",
          zIndex: 2,
        }}
      >
        {String(chapter.num).padStart(2, "0")}
      </div>

      {/* chapter header */}
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: "clamp(17px, 2.4vw, 22px)", color: T.ink, margin: "4px 0 4px" }}>
          {chapter.verb} <span style={{ color: acc }}>in {chapter.place}</span>
        </h2>
        {chapter.description && (
          <p style={{ fontFamily: FONT.dm, fontSize: 14, lineHeight: 1.55, color: T.ink, opacity: 0.8, margin: "0 0 8px", maxWidth: "60ch" }}>
            {chapter.description}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT.grotesk, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: status.color }}>
            <span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: status.color, display: "inline-block" }} />
            {status.label}
          </span>
          {chapter.dramaClub && <span style={{ color: T.dim }}>·</span>}
          {chapter.dramaClub && <ClubChip slug={chapter.dramaClub} color={acc} />}
        </div>

        {chapter.goal && <GoalBlock goal={chapter.goal} />}
        {chapter.tips && <TipsBlock tips={chapter.tips} acc={acc} />}
      </div>

      {/* nested day leaves */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {chapter.days.map((day) => (
          <DayLeaf key={day.id} day={day} acc={acc} state={dayStateOf(day, today, todayNum)} />
        ))}
      </div>
    </section>
  );
}

function DayLeaf({ day, acc, state }: { day: ItineraryDay; acc: string; state: DayState }) {
  const isToday = state === "today";
  const partner = day.partnerOrg ? partnerOrgName(day.partnerOrg) : "";

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        border: `1px solid ${isToday ? acc : T.border}`,
        backgroundColor: isToday ? `${acc}0d` : T.card,
        padding: "12px 14px",
        opacity: state === "past" ? 0.62 : 1,
        boxShadow: isToday ? `0 8px 22px ${acc}22` : "0 2px 8px rgba(36,17,35,0.05)",
      }}
    >
      {/* spine dot */}
      <span aria-hidden style={{ position: "absolute", left: -38, top: 18, width: 10, height: 10, borderRadius: "50%", backgroundColor: isToday ? acc : T.dim, border: `2px solid ${T.paper}` }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 2 }}>
        <span style={{ fontFamily: FONT.grotesk, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: isToday ? acc : T.muted }}>
          Day {day.dayNum}{day.dateLabel ? ` · ${day.dateLabel}` : ""}
        </span>
        {isToday && <Pill color={acc} solid>Today</Pill>}
        {state === "past" && <span style={{ fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted }}>Done</span>}
      </div>

      {day.spirit && (
        <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 12, color: isToday ? acc : T.muted, margin: "0 0 6px", opacity: isToday ? 0.9 : 0.7 }}>
          {day.spirit}
        </p>
      )}

      <h3 style={{ fontFamily: FONT.dm, fontWeight: 700, fontSize: 15, color: T.ink, margin: "0 0 4px" }}>{day.title}</h3>
      {day.what && <p style={{ fontFamily: FONT.dm, fontSize: 13, lineHeight: 1.5, color: T.ink, opacity: 0.78, margin: "0 0 8px" }}>{day.what}</p>}

      {day.times.length > 0 && <TimeAnchorList times={day.times} acc={acc} isToday={isToday} />}

      {/* who + partner */}
      {(day.cohortNote || partner) && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: day.prep.length || isToday ? 10 : 0, marginTop: day.times.length ? 12 : 0 }}>
          {day.cohortNote && (
            <span style={{ fontFamily: FONT.grotesk, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted }}>
              {day.cohortNote}
            </span>
          )}
          {day.cohortNote && partner && <span style={{ color: T.dim }}>·</span>}
          {partner && <span style={{ fontFamily: FONT.dm, fontSize: 11.5, color: T.teal }}>{partner}</span>}
        </div>
      )}

      {/* prep chips */}
      {day.prep.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: isToday ? 10 : 0 }}>
          {day.prep.map((p) => (
            <span key={p} style={{ fontFamily: FONT.dm, fontSize: 11, color: T.ink, opacity: 0.75, backgroundColor: "rgba(246,239,227,0.06)", padding: "3px 8px", borderRadius: 20, border: `1px solid ${T.border}` }}>
              ◦ {p}
            </span>
          ))}
        </div>
      )}

      {/* today's actions — stubs this slice (no write paths yet) */}
      {isToday && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2, alignItems: "center" }}>
          <StubAction filled>✎ Capture today</StubAction>
          <StubAction>▤ Today&apos;s resources</StubAction>
          <span style={{ fontFamily: FONT.grotesk, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, marginLeft: "auto" }}>
            Soon
          </span>
        </div>
      )}
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  fontFamily: FONT.grotesk,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  padding: "8px 12px",
  borderRadius: 8,
};

// Non-interactive placeholder for the day's Capture / Resources actions.
function StubAction({ children, filled = false }: { children: React.ReactNode; filled?: boolean }) {
  return (
    <span
      aria-disabled
      title="Coming in a later slice"
      style={{
        ...actionBtn,
        cursor: "default",
        opacity: 0.5,
        backgroundColor: filled ? T.black : "transparent",
        color: filled ? "#fff" : T.ink,
        border: filled ? "none" : `1px solid ${T.border}`,
      }}
    >
      {children}
    </span>
  );
}

function GoalBlock({ goal }: { goal: string }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", margin: "10px 0 12px", padding: "10px 14px", borderRadius: 8, backgroundColor: "rgba(246,239,227,0.05)", border: `1px solid ${T.border}` }}>
      <span style={{ fontFamily: FONT.grotesk, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: T.teal, flexShrink: 0, paddingTop: 2 }}>Goal</span>
      <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 13, lineHeight: 1.5, color: T.ink, opacity: 0.82, margin: 0 }}>{goal}</p>
    </div>
  );
}

function TipsBlock({ tips, acc }: { tips: string; acc: string }) {
  return (
    <div style={{ margin: "0 0 16px", padding: "10px 14px", borderRadius: 8, backgroundColor: T.card, border: `1px solid ${T.border}`, borderLeft: `3px solid ${acc}` }}>
      <p style={{ fontFamily: FONT.grotesk, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: acc, margin: "0 0 5px" }}>Tips</p>
      <p style={{ fontFamily: FONT.dm, fontSize: 13, lineHeight: 1.55, color: T.ink, opacity: 0.82, margin: 0 }}>{tips}</p>
    </div>
  );
}
