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
    "text-xs", // helpful for badges and fine print

    // ✅ Add grid-related classes here:
    "aspect-[2/3]",
    "aspect-[16/10]",
    "group-hover:ring-4",
    "ring-[#F23359]",
    "aspect-[16/10]",
    "grid",
    "grid-cols-1",
    "sm:grid-cols-2",
    "lg:grid-cols-3",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Semantic font names
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        grotesk: ['var(--font-space-grotesk)', 'sans-serif'],
        display: ['var(--font-anton)', 'sans-serif'],
        heading: ['var(--font-gloucester)', 'Gloucester', 'serif'],
        handwriting: ['var(--font-rock-salt)', 'cursive'],

        // Legacy aliases (still useful)
        anton: ['var(--font-anton)', 'sans-serif'],
        gloucester: ['var(--font-gloucester)', 'Gloucester', 'serif'],
        rock: ['var(--font-rock-salt)', 'cursive'],
      },
      colors: {
        white: "#ffffff",
        'dat-yellow': '#FFCC00',
        'dat-pink': '#FF4470',
      },
      screens: {
        xs: "400px",
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
  ],
};
