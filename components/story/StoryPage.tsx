import Link from "next/link";
import ShareButton from "@/components/ShareButton";
import StoryMedia from "@/components/StoryMedia";
import { StoryRow } from "@/lib/types";

interface StoryPageProps {
  story: StoryRow;
}

export default function StoryPage({ story }: StoryPageProps) {
  const {
    slug,
    title,
    location,
    program,
    country,
    year,
    partners,
    quote,
    quoteAuthor,
    story: shortStory,
    author,
    authorSlug,
    moreInfoLink,
    imageUrl,
  } = story;

  const programLine =
  program && (country || year)
    ? `${program}: ${[country, year].filter(Boolean).join(" ")}`
    : program || [country, year].filter(Boolean).join(" ");

  const storyUrl = `https://alumni.dramaticadventure.com/story/${slug}`;

  console.log("🔗 moreInfoLink:", moreInfoLink);

  return (
    <main>
      <div className="story-page">
        {/* Top Bar: Back Link + Share */}
        <div className="flex justify-between items-center mb-4">
          <Link
  href="/"
  style={{
    fontFamily: 'var(--font-rock-salt), cursive',
    fontSize: '1.15rem',
    color: '#ff007f',
    textDecoration: 'none',
  }}
>
  ← Explore More Stories
</Link>
          <ShareButton url={storyUrl} />
        </div>

        {/* Location */}
        {location && <p className="popup-location">{location}</p>}

        {/* Title */}
        {title && <h1 className="popup-title">{title}</h1>}

        {/* Program Info */}
        {programLine && <p className="popup-program">{programLine}</p>}

        {/* Media */}
        <StoryMedia imageUrl={imageUrl} title={title} />

        {/* Partners */}
        {partners?.trim() && partners !== "-" && (
  <p className="popup-partners">
    Created in collaboration with {story.partners}, rooted in a shared vision.
  </p>
)}

        {/* Quote */}
        {quote && (
          <blockquote className="popup-quote">
            “{quote}”
            {quoteAuthor && (
              <footer className="popup-quote-author">— {quoteAuthor}</footer>
            )}
          </blockquote>
        )}

        {/* Story Body */}
        {shortStory && (
          <p className="popup-story">{shortStory}</p>
        )}

        {/* Author */}
        {author && authorSlug && (
          <p className="popup-author">
            By{" "}
            <Link href={`/alumni/${authorSlug}`}>
              {author}
            </Link>
          </p>
        )}

        {/* CTA Button (only if link exists) */}
        {moreInfoLink && (
          <a
            href={moreInfoLink}
            className="popup-button"
            target="_blank"
            rel="noopener noreferrer"
          >
            STEP INTO THE STORY
          </a>
        )}
      </div>
    </main>
  );
}
