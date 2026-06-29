// components/field-kit/ImpersonationBanner.tsx
//
// Admin-only preview banner. Rendered when getFieldKitAccess returns
// impersonating:true (admin viewing the kit as a roster member via ?asId=…), so
// it's obvious you're not looking at your own kit. Markup-only; no client JS.

import { T, FONT } from "@/components/field-kit/tokens";

export default function ImpersonationBanner({ slug }: { slug: string }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: T.yellow,
        color: T.black,
        fontFamily: FONT.grotesk,
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        textAlign: "center",
        padding: "6px 12px",
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      Viewing as {slug} — admin preview
    </div>
  );
}
