// MOCKUP ONLY — /dev/donate-mockups/option-b (safe to delete)
import { Suspense } from "react";
import OptionB from "./OptionB";

export default function OptionBPage() {
  return (
    <Suspense fallback={null}>
      <OptionB />
    </Suspense>
  );
}
