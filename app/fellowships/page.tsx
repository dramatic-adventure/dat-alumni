// app/fellowships/page.tsx
import type { Metadata } from "next";
import { loadOpportunities } from "@/lib/loadOpportunities";
import PlxProgramPage, { type PlxProgramCopy } from "@/components/plx/PlxProgramPage";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Global Fellowship — PLX · Dramatic Adventure Theatre",
  description:
    "DAT's Global Fellowship — a 10-month paid leadership development program for early-career arts administrators. Stipend + travel grant included.",
  openGraph: {
    title: "Global Fellowship — PLX · DAT",
    description:
      "DAT's Global Fellowship — a 10-month paid leadership development program for early-career arts administrators.",
    images: ["/images/opportunities/admin-collab.jpg"],
  },
};

const COPY: PlxProgramCopy = {
  programLabel: "Global Fellowship",
  heroImage: "/images/opportunities/admin-collab.jpg",
  eyebrow: "Global Fellowship",
  headlineLine1: "Lead something.",
  headlineLine2: "Make it count.",
  pitch:
    "A leadership development program for early-career arts administrators. Serve as a valued and instrumental member of the DAT staff for the season ahead.",
  hookQuestion:
    "Are you an early-career arts admin who aspires to build or lead an innovative arts organization?",
  introTitle: "Real ownership. Real mentorship. Real season.",
  introBody:
    "Through hands-on experience, mentorship, and workshops, Fellows are given the tools to become impactful leaders. We carefully select one Fellow each season — someone ready to take real ownership of real work in a global arts organization. The Fellow serves as a full member of the team, not a stand-in.",
  compensationBullets: [
    { head: "Stipend", tail: "$8,400 USD across the 10-month program." },
    { head: "Travel grant", tail: "Up to $8,000 USD toward the required ACTion expedition." },
    { head: "Two pro-dev retreats", tail: "All-expense-paid retreat weekends with staff and alumni mentors." },
    { head: "Free event tickets + alumni network", tail: "Lifetime access to DAT's global community." },
  ],
  whoYouAre: [
    { head: "You are an ambitious go-getter.", tail: "You don't wait for permission." },
    { head: "You take pride in what you do.", tail: "Craft and care define you." },
    { head: "You are inspired.", tail: "By art that does something." },
    { head: "You are scrappy and entrepreneurial.", tail: "You make resources stretch." },
    { head: "You are action oriented.", tail: "You turn ideas into outcomes." },
    { head: "You enjoy your work.", tail: "You think about it in your free time, on purpose." },
    { head: "You are a good soul.", tail: "Generous, kind, and a generous mentor." },
  ],
  requirements: [
    "21 years or older",
    "Full commitment to a 10-month program",
    "Availability for two retreat weekends (winter & summer)",
    "At least one 4–6 week ACTion expedition",
    "1–3 years of arts admin, production, or nonprofit experience preferred",
    "Reliable internet and a quiet space for video calls",
  ],
  timeline: [
    { label: "Application Deadline", detail: "August 1 — apply by then to be considered." },
    { label: "Remote Orientation", detail: "October — a 4-day orientation with the DAT team." },
    { label: "Remote Work · Fall", detail: "Part-time (20 hrs/wk) project work, October through mid-December." },
    { label: "Independent Project", detail: "Lead a focused project of your design through winter." },
    { label: "Team Project + Pro-Dev Retreat", detail: "Three-week team project followed by an in-person retreat." },
    { label: "Remote Work · Spring", detail: "Continue your portfolio through June, mentoring incoming apprentices." },
    { label: "ACTion Expedition", detail: "4–6 weeks in-the-field with the DAT ensemble." },
  ],
  closingLine: "Step into the work that will shape your career.",
  faq: [
    { q: "Is this a full-time job?", a: "No — it's a 20 hrs/wk part-time program. Most fellows do freelance or part-time work alongside it. We work with you on scheduling." },
    { q: "Is this a path to staff?", a: "Often, yes. Several current DAT staff started as Fellows. But the goal is your career, not ours." },
    { q: "When does the next cohort open?", a: "One Fellow per season. Apply by August 1 for the upcoming cohort." },
    { q: "Can international applicants apply?", a: "Yes. We've had Fellows from Ecuador, Czechia, Tanzania, and the US." },
  ],
  crossLink: { href: "/apprenticeships", label: "Apprenticeships" },
  contactEmail: "info@dramaticadventure.com",
  accent: "#F23359",
};

export default async function FellowshipsPage() {
  const all = await loadOpportunities();
  const opp = all.find((o) => o.plxProgram === "fellowship");
  return <PlxProgramPage copy={COPY} opp={opp} />;
}
