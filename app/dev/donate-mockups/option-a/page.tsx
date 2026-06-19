// MOCKUP ONLY — /dev/donate-mockups/option-a (safe to delete)
import { Suspense } from "react";
import OptionA from "./OptionA";

export default function OptionAPage() {
  return (
    <Suspense fallback={null}>
      <OptionA />
    </Suspense>
  );
}
