"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronRight, ChevronDown } from "lucide-react";

export default function Header() {
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFolder, setOpenFolder] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setHidden(currentScrollY > lastScrollY && currentScrollY > 80);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const toggleFolder = (folder: string) => {
    setOpenFolder(openFolder === folder ? null : folder);
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-transform duration-500 bg-[#241123]/95 backdrop-blur-md px-4 sm:px-8 py-3 shadow-md ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="https://dramaticadventure.com">
          <Image
            src="/images/dat-mobile-logo.png"
            alt="Dramatic Adventure Theatre"
            width={60}
            height={60}
            className="sm:hidden block"
          />
        </Link>
        <Link href="https://dramaticadventure.com">
          <Image
            src="/images/DRAMATIC_ADVENTURE_YELLOW_FINAL-1.png"
            alt="Dramatic Adventure Theatre"
            width={220}
            height={60}
            className="hidden sm:block"
            priority
          />
        </Link>

        <nav className="hidden sm:flex gap-6 items-center text-white font-semibold tracking-wide">
          <Link href="https://dramaticadventure.com/about" className="hover:underline">ABOUT</Link>
          <Link href="https://dramaticadventure.com/plays" className="hover:underline">PLAYS</Link>
          <Link href="https://dramaticadventure.com/programs" className="hover:underline">PROGRAMS</Link>
          <Link href="https://dramaticadventure.com/get-involved" className="hover:underline">GET INVOLVED</Link>
          <Link href="https://dramaticadventure.com/events" className="hover:underline">EVENTS</Link>
          <Link
            href="https://dramaticadventure.com/become-a-member"
            className="ml-4 bg-dat-pink text-black px-4 py-2 rounded-lg text-sm font-bold tracking-widest"
          >
            BECOME A MEMBER
          </Link>
        </nav>

        <button onClick={toggleMenu} className="sm:hidden text-white z-50">
          {menuOpen ? <X size={32} /> : <Menu size={32} />}
        </button>
      </div>

      {menuOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-[#6C00AF] text-white flex flex-col justify-start items-start px-8 py-12 z-40 transition-all duration-300 overflow-y-auto">
          <Image
            src="/images/dat-mobile-logo.png"
            alt="Dramatic Adventure Theatre"
            width={60}
            height={60}
            className="mb-10"
          />

          <nav className="flex flex-col gap-6 text-3xl font-grotesk w-full">
            <Link href="https://dramaticadventure.com/about" onClick={toggleMenu} className="flex justify-between w-full">ABOUT <ChevronRight /></Link>
            <Link href="https://dramaticadventure.com/plays" onClick={toggleMenu} className="flex justify-between w-full">PLAYS <ChevronRight /></Link>
            <div className="w-full">
              <button onClick={() => toggleFolder("programs")} className="flex justify-between w-full items-center">
                PROGRAMS {openFolder === "programs" ? <ChevronDown /> : <ChevronRight />}
              </button>
              {openFolder === "programs" && (
                <div className="ml-4 mt-2 flex flex-col gap-3 text-lg">
                  <Link href="/travelogue" onClick={toggleMenu}>Travelogue</Link>
                  <Link href="/action" onClick={toggleMenu}>ACTion Expeditions</Link>
                  <Link href="/site-lines" onClick={toggleMenu}>SITE-LINES Experience</Link>
                  <Link href="/residencies" onClick={toggleMenu}>Teaching Artist Residencies</Link>
                  <Link href="/global-play-initiative" onClick={toggleMenu}>Global Play Initiative</Link>
                </div>
              )}
            </div>
            <div className="w-full">
              <button onClick={() => toggleFolder("get-involved")} className="flex justify-between w-full items-center">
                GET INVOLVED {openFolder === "get-involved" ? <ChevronDown /> : <ChevronRight />}
              </button>
              {openFolder === "get-involved" && (
                <div className="ml-4 mt-2 flex flex-col gap-3 text-lg">
                  <Link href="/travel-opportunities" onClick={toggleMenu}>Travel Abroad</Link>
                  <Link href="https://dramaticadventure.com/checkout/donate?donatePageId=6125b0c5c6be590e4c5a2802" onClick={toggleMenu}>Make a Donation</Link>
                  <Link href="https://datx-apps.mn.co/landing" onClick={toggleMenu} target="_blank">Become a Member</Link>
                </div>
              )}
            </div>
            <Link href="https://dramaticadventure.com/events" onClick={toggleMenu} className="flex justify-between w-full">EVENTS <ChevronRight /></Link>
          </nav>

          <Link
            href="https://datx-apps.mn.co/landing"
            className="mt-10 bg-dat-pink text-black px-6 py-3 text-lg font-bold tracking-widest rounded-md"
            target="_blank"
            onClick={toggleMenu}
          >
            BECOME A MEMBER
          </Link>
        </div>
      )}
    </header>
  );
}
