// app/internships/page.tsx
import type { Metadata } from "next";
import { loadOpportunities } from "@/lib/loadOpportunities";
import PlxProgramPage, { type PlxProgramCopy } from "@/components/plx/PlxProgramPage";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Global Internships — PLX · Dramatic Adventure Theatre",
  description:
    "DAT's Global Internship — a 12-week paid intro to arts admin and production for students and recent graduates. Stipend + travel grant included.",
  openGraph: {
    title: "Global Internships — PLX · DAT",
    description:
      "DAT's Global Internship — a 12-week paid intro to arts admin and production. Stipend + travel grant included.",
    images: ["/images/opportunities/PLX-hero.jpg"],
  },
};

const COPY: PlxProgramCopy = {
  programLabel: "Global Internship",
  heroImage: "/images/opportunities/PLX-hero.jpg",
  eyebrow: "Global Internships",
  headlineLine1: "Build it.",
  headlineLine2: "Tour it. Tell it.",
  pitch:
    "An introduction to arts administration and production for students and recent grads. Twelve weeks. Real projects. Real mentorship. Real stipend.",
  hookQuestion:
    "Are you a student who aspires to build, lead, or support an innovative arts organization?",
  introTitle: "An intro to running a global arts org.",
  introBody:
    "Build a connection with DAT's global team while getting hands-on experience in the arts, theatre, eco-travel, and social impact spaces. We carefully select a small cohort of interns each season — curious students and recent grads who want to see what running a global theatre company actually looks like, and who want to put their hands on it.",
  compensationBullets: [
    { head: "Stipend", tail: "$1,800 USD across the 12-week program." },
    { head: "Travel grant", tail: "$1,200 USD applied to an optional ACTion expedition." },
    { head: "Academic credit", tail: "Available — email info@dramaticadventure.com to coordinate with your university." },
    { head: "Free event tickets", tail: "DAT performances, festivals, and community nights worldwide." },
  ],
  whoYouAre: [
    { head: "You are an ambitious go-getter.", tail: "You finish what you start." },
    { head: "You take pride in what you do.", tail: "Craft matters to you." },
    { head: "You are inspired.", tail: "Something pulled you here — we want to hear what." },
    { head: "You are scrappy and entrepreneurial.", tail: "You make do, then make better." },
    { head: "You are action oriented.", tail: "You turn ideas into outcomes." },
    { head: "You enjoy your work.", tail: "You find yourself tinkering at strange hours." },
    { head: "You are a good soul.", tail: "Generous, kind, and listening." },
  ],
  requirements: [
    "18 years or older",
    "Able to commit to the 12-week program plus orientation weekend",
    "Optional 4–6 week ACTion expedition abroad",
    "Strong desire to learn within at least one DAT department (Producing, Development, Marketing, or Programs)",
    "Reliable internet and a quiet space for video calls",
  ],
  timeline: [
    { label: "Application Deadline", detail: "August 15 — apply by then to be considered for the fall cohort." },
    { label: "Orientation Weekend", detail: "Early September, fully remote." },
    { label: "Remote Work", detail: "12 weeks of part-time (10 hrs/wk) project work with weekly mentorship." },
    { label: "Team Project", detail: "Collaborate with fellow interns on a small cohort project." },
    { label: "Optional ACTion Expedition", detail: "4–6 weeks in-the-field abroad, spring of the following year." },
  ],
  closingLine: "Take the first step of an incredible journey with DAT.",
  faq: [
    { q: "Do I need to be a theatre major?", a: "Nope. We've placed econ majors in Development and computer science majors in Production. We care about how you think, not what's on your transcript." },
    { q: "Is this remote-only?", a: "The core 12 weeks are remote. The ACTion expedition (optional but encouraged) is in-the-field — we've gone to Tanzania, Ecuador, Slovakia, and Czechia in recent seasons." },
    { q: "Can I do this for academic credit?", a: "Yes — email info@dramaticadventure.com and we'll work with your university." },
    { q: "What if I miss the deadline?", a: "Apply for the next cohort. We run PLX twice a year." },
  ],
  crossLink: { href: "/apprenticeships", label: "Apprenticeships" },
  contactEmail: "info@dramaticadventure.com",
  accent: "#FFCC00",
};

export default async function InternshipsPage() {
  const all = await loadOpportunities();
  const opp = all.find((o) => o.plxProgram === "internship");
  return <PlxProgramPage copy={COPY} opp={opp} />;
}
