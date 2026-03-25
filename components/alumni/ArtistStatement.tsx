// components/alumni/ArtistStatement.tsx

export default function ArtistStatement({ statement }: { statement: string }) {
  return (
    <blockquote className="italic border-l-4 pl-4 border-pink-500">
      {statement}
    </blockquote>
  );
}
