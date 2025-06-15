// components/alumni/StatusFlags.tsx

const flagStyles: Record<string, string> = {
  "Founding Member": "#FFD700",
  "Staff": "#000000",
  "Board Member": "#FFCC00",
  "Artist-in-Residence": "#6C00AF",
  "Fellow": "#F25C4D",
  "Intern": "#2AB0A7",
  "Volunteer": "#4DAA57",
};

const icons: Record<string, string> = {
  "Founding Member": "⭐",
  "Staff": "💼",
  "Board Member": "🛡️",
  "Artist-in-Residence": "🏠",
  "Fellow": "🎓",
  "Intern": "🌱",
  "Volunteer": "🤝",
};

export default function StatusFlags({ flags }: { flags: string[] }) {
  return (
    <div className="flex flex-wrap gap-2 justify-end">
      {flags.map((flag) => (
        <div
          key={flag}
          className="w-7 h-7 md:w-6 md:h-6 rounded-sm flex items-center justify-center text-white text-sm font-bold shadow-md"
          style={{
            backgroundColor: flagStyles[flag] || "#999",
          }}
          title={flag}
        >
          {icons[flag] || "🏅"}
        </div>
      ))}
    </div>
  );
}