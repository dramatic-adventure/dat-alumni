// components/field-kit/ContactsCompanion.tsx
//
// EMERGENCY & CONTACTS (Slice 7) — the who-to-reach card. Server component:
// renders props only. Data rides the itinerary payload (lib/contacts.ts →
// lib/loadProgram.ts), so after one visit the page + data are offline-capable —
// which is the whole point of an emergency card.
//
// Rendering principles: rows group by section in canonical order; phone renders
// tap-to-call (tel:), email renders mailto:, `link` renders an external anchor
// (WhatsApp invites). Cells that are blank simply don't render — no empty shells.

import { T, FONT } from "@/components/field-kit/tokens";
import type { FieldContact, FieldContactSection } from "@/lib/programItinerary";

const SECTION_COPY: Record<FieldContactSection, { label: string; color: string; blurb?: string }> = {
  emergency: {
    label: "Emergency",
    color: T.pink,
    blurb: "Dial 112 anywhere in Slovakia or Austria — it is the “911” for fire, medical, and police.",
  },
  "ground-control": {
    label: "Ground Control",
    color: T.yellow,
    blurb: "Your emergency contacts’ go-to for questions or emergencies — make sure they have this number.",
  },
  staff: { label: "Field Staff", color: T.teal },
  artists: { label: "Traveling Artists", color: T.purple },
  whatsapp: {
    label: "WhatsApp",
    color: T.grape,
    blurb: "On-the-ground communication happens here — join before you fly.",
  },
  other: { label: "More", color: T.muted },
};

const SECTION_ORDER: FieldContactSection[] = [
  "emergency", "ground-control", "staff", "artists", "whatsapp", "other",
];

/** tel: href from a human phone cell; first number wins when cells hold two. */
function telHref(phone: string): string {
  return `tel:${phone.split("/")[0].replace(/[^+\d]/g, "")}`;
}

export default function ContactsCompanion({
  contacts,
  programLabel,
}: {
  contacts: FieldContact[];
  programLabel: string;
}) {
  const sections = SECTION_ORDER.map((s) => ({
    section: s,
    rows: contacts.filter((c) => c.section === s),
  })).filter((s) => s.rows.length > 0);

  return (
    <div style={{ padding: "32px clamp(14px, 4vw, 56px) 40px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <p style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: T.teal, margin: "0 0 10px" }}>
          {programLabel}
        </p>
        <h1 style={{ fontFamily: FONT.anton, fontSize: "clamp(34px, 6.5vw, 60px)", lineHeight: 0.92, textTransform: "uppercase", color: T.ink, margin: "0 0 14px" }}>
          Emergency<br />&amp; contacts.
        </h1>
        <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 14, lineHeight: 1.5, color: T.ink, opacity: 0.78, margin: "0 0 28px", maxWidth: "52ch" }}>
          Save these before you fly. This page works offline after your first visit — the moment you
          need it is the moment you may have no signal.
        </p>

        {sections.map(({ section, rows }) => (
          <ContactSection key={section} section={section} rows={rows} />
        ))}
      </div>
    </div>
  );
}

function ContactSection({ section, rows }: { section: FieldContactSection; rows: FieldContact[] }) {
  const copy = SECTION_COPY[section];
  return (
    <section style={{ marginBottom: 26 }}>
      <h2 style={{ fontFamily: FONT.grotesk, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: copy.color, margin: "0 0 4px" }}>
        {copy.label}
      </h2>
      {copy.blurb && (
        <p style={{ fontFamily: FONT.dm, fontSize: 12, lineHeight: 1.5, color: T.muted, margin: "0 0 10px" }}>{copy.blurb}</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: copy.blurb ? 0 : 10 }}>
        {rows.map((c) => (
          <ContactRow key={c.id} contact={c} color={copy.color} />
        ))}
      </div>
    </section>
  );
}

function ContactRow({ contact: c, color }: { contact: FieldContact; color: string }) {
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${T.border}`, backgroundColor: T.card, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: c.role ? 2 : 4 }}>
        <span style={{ fontFamily: FONT.dm, fontWeight: 700, fontSize: 14.5, color: T.ink }}>{c.label}</span>
        {c.role && (
          <span style={{ fontFamily: FONT.grotesk, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color }}>
            {c.role}
          </span>
        )}
      </div>
      {(c.phone || c.email || c.link) && (
        <p style={{ fontFamily: FONT.dm, fontSize: 13, lineHeight: 1.7, margin: 0, display: "flex", flexWrap: "wrap", gap: "2px 16px" }}>
          {c.phone && (
            <a href={telHref(c.phone)} style={contactLink}>
              ☎ {c.phone}
            </a>
          )}
          {c.email && (
            <a href={`mailto:${c.email}`} style={contactLink}>
              ✉ {c.email}
            </a>
          )}
          {c.link && (
            <a href={c.link} target="_blank" rel="noopener noreferrer" style={contactLink}>
              ↗ {c.section === "whatsapp" ? "Join the group" : c.link}
            </a>
          )}
        </p>
      )}
      {c.note && (
        <p style={{ fontFamily: FONT.dm, fontSize: 11.5, lineHeight: 1.5, color: T.muted, margin: "4px 0 0" }}>{c.note}</p>
      )}
    </div>
  );
}

const contactLink: React.CSSProperties = {
  fontFamily: FONT.dm,
  color: T.teal,
  textDecoration: "none",
  borderBottom: `1px solid ${T.teal}44`,
};
