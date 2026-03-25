"use client";

import Link from "next/link";

type UpcomingShow = {
  /** e.g. "Opening Night – 7PM" or "Final performance" */
  note?: string;
  ticketsUrl?: string;
  status?: "on-sale" | "sold-out" | "limited";
};

type NowPlaying = {
  title: string;
  slug: string;
};

export interface ShowtimesPanelProps {
  productionTitle: string;
  upcomingShows?: UpcomingShow[];
  notifyMeUrl?: string;
  donateLink?: string;
  nowPlaying?: NowPlaying[];
}

const statusLabel: Record<NonNullable<UpcomingShow["status"]>, string> = {
  "on-sale": "On Sale",
  "sold-out": "Sold Out",
  limited: "Limited",
};

export default function ShowtimesPanel({
  productionTitle,
  upcomingShows,
  notifyMeUrl,
  donateLink,
  nowPlaying,
}: ShowtimesPanelProps) {
  const hasUpcoming =
    Array.isArray(upcomingShows) &&
    upcomingShows.some((s) => !!s && !!s.ticketsUrl);

  const hasNowPlaying =
    !hasUpcoming &&
    Array.isArray(nowPlaying) &&
    nowPlaying.length > 0;

  const showSponsor = !!donateLink;
  const showNotify = !!notifyMeUrl;

  return (
    <section aria-labelledby="tickets-heading" className="st-root">
      <h2 id="tickets-heading" className="st-eyebrow">
        Tickets &amp; Updates
      </h2>

      {hasUpcoming ? (
        <>
          <p className="st-copy">
            This production has upcoming performances. Claim your seats below.
          </p>

          <div className="st-list">
            {upcomingShows!
              .filter((s) => s && (s.ticketsUrl || s.note || s.status))
              .map((s, idx) => {
                const label = s.note || `Upcoming performance ${idx + 1}`;
                const status = s.status ? statusLabel[s.status] : null;

                return (
                  <div key={idx} className="st-row">
                    <div className="st-row-text">
                      <span className="st-row-label">{label}</span>
                      {status && (
                        <span
                          className={`st-badge ${
                            s.status === "sold-out"
                              ? "st-badge-sold"
                              : s.status === "limited"
                              ? "st-badge-limited"
                              : "st-badge-onsale"
                          }`}
                        >
                          {status}
                        </span>
                      )}
                    </div>

                    {s.ticketsUrl && (
                      <Link href={s.ticketsUrl} className="st-btn-primary">
                        Purchase Tickets
                      </Link>
                    )}
                  </div>
                );
              })}
          </div>

          {showNotify && (
            <Link href={notifyMeUrl!} className="st-link">
              Get updates on future runs
            </Link>
          )}

          {showSponsor && (
            <div className="st-secondary">
              <Link href={donateLink!} className="st-link-underline">
                Sponsor the Story
              </Link>
              <p className="st-secondary-copy">
                Help bring productions like this to life.
              </p>
            </div>
          )}
        </>
      ) : hasNowPlaying ? (
        <>
          <p className="st-copy">
            This run has closed, but DAT has other stories on stage.
          </p>

          <ul className="st-now-list">
            {nowPlaying!.map((show) => (
              <li key={show.slug} className="st-now-item">
                <span className="st-now-label">Now Playing:</span>{" "}
                <Link href={`/theatre/${show.slug}`} className="st-now-link">
                  {show.title}
                </Link>
              </li>
            ))}
          </ul>

          {showNotify && (
            <Link href={notifyMeUrl!} className="st-link">
              Get updates on {productionTitle}
            </Link>
          )}

          {showSponsor && (
            <div className="st-secondary">
              <Link href={donateLink!} className="st-link-underline">
                Sponsor the Story
              </Link>
              <p className="st-secondary-copy">
                Help bring productions like this to life.
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="st-copy">
            You may have missed this run, but the story doesn&apos;t end here.
          </p>

          {showNotify && (
            <Link href={notifyMeUrl!} className="st-link">
              Get updates on future productions
            </Link>
          )}

          {showSponsor && (
            <div className="st-secondary">
              <Link href={donateLink!} className="st-link-underline">
                Sponsor the Story
              </Link>
              <p className="st-secondary-copy">
                Help bring productions like this to life.
              </p>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .st-root {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          max-width: 270px;
          padding: 0.75rem 0.9rem 0.85rem;
          border-radius: 16px;
          background: rgba(253, 250, 247, 0.94);
          box-shadow: 0 10px 28px rgba(36, 17, 35, 0.16);
        }
        /* …rest of your styles unchanged… */
      `}</style>
    </section>
  );
}
