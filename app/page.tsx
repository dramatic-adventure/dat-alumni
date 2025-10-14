// app/page.tsx

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--dat-color-bg)] text-white flex flex-col items-center justify-center px-6 pt-20 pb-32 text-center">
      {/* Heading */}
      <h1
        className="text-[3rem] sm:text-[4.5rem] leading-[1.1] font-[400] tracking-tight mb-6 text-[var(--dat-color-accent)]"
        style={{ fontFamily: 'var(--font-gloucester), serif' }}
      >
        DAT Alumni Stories
      </h1>

      {/* Tagline */}
      <p className="text-lg sm:text-xl max-w-xl text-white/80 mb-10">
        One story, one connection, and one adventure at a time.
      </p>

      {/* Call-to-Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/directory"
          className="uppercase bg-[var(--dat-color-accent)] text-white px-6 py-3 rounded-md text-sm tracking-widest font-bold hover:bg-[#c72b4d] transition"
        >
          Explore Directory
        </Link>

        <Link
          href="/stories/featured"
          className="uppercase border border-white text-white px-6 py-3 rounded-md text-sm tracking-widest font-bold hover:bg-white hover:text-[var(--dat-color-bg)] transition"
        >
          View Featured Stories
        </Link>
      </div>
    </main>
  );
}
