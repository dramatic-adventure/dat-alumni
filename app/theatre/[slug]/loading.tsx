// app/theatre/[slug]/loading.tsx
//
// Route-level Suspense fallback: paints a branded skeleton instantly on soft
// navigation while the server blocks on data. Shapes live in
// components/ui/PageSkeleton.tsx; pairs with the global RouteProgressBar.
import { DetailPageSkeleton } from "@/components/ui/PageSkeleton";

export default function Loading() {
  return <DetailPageSkeleton label="Loading production…" />;
}
