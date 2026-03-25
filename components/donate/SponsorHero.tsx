// components/donate/SponsorHero.tsx
"use client";

import Image from "next/image";

type Props = {
  heroSrc: string;
  heroAlt: string;
  headline: string;
  body: string;
};

export function SponsorHero({ heroSrc, heroAlt, headline, body }: Props) {
  return (
    <section className="donateHero" aria-label="Sponsor the Story hero">
      <div className="donateHeroFrame">
        <Image
          src={heroSrc}
          alt={heroAlt}
          fill
          priority
          sizes="100vw"
          className="donateHeroImg"
        />

        <div className="donateHeroOverlay" aria-hidden="true" />

        <div className="donateHeroStack">
          <span className="donateHeroEyebrow font-sans">
            Dramatic Adventure Theatre
          </span>

          <h1 className="donateHeroTitle font-display">{headline}</h1>

          <p className="donateHeroBody font-sans">{body}</p>
        </div>
      </div>
    </section>
  );
}
