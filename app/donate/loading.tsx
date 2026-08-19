// app/donate/loading.tsx
//
// Route-level Suspense fallback: paints a branded skeleton instantly on soft
// navigation while the server blocks on data. Shapes live in
// components/ui/PageSkeleton.tsx; pairs with the global RouteProgressBar.
import { FormPageSkeleton } from "@/components/ui/PageSkeleton";

export default function Loading() {
  return <FormPageSkeleton label="Loading donation page…" />;
}
