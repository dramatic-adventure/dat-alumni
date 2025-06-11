// components/alumni/AlumniMapPreview.tsx

"use client";

export default function AlumniMapPreview({
  locations,
}: {
  locations: { lat: number; lng: number; label?: string }[];
}) {
  return (
    <div className="bg-gray-100 p-4 rounded">
      <p>Map placeholder: {locations.length} pins</p>
    </div>
  );
}
