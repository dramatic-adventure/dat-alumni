export const COLORS = {
  ink: "#241123",
  gold: "#ffcc00",
  mist: "#f2f2f2",
  hot: "#ff3b7a", // for the "NEW" pill vibe (tweak if needed)
};

// Low-opacity “mist” look
export const CHIP_INACTIVE =
  "bg-[rgba(242,242,242,0.14)] border border-[rgba(242,242,242,0.22)] text-[#ffcc00] " +
  "hover:bg-[rgba(242,242,242,0.22)] hover:border-[rgba(242,242,242,0.35)]";

export const CHIP_ACTIVE =
  "bg-[#ffcc00] border border-[#ffcc00] text-[#241123]";

export const CHIP_BASE =
  "inline-flex items-center justify-center rounded-full px-5 py-2 " +
  "text-xs uppercase tracking-[0.22em] transition focus:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-[#ffcc00]/50 focus-visible:ring-offset-0";

export const TOGGLE_WRAP =
  "inline-flex rounded-full bg-[#241123]/65 p-1 border border-[rgba(242,242,242,0.18)]";

export const TOGGLE_BTN =
  "rounded-full px-4 py-2 text-xs uppercase tracking-[0.22em] transition " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffcc00]/50";

export const TOGGLE_ON =
  "bg-[#ffcc00] text-[#241123]";

export const TOGGLE_OFF =
  "bg-transparent text-[#f2f2f2]/80 hover:text-[#f2f2f2]";

// Image-3 style pill: a filled gold pill + inner outlined “NEW” capsule
export const COUNT_PILL_WRAP =
  "inline-flex items-center gap-3 rounded-full bg-[#ffcc00] px-4 py-2";

export const COUNT_PILL_TAG =
  "inline-flex items-center rounded-full border-2 border-[#ff3b7a] px-3 py-1 " +
  "text-[11px] uppercase tracking-[0.24em] text-[#ff3b7a]";

export const COUNT_PILL_TEXT =
  "text-[11px] uppercase tracking-[0.24em] text-[#ff3b7a]";
