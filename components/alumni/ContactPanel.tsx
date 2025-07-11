// components/alumni/ContactPanel.tsx

interface ContactPanelProps {
  email?: string;
  website?: string;
  socials?: string[];
}

export default function ContactPanel({
  email,
  website,
  socials = [],
}: ContactPanelProps) {
  const linkClasses =
    "block text-black transition-all duration-200 no-underline hover:tracking-[0.025em] hover:text-[#6C00AF] visited:text-black";

  const linkStyle = {
    textDecoration: "none",
    marginBottom: "0.4rem",
    fontWeight: 600 as const,
  };

  return (
    <div
      className="text-sm"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        wordBreak: "break-word",
        width: "100%",
      }}
    >
      {email && (
        <a href={`mailto:${email}`} className={linkClasses} style={linkStyle}>
          {email}
        </a>
      )}

      {website && (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClasses}
          style={linkStyle}
        >
          {website}
        </a>
      )}

      {socials.map((social, i) => (
        <a
          key={i}
          href={social}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClasses}
          style={linkStyle}
        >
          {social}
        </a>
      ))}
    </div>
  );
}
