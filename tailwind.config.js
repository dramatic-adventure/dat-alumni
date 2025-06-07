/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    // 👇 ADD a safelist for font-gloucester to force Tailwind to always output it:
  ],
  safelist: ["font-gloucester", "font-grotesk"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        anton: ['var(--font-anton)', 'sans-serif'],
        grotesk: ['var(--font-space-grotesk)', 'sans-serif'],
        gloucester: ['var(--font-gloucester)', 'Gloucester', 'serif'],
        rock: ['var(--font-rock-salt)', 'cursive'],
      },
      screens: {
        xs: "400px",
      },
      colors: {
        'dat-yellow': '#FFCC00',
        'dat-pink': '#FF4470',
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
