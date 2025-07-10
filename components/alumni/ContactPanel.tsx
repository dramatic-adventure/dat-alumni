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
  return (
    <div
      className="text-sm space-y-2 text-black"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {email && (
        <div>
          <a href={`mailto:${email}`} className="text-blue-600 underline">
            {email}
          </a>
        </div>
      )}
      {website && (
        <div>
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {website}
          </a>
        </div>
      )}
      {socials.length > 0 && (
        <ul className="ml-0 space-y-1 list-none">
          {socials.map((social, i) => (
            <li key={i}>
              <a
                href={social}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {social}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
