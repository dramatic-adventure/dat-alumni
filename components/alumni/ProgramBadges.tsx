// components/alumni/ProgramStamps.tsx

export default function ProgramStamps({ badges }: { badges: string[] }) {
  return (
    <>
      {badges.map((badge, i) => (
        <span
          key={i}
          className="px-4 py-1 text-sm md:text-xs rounded-full border border-white bg-[#241123]/80 text-white font-medium whitespace-nowrap"
        >
          {badge}
        </span>
      ))}
    </>
  );
}