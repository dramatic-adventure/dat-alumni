// components/alumni/FieldNotes.tsx

export default function FieldNotes({ notes }: { notes: string[] }) {
  return (
    <ul className="list-disc ml-5 space-y-1">
      {notes.map((note, idx) => (
        <li key={idx}>{note}</li>
      ))}
    </ul>
  );
}
