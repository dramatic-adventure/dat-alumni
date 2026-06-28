// components/alumni/CurrentUpdateNote.tsx
//
// The alum's current one-line update, rendered in a hand-written face (Rock Salt)
// just under the location in the hero. Styled as a confident personal note: DAT
// purple, scaled up, and tilted a couple degrees like it was jotted in the margin.
// When a link exists it's clickable and shifts to DAT pink on hover/focus
// (purple is the resting color, so hover needs a different cue). Blank → renders nothing.

"use client";

interface Props {
  /** Update one-liner. Already expiry-filtered upstream; blank = render nothing. */
  text?: string;
  /** Optional URL (tickets, press, project page). Only linked when it's http(s). */
  link?: string;
  /** Font size for the note (varies between desktop / mobile heroes). */
  size?: string;
  /** Text alignment — desktop hero is left-aligned, mobile hero is centered. */
  align?: "left" | "center";
}

const STYLES = `
  .cu-note-link {
    color: #6C00AF;
    text-decoration: none;
    transition: color 140ms ease;
    cursor: pointer;
  }
  .cu-note-link:hover,
  .cu-note-link:focus-visible {
    color: #F23359;
  }
`;

function isSafeExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

export default function CurrentUpdateNote({ text, link, size = "1.6rem", align = "left" }: Props) {
  const safe = (text || "").trim();
  if (!safe) return null;

  const href = (link || "").trim();
  const linked = href && isSafeExternalUrl(href);

  const noteStyle: React.CSSProperties = {
    fontFamily: "var(--font-rock-salt), cursive",
    fontSize: size,
    lineHeight: 1.5,
    fontWeight: 400,
    color: "#6C00AF", // DAT purple (hover shifts to pink for linked updates)
    margin: align === "center" ? "0 auto" : 0,
    maxWidth: "48ch",
    textAlign: align,
    display: "block",
    transform: "rotate(-2deg)",
    transformOrigin: align === "center" ? "center" : "left center",
  };

  return (
    <div>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      {linked ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="cu-note-link"
          style={noteStyle}
        >
          {safe}
        </a>
      ) : (
        <p style={noteStyle}>{safe}</p>
      )}
    </div>
  );
}
