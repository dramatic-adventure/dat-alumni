/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    "font-gloucester",
    "font-grotesk",
    "font-anton",
    "font-rock",
    "font-heading",
    "font-display",
    "font-handwriting",
    "bg-black/70",
    "bg-black/80",
    "backdrop-blur",
    "backdrop-blur-sm",
    "text-xs",
    "aspect-[2/3]",
    "aspect-[16/10]",
    "group-hover:ring-4",
    "ring-[#F23359]",
    "grid",
    "grid-cols-1",
    "sm:grid-cols-2",
    "lg:grid-cols-3",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Semantic stacks (map to next/font/local CSS vars)
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        grotesk: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        display: ['var(--font-anton)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-gloucester)', 'serif'],
        handwriting: ['var(--font-rock-salt)', 'system-ui', 'sans-serif'],

        // Aliases (optional)
        anton: ['var(--font-anton)', 'system-ui', 'sans-serif'],
        gloucester: ['var(--font-gloucester)', 'serif'],
        rock: ['var(--font-rock-salt)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-anonymous-pro)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        serif: ['var(--font-zilla-slab)', 'serif'],
      },
      colors: {
        white: "#ffffff",
        'dat-yellow': '#FFCC00',
        'dat-pink': '#FF4470',
      },
      // Keep default Tailwind breakpoints; add your aliases
      screens: {
        mobile: { max: "767px" },   // up to <768px
        tablet: "768px",            // ≥768px (parallel to default md)
        // (leave md/lg/xl/2xl as Tailwind defaults)
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
    require("tailwind-scrollbar-hide"),
  ],
};
