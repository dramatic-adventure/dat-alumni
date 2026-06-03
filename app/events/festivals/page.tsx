import { redirect } from "next/navigation";

export default function FestivalsPage() {
  redirect("/events?cat=festival");
}
