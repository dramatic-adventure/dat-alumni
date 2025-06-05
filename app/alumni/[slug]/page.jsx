// app/alumni/[slug]/page.jsx
import { loadRows } from '../../../lib/loadRows';
import { notFound } from 'next/navigation';

export default async function AlumniProfilePage({ params }) {
  const slug = params.slug;
  const rows = await loadRows();
const record = rows.find(r => r.slug === slug);
if (!record) return notFound();


  if (!record) {
    return <NotFound />;
  }

  return (
    <main className="prose mx-auto p-4">
      <h1>{record.name}</h1>

      {/* ← Here is where you drop in your real image URL */}
      <img
        src="https://images.squarespace-cdn.com/content/v1/6022114419b886404b1030fa/1688754861007-4RUX9L53DLN1CLZL8XTT/118156207_10223731886945103_6433242048186063002_n.jpg?format=300w"
        alt={`${record.name} headshot`}
        width={300}
        height={300}
        className="rounded-full"
      />

      {/* ...other profile fields */}
      <p>{record.bio}</p>
      {/* etc. */}
    </main>
  );
}
