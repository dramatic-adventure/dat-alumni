// components/drama/DramaClubSupportSection.tsx
"use client";

import Link from "next/link";
import { DATButtonLink } from "@/components/ui/DATButton";

type DramaClubSupportSectionProps = {
  sponsorHref?: string;
  artistsHref?: string;
  contactHref?: string;
};

export default function DramaClubSupportSection({
  sponsorHref = "/sponsor/drama-club",
  artistsHref = "/alumni",
  contactHref = "/contact",
}: DramaClubSupportSectionProps) {
  return (
    <section className="dc-support-section">
      <div className="dc-support-inner">
        <p className="dc-support-eyebrow">SUPPORTING DRAMA CLUBS</p>

        <h2 className="dc-support-heading">Stand with a Drama Club.</h2>

        <div className="dc-support-body">
          <p>
            Your support keeps rehearsal rooms open, puts scripts in young
            hands, supports local mentors, and helps young artists stay with the
            work long after a single workshop ends. Standing with one Drama Club
            means standing with a whole web of young people, families, and local
            artists shaping their own stories.
          </p>

          <p>
            Whether you’re an alum, a donor, a partner, or a foundation, we can
            help you connect your support to a specific community or cause—from
            Indigenous sovereignty in the Amazon to youth empowerment in Central
            Europe. Tell us where your heart pulls you, and we’ll help you make
            that connection real.
          </p>
        </div>

        <div className="dc-support-cta-row">
          <DATButtonLink
            href={sponsorHref}
            size="lg"
            variant="yellow"
            className="dc-support-primary"
          >
            Sponsor a Drama Club
          </DATButtonLink>

          <DATButtonLink
  href={artistsHref}
  variant="ink"     // ✅ uses a known Variant
  size="sm"
  className="dc-support-secondary"
>
  See the artists behind this work
</DATButtonLink>
        </div>

        <div className="dc-support-inline-link">
          <Link href={contactHref} className="dc-support-link">
            Start a conversation<span aria-hidden="true"> →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
