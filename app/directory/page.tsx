// app/directory/page.tsx

import Link from "next/link";
import { loadAlumni } from "@/lib/loadAlumni";
import Image from "next/image";

export default async function DirectoryPage() {
  const alumni = await loadAlumni();

  const filteredAlumni = alumni.filter(
    (alum) => alum.name || alum.role || alum.headshotUrl
  );

  return (
    <main className="min-h-screen bg-white px-8 py-20">
      <h1 className="text-4xl font-bold text-center text-[var(--dat-color-accent)] mb-12">
        Alumni Directory
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-10">
        {filteredAlumni.map((alum, index) => {
          const { name, role, headshotUrl, profileUrl } = alum;

          const content = (
            <div key={index} className="flex flex-col items-center text-center">
              {headshotUrl && (
                <div className="w-[160px] h-[200px] relative rounded-md overflow-hidden shadow-md">
                  <Image
                    src={headshotUrl}
                    alt={name || "Alum Headshot"}
                    fill
                    style={{ objectFit: "cover", objectPosition: "center" }}
                  />
                </div>
              )}
              {name && <div className="mt-3 font-semibold text-sm">{name}</div>}
              {role && (
                <div className="text-xs text-gray-600 mt-1 font-light">{role}</div>
              )}
            </div>
          );

          return profileUrl ? (
            <Link key={index} href={profileUrl}>
              {content}
            </Link>
          ) : (
            <div key={index}>{content}</div>
          );
        })}
      </div>
    </main>
  );
}
