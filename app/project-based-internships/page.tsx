// app/project-based-internships/page.tsx
import type { Metadata } from "next";
import { loadOpportunities } from "@/lib/loadOpportunities";
import PlxProgramPage, { type PlxProgramCopy } from "@/components/plx/PlxProgramPage";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Project-Based Internship — PLX · Dramatic Adventure Theatre",
  description:
    "DAT's Project-Based Internship — a few weeks embedded in a single production or expedition. Fee-based, credit-bearing, and built for conservatory students and emerging artists ready for a real production credit.",
  openGraph: {
    title: "Project-Based Internship — PLX · DAT",
    description:
      "A few weeks embedded in one DAT production or expedition. Fee-based, credit-bearing — pick a track, get a real production credit.",
    images: ["/images/opportunities/team-adventure.jpg"],
  },
};

const COPY: PlxProgramCopy = {
  programLabel: "Project-Based Internship",
  heroImage: "/images/opportunities/team-adventure.jpg",
  eyebrow: "Project-Based Internship",
  headlineLine1: "Get in the room.",
  headlineLine2: "Earn the credit.",
  pitch:
    "A few weeks, embedded in one real DAT production or expedition. Pick a track, work alongside the team that's making it, and walk away with a production credit and academic credit. Your entry point into the PLX ladder.",
  hookQuestion:
    "Want hands-on production experience without committing a whole season — and academic credit while you're at it?",
  introTitle: "Opportunities you take, not ones you have to invent.",
  introBody:
    "The Internship is the entry rung of PLX. Instead of pitching us a project, you step into one already in motion — a production we're mounting, an expedition we're running — and take a defined role on the team. You choose a track tied to a real DAT department, you're paired with a working supervisor, and you leave with concrete deliverables for your portfolio, a production credit, and academic credit toward your degree. It's short, it's structured, and it's built for students and emerging artists who learn fastest by doing the real thing.",
  // Reused as the fixed menu of internship tracks (see PlxProgramPage overrides).
  whoYouAreEyebrow: "Pick your lane",
  whoYouAreTitle: "Choose an internship track.",
  whoYouAre: [
    {
      head: "Production / Stage Management",
      tail: "Shadow and assist the SM team — calling, paperwork, run sheets, and backstage logistics on a live production.",
    },
    {
      head: "Dramaturgy & Research",
      tail: "Support a dramaturg with source research, packets, and program notes that shape the work in the room.",
    },
    {
      head: "Community Engagement & Teaching",
      tail: "Help design and run workshops and partner sessions alongside our teaching artists in the field.",
    },
    {
      head: "Company & Tour Management",
      tail: "Work with company management on travel, scheduling, and the day-to-day logistics of a touring ensemble.",
    },
    {
      head: "Documentation",
      tail: "Capture the process — photo, video, written reflection — and build the archive of a single production or expedition.",
    },
    {
      head: "Devising Ensemble",
      tail: "Join the room as an ensemble member, devising and performing under the direction of DAT's artistic team.",
    },
  ],
  // Cost & credit, not stipend — overrides the template's paid-program defaults.
  compensationEyebrow: "Cost & Credit",
  compensationHeading: "Participation fee + academic credit",
  compensationBullets: [
    { head: "Participation fee", tail: "A program fee covers your supervised placement, materials, and onsite support. See the live listing for the current amount." },
    { head: "Academic credit", tail: "Structured to earn credit at your institution — we coordinate the learning agreement with your faculty sponsor." },
    { head: "A working supervisor", tail: "Every track is paired with a DAT department lead who mentors you and signs off on your outcomes." },
    { head: "Portfolio + production credit", tail: "Leave with real deliverables, a named credit on the production or expedition, and a reference." },
  ],
  requirements: [
    "18 years or older",
    "Enrolled student or emerging artist (conservatory, BFA/MFA, or early-career)",
    "Available for the full run of one production or expedition (a few weeks)",
    "Able to coordinate academic credit with your home institution, if pursuing it",
    "Genuine interest in the chosen track — this is hands-on, in-the-room work",
  ],
  timeline: [
    { label: "Choose a Track", detail: "Apply to the track tied to the department you want experience in." },
    { label: "Match & Learning Agreement", detail: "We pair you with a supervisor and, if you're earning credit, set the agreement with your school." },
    { label: "Onboarding", detail: "A short orientation to the production or expedition you're joining." },
    { label: "Embedded Weeks", detail: "A few weeks working the role alongside the DAT team on a real project." },
    { label: "Showcase & Wrap", detail: "Finish your deliverables, receive your credit and reference, and step toward the Apprenticeship." },
  ],
  closingLine: "Take your first real production credit with DAT.",
  faq: [
    { q: "How is this different from the Apprenticeship?", a: "The Internship is the entry rung — a few weeks embedded in one production or expedition, fee-based and credit-bearing. The Apprenticeship is a paid 12-week introduction to running the organization. Many interns go on to apply for it." },
    { q: "Is this paid?", a: "No — the Internship is fee-based and credit-bearing, not paid. The participation fee covers your supervised placement and support. The paid programs in PLX are the Apprenticeship and the Fellowship." },
    { q: "Can I really earn academic credit?", a: "Yes — that's a core feature. We coordinate a learning agreement with your faculty sponsor so the experience counts toward your degree." },
    { q: "Do I have to be a theatre major?", a: "No. We work with conservatory students and emerging artists across disciplines. Pick the track that fits the experience you're after." },
    { q: "What do I leave with?", a: "A production or expedition credit, concrete portfolio deliverables, a reference from your supervisor, and a foot in DAT's global network." },
  ],
  crossLink: { href: "/apprenticeships", label: "Next: Apprenticeship" },
  contactEmail: "info@dramaticadventure.com",
  accent: "#0FB5A8",
};

export default async function ProjectBasedInternshipsPage() {
  const all = await loadOpportunities();
  // TODO: live listing comes from a Google Sheet row with plx_program = "internship"
  // and learn_more_url = "/project-based-internships". Until that row is added, no
  // match is found and the page renders its "applications closed / get notified"
  // state, which is expected.
  const opp = all.find((o) => o.plxProgram === "internship");
  return <PlxProgramPage copy={COPY} opp={opp} />;
}
