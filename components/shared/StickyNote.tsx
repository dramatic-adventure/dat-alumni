"use client";

export interface StickyNoteItem {
  text: string;
  link?: string;
}

interface StickyNoteProps {
  title: string;
  items: StickyNoteItem[];
  linkText?: string;
  linkUrl?: string;
  customClass?: string;
  showTape?: boolean;
}

export default function StickyNote({
  title,
  items,
  linkText,
  linkUrl,
  customClass = "",
  showTape = false,
}: StickyNoteProps) {
  return (
    <div
      className={`relative bg-[#FFCC00] p-6 w-64 shadow-xl rounded-sm ${customClass}`}
      style={{
        transform: "rotate(-2deg)",
        fontFamily: "var(--font-rock-salt), cursive",
      }}
    >
      {/* Optional Tape Accent */}
      {showTape && (
        <div
          className="absolute top-[-10px] left-1/2 transform -translate-x-1/2 w-20 h-4 bg-gray-300 opacity-80 rotate-2"
          style={{
            clipPath: "polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)",
          }}
        />
      )}

      <h3 className="text-xl mb-3 leading-tight">{title}</h3>
      <ul className="space-y-2 mb-4 text-sm">
        {items.map((item, idx) => (
          <li key={idx}>
            {item.link ? (
              <a
                href={item.link}
                className="text-[#241123] hover:text-[#F23359] transition-colors no-underline"
              >
                {item.text}
              </a>
            ) : (
              item.text
            )}
          </li>
        ))}
      </ul>

      {linkText && linkUrl && (
        <a
          href={linkUrl}
          className="block text-center bg-[#241123] text-white py-2 rounded-sm text-sm font-bold hover:scale-105 transition"
          style={{ textDecoration: "none" }}
        >
          {linkText}
        </a>
      )}
    </div>
  );
}
