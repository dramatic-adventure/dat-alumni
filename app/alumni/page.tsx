import AlumniPage from "@/components/alumni/AlumniPage";
import { getFeaturedAlumni } from "@/lib/featuredAlumni";

export default async function Alumni() {
  const { highlights } = await getFeaturedAlumni(); // ✅ Only highlights now
  return <AlumniPage highlights={highlights} />;
}
