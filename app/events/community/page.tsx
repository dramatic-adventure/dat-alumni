import { redirect } from "next/navigation";

export default function CommunityPage() {
  redirect("/events?cat=fundraiser");
}
