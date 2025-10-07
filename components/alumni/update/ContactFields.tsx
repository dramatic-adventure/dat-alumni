"use client";
import FieldRenderer from "@/components/alumni/FieldRenderer";
import type { AlumniProfile } from "@/schemas";
import type { FieldDef } from "@/components/alumni/fields"; // adjust if different

export default function ContactFields({
  value, onChange, fields,
}: { value: AlumniProfile; onChange: (next: AlumniProfile) => void; fields: FieldDef[]; }) {
  return (
    <>
      <FieldRenderer value={value} onChange={onChange} fields={fields} />
      <p className="text-xs text-gray-500 mt-2">
        For Instagram/X/TikTok/Threads/Bluesky you can paste a profile URL or @handle — we’ll store @handle.
      </p>
    </>
  );
}
