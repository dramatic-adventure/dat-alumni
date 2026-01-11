import { redirect } from "next/navigation";

export default function DonateCancelRedirect() {
  redirect("/donate?checkout=canceled");
}
