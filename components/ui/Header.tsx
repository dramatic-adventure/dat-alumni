'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const LOGOS = {
  src: '/images/dat-mobile-logo.png',
  alt: 'Dramatic Adventure Theatre Logo',
  height: 84,
  paddingLeft: '2rem',
  paddingY: '0.25rem',
};

const COLORS = {
  background: '#241123',
  overlay: '#6C00AF',
  accent: '#F23359',
  ctaText: '#ffffff',
};

const FONT = {
  transform: 'uppercase',
  tracking: '0.05em',
};

const NAV_ITEMS = [
  {
    label: 'ABOUT',
    submenu: [
      { label: 'Our Mission & Ethos', href: '/about/mission' },
      { label: 'Meet the Team', href: '/about/team' },
      { label: 'Partners & Supporters', href: '/about/partners' },
      { label: 'Timeline & History', href: '/about/history' },
      { label: 'Financials', href: '/about/financials' },
      { label: 'Contact', href: '/about/contact' },
    ],
  },
  { label: 'STORY MAP', href: '/story-map' },
  {
    label: 'STORIES',
    submenu: [
      { label: 'This Season', href: '/stories/season' },
      { label: 'Past Productions', href: '/stories/productions' },
      { label: 'Past Projects', href: '/stories/projects' },
      { label: 'Community Impact', href: '/stories/impact' },
      { label: 'Our Artists', href: '/stories/artists' },
      { label: 'Alumni Directory', href: '/directory' },
    ],
  },
  {
    label: 'PROGRAMS',
    submenu: [
      { label: 'RAW', href: '/programs/raw' },
      { label: 'ACTion', href: '/programs/action' },
      { label: 'CASTAWAY', href: '/programs/castaway' },
      { label: 'SceneShift', href: '/programs/sceneshift' },
      { label: 'PASSAGE', href: '/programs/passage' },
      { label: 'Creative Treks', href: '/programs/treks' },
      { label: 'NYC Weekend', href: '/programs/nyc' },
      { label: 'Drama Clubs', href: '/programs/clubs' },
      { label: 'Global Play Initiative', href: '/programs/global-play' },
      { label: 'Teaching Artist Residencies', href: '/programs/residencies' },
      { label: 'Adventure Days', href: '/programs/adventure-days' },
      { label: 'DAT LAB', href: '/programs/lab' },
    ],
  },
  {
    label: 'GET INVOLVED',
    submenu: [
      { label: 'Travel With Us', href: '/get-involved/travel' },
      { label: 'Make a Donation', href: '/donate' },
      { label: 'Corporate Sponsorship', href: '/get-involved/sponsorship' },
      { label: 'Join the Team', href: '/get-involved/team' },
      { label: 'Alumni Network', href: '/get-involved/alumni' },
    ],
  },
  {
    label: 'EVENTS',
    submenu: [
      { label: 'Upcoming Performances', href: '/events/upcoming' },
      { label: 'Festivals & Showcases', href: '/events/festivals' },
      { label: 'Fundraisers & Community Nights', href: '/events/fundraisers' },
    ],
  },
  { label: 'SPONSOR THE STORY', href: '/donate', cta: true },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSubmenu, setShowSubmenu] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY) {
        setHidden(true);
        setIsOpen(false);
      } else if (currentY < lastScrollY) {
        setHidden(false);
      }
      setLastScrollY(currentY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div
      className={`fixed top-0 left-0 w-full z-50 transition-transform duration-250 ease-in-out ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      }`}
      style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          backgroundColor: `${COLORS.background}4D`,
          paddingTop: LOGOS.paddingY,
          paddingBottom: LOGOS.paddingY,
          pointerEvents: 'auto',
        }}
      >
        <Link href="/" className="shrink-0 pl-[2rem]">
  <img
    src={LOGOS.src}
    alt={LOGOS.alt}
    style={{ height: LOGOS.height }}
    className="w-auto"
  />
</Link>
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setShowSubmenu(null);
          }}
          aria-label="Toggle navigation menu"
          className="pr-[2rem] text-white focus:outline-none border-0 bg-transparent"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {isOpen ? <X size={44} stroke="white" /> : <Menu size={44} stroke="white" />}
        </button>
      </div>

      {isOpen && (
        <nav
          className="fixed top-0 left-0 w-full h-screen z-[9998] overflow-y-auto px-6 pt-10 pb-10 flex flex-col items-start"
          style={{
            backgroundColor: COLORS.overlay,
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontWeight: 700,
            textTransform: 'uppercase' as React.CSSProperties['textTransform'],
            letterSpacing: FONT.tracking,
            color: 'white',
          }}
        >

<div className="w-full flex items-center justify-between px-[2rem] pt-[0.25rem] pb-[0.25rem]">
  <Link
    href="https://www.dramaticadventure.com"
    target="_blank"
    rel="noopener noreferrer"
  >
    <img
      src="/images/dat-mobile-logo.png"
      alt="Dramatic Adventure Theatre Logo"
      className="h-[84px] w-auto"
    />
  </Link>

  <button
    onClick={() => {
      setIsOpen(false);
      setShowSubmenu(null);
    }}
    aria-label="Close menu"
    className="text-white bg-transparent border-0"
  >
    <X size={44} stroke="white" />
  </button>
</div>


          {showSubmenu ? (
  <>
    <button
      onClick={() => setShowSubmenu(null)}
      className="force-grotesk flex items-center gap-3 ml-[3rem] mt-[2rem] text-[2rem] font-bold fontWeight: '700' uppercase tracking-[0.1em] text-[#c599f7] hover:text-white transition"
      style={{ background: 'none', border: 'none' }}
    >
      <span className="text-[2.5rem] leading-none -mr-2">‹</span>
      <span>Back</span>
    </button>

   {NAV_ITEMS.find((item) => item.label === showSubmenu)?.submenu?.map((sub) => (
  <Link
    key={sub.label}
    href={sub.href}
    onClick={() => setIsOpen(false)}
    className="w-full"
    style={{ textDecoration: 'none' }}
  >
    <div
      className="force-grotesk text-white text-[2.1rem] py-[1rem] ml-[3rem] w-full hover:opacity-80 transition uppercase font-bold tracking-[0.05em]"
    >
      {sub.label}
    </div>
  </Link>
    ))}
  </>
) : (
  <>
    {NAV_ITEMS.map((item) =>
  item.cta ? (
  <div key={item.label} className="w-full mt-5 flex justify-center">
   <div
  key={item.label}
  className="w-full flex justify-center"
  style={{ marginTop: '2rem' }} // 👈 matches ABOUT's spacing
>
  <Link
    href={item.href}
    className="force-grotesk flex items-center justify-center transition duration-200 hover:bg-[#e1224b] font-bold uppercase bg-[#F23359] text-white rounded-[0.5rem] px-[2.5rem] py-[1rem] text-[1.25rem] tracking-[0.4em]"
    style={{ textDecoration: 'none' }}
    onClick={() => setIsOpen(false)}
  >
    {item.label}
  </Link>
</div>

    </div>
  ) : 'submenu' in item ? (
    <button
  key={item.label}
  className={`force-grotesk w-full flex items-center justify-between ml-[3rem] pr-[2rem] py-[1rem] text-white text-[2.1rem] uppercase font-bold tracking-[0.05em] hover:opacity-80 transition ${
    item.label === 'ABOUT' ? 'mt-[2rem]' : ''
  }`}
  onClick={() => setShowSubmenu(item.label)}
  style={{
    fontFamily: 'var(--font-space-grotesk), sans-serif',
    fontWeight: '700',
    color: '#ffffff', // 👈 Force white text
    background: 'none',
    border: 'none',
    textAlign: 'left',
  }}
>
  <span>{item.label} ›</span>
</button>
  ) : (
    <Link
      key={item.label}
      href={item.href}
      onClick={() => setIsOpen(false)}
      className="w-full"
      style={{ textDecoration: 'none' }}
    >
      <button
        className="force-grotesk w-full flex items-center justify-between ml-[3rem] pr-[2rem] text-white text-[2.1525rem] uppercase font-bold tracking-[0.05em] hover:opacity-80 transition"
        style={{
          fontFamily: 'var(--font-space-grotesk), sans-serif',
          fontWeight: '700',
          color: '#ffffff',
          background: 'none',
          border: 'none',
          paddingTop: 15,
          paddingBottom: 15,
          paddingLeft: 5,
          paddingRight: 0,
          textAlign: 'left',
          width: '100%',
        }}
      >
        <span>{item.label}</span>
        <span className="text-[2.25rem] leading-none opacity-0 select-none pointer-events-none">›</span>
      </button>
    </Link>
  )
)}
  </>
)}
        </nav>
      )}
    </div>
  );
}
