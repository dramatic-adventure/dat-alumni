// This file combines and standardizes the DAT Spotlight and Alumni Highlight panels.
// Styling, color, and label logic are shared, while visual distinction is preserved.
// Future migration could merge both into one carousel with per-item styling.

export { default as SpotlightPanel } from "@/components/alumni/SpotlightPanel";
export type { SpotlightUpdate } from "@/components/alumni/SpotlightPanel";

export { default as HighlightPanel } from "@/components/alumni/HighlightPanel";
export type { HighlightCard } from "@/components/alumni/HighlightPanel";

// 🟣 SpotlightPanel.tsx
// - DAT-controlled entries (style: purple background, yellow accents)
// - Uses: `SpotlightUpdate[]`
// - Features a title chip: "DAT Spotlight"
// - Prominent serif-style quote block (Rock Salt)

// 🟤 HighlightPanel.tsx
// - Artist-submitted entries (style: kraft background, dark purple text)
// - Uses: `HighlightCard[]`
// - Label: "Highlight"
// - Slightly different styling (wider max width, more relaxed layout)

// 📦 Shared dependencies:
// - ThumbnailMedia (for image or video thumbnail)
// - Lightbox (click-to-expand media viewer)
// - useSwipeable (carousel nav)

// ✅ Logic to maintain in both:
// - sort evergreen → recent
// - archive toggle ("see all highlights")
// - carousel dots
// - conditional CTA
// - hide if empty

// ⏭️ Next: We’ll unify promo + journey entries similarly.
// Then build parser logic: normalizeSpotlightRows() and normalizeHighlightRows()
