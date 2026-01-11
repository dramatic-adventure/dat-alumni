import * as React from "react";
import { COUNT_PILL_WRAP, COUNT_PILL_TAG, COUNT_PILL_TEXT } from "./sponsorshipStyles";

export function CountPill({ tag, text }: { tag: string; text: string }) {
  return (
    <span className={COUNT_PILL_WRAP}>
      <span className={COUNT_PILL_TAG}>{tag}</span>
      <span className={COUNT_PILL_TEXT}>{text}</span>
    </span>
  );
}
