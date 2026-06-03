import { redirect } from "next/navigation";

export default function PerformancesPage() {
  redirect("/events?cat=performance");
}
