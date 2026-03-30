// app/api/events/[id]/ics/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Returns a standards-compliant .ics file for any DatEvent.
// Works with Apple Calendar, Outlook (desktop & web), Google Calendar,
// Thunderbird, and every other calendar app that reads iCalendar (RFC 5545).
// ─────────────────────────────────────────────────────────────────────────────

import { eventById } from "@/lib/events";

const SITE_URL = "https://dramaticadventure.com";
const ORG_EMAIL = "hello@dramaticadventure.com";

type RouteProps = { params: Promise<{ id: string }> };

/** Escapes special iCalendar characters in text values. */
function icsEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Folds long lines to 75-octet limit per RFC 5545 §3.1.
 * Lines that exceed the limit are split with CRLF + a single space.
 */
function foldLine(line: string): string {
  const MAX = 75;
  if (line.length <= MAX) return line;
  const chunks: string[] = [];
  let i = 0;
  chunks.push(line.slice(0, MAX));
  i = MAX;
  while (i < line.length) {
    chunks.push(" " + line.slice(i, i + MAX - 1));
    i += MAX - 1;
  }
  return chunks.join("\r\n");
}

/** Converts "2026-08-01" → "20260801" (all-day date format). */
function toIcsDate(iso: string): string {
  return iso.replace(/-/g, "");
}

/**
 * Returns the exclusive end date for all-day iCalendar DTEND.
 * RFC 5545 §3.6.1: for DATE values DTEND is non-inclusive (day after last day).
 */
function toIcsEndDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

export async function GET(_req: Request, { params }: RouteProps) {
  const { id } = await params;
  const event = eventById(id);

  if (!event) {
    return new Response("Event not found", { status: 404 });
  }

  const location = [event.venue, event.address, event.city, event.country]
    .filter(Boolean)
    .join(", ");

  const description = [
    event.description,
    event.time ? `Time: ${event.time}` : null,
    event.doors ? `Doors: ${event.doors}` : null,
    event.ticketPrice ? `Tickets: ${event.ticketPrice}` : null,
    event.ticketUrl ? `Book: ${event.ticketUrl}` : null,
    `More info: ${SITE_URL}/events/${event.id}`,
  ]
    .filter(Boolean)
    .join("\\n");

  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z$/, "Z");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//Dramatic Adventure Theatre//Events//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Dramatic Adventure Theatre",
    "X-WR-TIMEZONE:UTC",
    "BEGIN:VEVENT",
    `UID:${event.id}@dramaticadventure.com`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${toIcsDate(event.date)}`,
    `DTEND;VALUE=DATE:${toIcsEndDate(event.endDate ?? event.date)}`,
    `SUMMARY:${icsEscape(event.title)}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${icsEscape(location)}`,
    `URL:${SITE_URL}/events/${event.id}`,
    `ORGANIZER;CN=Dramatic Adventure Theatre:mailto:${ORG_EMAIL}`,
    event.status === "cancelled" ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .map(foldLine)
    .join("\r\n");

  const filename = `${event.id}.ics`;

  return new Response(lines, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      // Prevent caching of cancelled event ICS files
      "Cache-Control": event.status === "cancelled" ? "no-store" : "public, max-age=3600",
    },
  });
}
