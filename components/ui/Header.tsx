'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';

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
  ctaText: '#f2f2f2',
  hover: '#ffcc00', // 💛 DAT yellow
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

  // 👇 NEW: track if viewport is "short" like we did with @media (max-height: 650px)
  const [isTight, setIsTight] = useState(false);

  // Hide-on-scroll only when menu is CLOSED
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (!isOpen && currentY > lastScrollY) {
        setHidden(true);
      } else if (currentY < lastScrollY) {
        setHidden(false);
      }
      setLastScrollY(currentY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isOpen]);

  // Lock body scroll while menu is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevTouch = (document.body.style as any).touchAction;
    document.body.style.overflow = 'hidden';
    (document.body.style as any).touchAction = 'none';
    return () => {
      document.body.style.overflow = prevOverflow;
      (document.body.style as any).touchAction = prevTouch;
    };
  }, [isOpen]);

  // 👇 NEW: recompute tight mode on open + resize/orient change
  useEffect(() => {
    function recomputeTight() {
      // mirrors your CSS breakpoint: 650px viewport height
      setIsTight(window.innerHeight <= 650);
    }

    recomputeTight(); // run once on mount
    window.addEventListener('resize', recomputeTight);
    window.addEventListener('orientationchange', recomputeTight);

    return () => {
      window.removeEventListener('resize', recomputeTight);
      window.removeEventListener('orientationchange', recomputeTight);
    };
  }, []);

  // also recomputeTight any time the menu opens (keyboard / URL bar can shift height)
  useEffect(() => {
    if (isOpen) {
      setIsTight(window.innerHeight <= 650);
    }
  }, [isOpen]);

  // shared styles for top-level nav rows ("ABOUT", "STORY MAP", etc.)
  function topLevelButtonBase(extra?: string) {
    return `
      force-grotesk w-full flex items-center justify-between
      ml-[3rem] pr-[2rem]
      text-white
      uppercase font-bold
      tracking-[0.05em]
      transition
      ${extra || ''}
    `;
  }

  // dynamic inline style for top-level rows based on isTight (matches your emergency compression)
  function topLevelButtonStyle(isFirst: boolean) {
    return {
      fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
      fontWeight: 500,
      color: '#f2f2f2',
      background: 'none',
      border: 'none',
      textAlign: 'left' as const,
      width: '100%',
      paddingTop: isTight ? 10 : 15,   // was 15, compress to ~10 in tight mode
      paddingBottom: isTight ? 10 : 15,
      paddingLeft: 5,
      paddingRight: 0,
      // margin-top for first item ("ABOUT")
      marginTop: isFirst ? (isTight ? '1rem' : '2rem') : undefined,
      lineHeight: isTight ? 1.05 : 1.1, // tighter line-height in tight mode
      fontSize: '2.1rem',               // keep same font size
    };
  }

  // submenu rows ("Our Mission & Ethos", etc.)
  function subItemStyle() {
    return {
      textDecoration: 'none',
    };
  }
  function subItemInnerStyle() {
    return {
      color: '#f2f2f2',
      background: 'none',
      textTransform: 'uppercase' as const,
      fontWeight: 500,
      letterSpacing: '0.05em',
      fontSize: '2.1rem',
      width: '100%',
      marginLeft: '3rem',
      paddingTop: isTight ? '0.5rem' : '1rem',
      paddingBottom: isTight ? '0.5rem' : '1rem',
      lineHeight: isTight ? 1.05 : 1.1,
    };
  }

  // CTA pill tweaks in tight mode (mirror your CSS @650px block)
  function ctaClass() {
    return `
      force-grotesk flex items-center justify-center
      font-bold uppercase
      text-white
      rounded-[0.5rem]
      transition duration-200
      tracking-[0.4em]
    `;
  }
  function ctaStyle() {
    return {
      backgroundColor: COLORS.accent,
      textDecoration: 'none',
      paddingLeft: '2.5rem',
      paddingRight: '2.5rem',
      paddingTop: isTight ? '0.8rem' : '1rem',
      paddingBottom: isTight ? '0.8rem' : '1rem',
      fontSize: '1.25rem',
      lineHeight: isTight ? 1.15 : 1.2,
      maxWidth: isTight ? '22rem' : '26rem',
    } as const;
  }

  // header/overlay wrapper
  return (
    <div
      className={`fixed top-0 left-0 w-full z-50 transition-transform duration-250 ease-in-out ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      }`}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Header bar when menu is closed */}
      {!isOpen && (
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
            <Image
              src={LOGOS.src}
              alt={LOGOS.alt}
              width={252}
              height={LOGOS.height}
              priority
              className="w-auto"
              style={{ height: LOGOS.height }}
              draggable={false}
            />
          </Link>

          <button
            onClick={() => {
              setIsOpen(true);
              setShowSubmenu(null);
            }}
            aria-label="Open navigation menu"
            className="pr-[2rem] text-white focus:outline-none border-0 bg-transparent"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Menu size={44} stroke="white" />
          </button>
        </div>
      )}

      {/* Full overlay menu */}
      {isOpen && (
        <nav
          className="fixed top-0 left-0 w-screen h-[100dvh] z-[9998] overflow-y-auto flex flex-col"
          style={{
            width: '100vw',
            maxWidth: '100vw',
            height: '100dvh',
            backgroundColor: COLORS.overlay,
            fontFamily:
              'var(--font-space-grotesk), system-ui, sans-serif',
            fontWeight: 500,
            textTransform: FONT.transform as React.CSSProperties['textTransform'],
            letterSpacing: FONT.tracking,
            color: 'white',
          }}
        >
          {/* overlay header row (logo + X) */}
          <div
            className="flex items-center justify-between"
            style={{
              paddingTop: LOGOS.paddingY,
              paddingBottom: LOGOS.paddingY,
              backgroundColor: COLORS.overlay,
            }}
          >
            <Link href="/" className="shrink-0 pl-[2rem]">
              <Image
                src={LOGOS.src}
                alt={LOGOS.alt}
                width={252}
                height={LOGOS.height}
                priority
                className="w-auto"
                style={{ height: LOGOS.height }}
                draggable={false}
              />
            </Link>

            <button
              onClick={() => {
                setIsOpen(false);
                setShowSubmenu(null);
              }}
              aria-label="Close navigation menu"
              className="pr-[2rem] text-white focus:outline-none border-0 bg-transparent"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <X size={44} stroke="white" />
            </button>
          </div>

          {/* menu body */}
          <div
            className="flex-1 flex flex-col px-6"
            style={{
              paddingTop: isTight ? '0.5rem' : '1rem', // mirrors padding-top compression
              paddingBottom: isTight ? '2rem' : '2rem', // you keep same bottom gutter
            }}
          >
            {showSubmenu ? (
              <>
                {/* Back button */}
                <button
                  onClick={() => setShowSubmenu(null)}
                  className="force-grotesk flex items-center gap-3 ml-[3rem] transition"
                  style={{
                    background: 'none',
                    border: 'none',
                    marginTop: isTight ? '1rem' : '2rem',
                    color: '#f2f2f2',
                    opacity: '0.6',
                    fontSize: '2rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    lineHeight: 1.1,
                    cursor: 'pointer',
                  }}
                  // hover -> DAT yellow
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = COLORS.hover;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = '#f2f2f2';
                  }}
                >
                  <span
                    className="leading-none -mr-2"
                    style={{ fontSize: '2.5rem', lineHeight: 1, fontWeight: 300, }}
                  >
                    ‹
                  </span>
                  <span>Back</span>
                </button>

                {/* Submenu list */}
                {NAV_ITEMS.find((item) => item.label === showSubmenu)?.submenu?.map(
                  (sub) => (
                    <Link
                      key={sub.label}
                      href={sub.href}
                      onClick={() => setIsOpen(false)}
                      className="w-full"
                      style={subItemStyle()}
                    >
                      <div
                        className="force-grotesk transition"
                        style={subItemInnerStyle()}
                        // hover -> DAT yellow
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color =
                            COLORS.hover;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color =
                            '#f2f2f2';
                        }}
                      >
                        {sub.label}
                      </div>
                    </Link>
                  )
                )}
              </>
            ) : (
              <>
                {NAV_ITEMS.map((item) => {
                  if (item.cta) {
                    return (
                      <div
                        key={item.label}
                        className="w-full flex justify-center"
                        style={{
                          marginTop: isTight ? '0.5rem' : '1rem',
                          marginBottom: isTight ? '1rem' : '2rem',
                        }}
                      >
                        <Link
                          href={item.href}
                          className={ctaClass()}
                          style={ctaStyle()}
                          onClick={() => setIsOpen(false)}
                          // hover slightly darken bg, keep text white
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor =
                              '#e1224b';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor =
                              COLORS.accent;
                          }}
                        >
                          {item.label}
                        </Link>
                      </div>
                    );
                  }

                  // items with submenu
                  if ('submenu' in item) {
                    return (
                      <button
                        key={item.label}
                        className={topLevelButtonBase(
                          item.label === 'ABOUT' ? '' : ''
                        )}
                        onClick={() => setShowSubmenu(item.label)}
                        style={{
                          ...topLevelButtonStyle(item.label === 'ABOUT'),
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                        // hover -> DAT yellow
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color =
                            COLORS.hover;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color =
                            '#f2f2f2';
                        }}
                      >
                        <span>
                          {item.label} <span style={{ fontWeight: 300 }}>›</span>

                        </span>
                      </button>
                    );
                  }

                  // plain link
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="w-full"
                      style={{ textDecoration: 'none' }}
                    >
                      <button
                        className={topLevelButtonBase()}
                        style={{
                          ...topLevelButtonStyle(false),
                          cursor: 'pointer',
                        }}
                        // hover -> DAT yellow
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color =
                            COLORS.hover;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color =
                            '#f2f2f2';
                        }}
                      >
                        <span>{item.label}</span>
                        {/* keep “›” placeholder to balance flex, but invisible */}
                        <span
                          className="leading-none opacity-0 select-none pointer-events-none"
                          style={{ fontSize: '2.25rem', lineHeight: 1, fontWeight: 300, }}
                        >
                          ›
                        </span>
                      </button>
                    </Link>
                  );
                })}
              </>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
