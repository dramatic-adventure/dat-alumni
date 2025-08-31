'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X } from 'lucide-react';

const HIDE_THRESHOLD = 64;   // px movement before we toggle (bigger = less jitter)
const DOCKED_ZONE = 80;      // always show when near the very top
const DECISION_MIN_MS = 120; // direction must be stable for least this time

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
  transform: 'uppercase' as const,
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
  const [mounted, setMounted] = useState(false);

  // scroll lock restore point
  const lockYRef = useRef(0);

  // Track user-initiated scroll intent (prevents jitter from layout shifts)
  const userScrollingRef = useRef(false);
  const idleTimerRef = useRef<number | null>(null);

  // 🆕 focus restore + aria-controls target
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => setMounted(true), []);

  // Mark scroll as "user driven" when there is input, clear after idle
  useEffect(() => {
    const requestIdle =
      'requestIdleCallback' in window
        ? (cb: () => void, options?: { timeout?: number }) =>
            (window as any).requestIdleCallback(cb, options)
        : (cb: () => void, options?: { timeout?: number }) =>
            window.setTimeout(cb, options?.timeout ?? 350);

    const cancelIdle =
      'cancelIdleCallback' in window
        ? (id: number) => (window as any).cancelIdleCallback(id)
        : (id: number) => window.clearTimeout(id);

    const start = () => {
      userScrollingRef.current = true;
      if (idleTimerRef.current) cancelIdle(idleTimerRef.current);
      idleTimerRef.current = requestIdle(() => {
        userScrollingRef.current = false;
        idleTimerRef.current = null;
      }, { timeout: 350 }) as unknown as number;
    };

    const onPointer = () => start();
    const onWheel = () => start();
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === 'PageDown' || e.key === 'PageUp' || e.key === 'Home' ||
        e.key === 'End' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp'
      ) start();
    };

    window.addEventListener('pointerdown', onPointer, { passive: true });
    window.addEventListener('touchstart', onPointer, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKey, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('touchstart', onPointer);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      if (idleTimerRef.current) cancelIdle(idleTimerRef.current);
    };
  }, []);

  // Lock body scroll with gap compensation (no width shift)
  useEffect(() => {
    if (!mounted || !isOpen) return;
    const body = document.body;
    lockYRef.current = window.scrollY;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
    };
    const scrollBarGap = window.innerWidth - document.documentElement.clientWidth;

    body.style.position = 'fixed';
    body.style.top = `-${lockYRef.current}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    if (scrollBarGap > 0) body.style.paddingRight = `${scrollBarGap}px`;

    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      body.style.paddingRight = prev.paddingRight;
      window.scrollTo(0, lockYRef.current);
    };
  }, [isOpen, mounted]);

  // 🆕 Optional: disable background interaction while menu open (no layout change)
  useEffect(() => {
    const root = document.getElementById('__next');
    if (!root) return;
    if (isOpen) {
      root.setAttribute('inert', '');
      root.setAttribute('aria-hidden', 'true');
    } else {
      root.removeAttribute('inert');
      root.removeAttribute('aria-hidden');
    }
    return () => {
      root.removeAttribute('inert');
      root.removeAttribute('aria-hidden');
    };
  }, [isOpen]);

  // 🆕 Close on Escape (no layout change)
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // Anti-jitter hide/show: requires stable direction + distance + time
  useEffect(() => {
    if (isOpen) return; // don't react while menu is open

    let lastY = Math.max(0, window.scrollY);
    let anchorY = lastY;
    let lastDir: 'up' | 'down' | null = null;
    let dirSince = performance.now();
    let ticking = false;

    const onScroll = () => {
      // Ignore if not user-initiated OR search is updating the layout
      if (!userScrollingRef.current) return;
      if (document.documentElement.dataset.searchActive === 'true') return;

      const yNow = Math.max(0, window.scrollY);
      const dy = yNow - lastY;
      if (dy === 0) return; // 🆕 skip no-op frames

      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const dir = dy > 0 ? 'down' : dy < 0 ? 'up' : lastDir;

        // Always show near top
        if (yNow <= DOCKED_ZONE) {
          if (hidden) setHidden(false);
          anchorY = yNow;
          lastY = yNow;
          lastDir = 'up';
          dirSince = performance.now();
          ticking = false;
          return;
        }

        // Direction change => reset anchor & timer
        if (dir && dir !== lastDir) {
          lastDir = dir;
          anchorY = yNow;
          dirSince = performance.now();
        }

        const elapsed = performance.now() - dirSince;
        const travel = Math.abs(yNow - anchorY);

        if (dir && elapsed >= DECISION_MIN_MS && travel >= HIDE_THRESHOLD) {
          const wantHidden = dir === 'down';
          setHidden((prev) => (prev !== wantHidden ? wantHidden : prev));
          // reset anchor to avoid immediate flip back
          anchorY = yNow;
          dirSince = performance.now();
        }

        lastY = yNow;
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isOpen, hidden]);

  const openMenu = () => {
    setHidden(false);
    setIsOpen(true);
    setShowSubmenu(null);
  };
  const closeMenu = () => {
    setIsOpen(false);
    setShowSubmenu(null);
    // 🆕 return focus to toggle on next frame
    requestAnimationFrame(() => toggleRef.current?.focus());
  };

  return (
    <div
      className={`fixed top-0 left-0 w-full z-[99999] ${
        isOpen ? 'transition-none translate-y-0' : 'motion-safe:transition-transform duration-250 ease-in-out'
      } ${!isOpen && hidden ? '-translate-y-full' : ''}`}
      style={{ willChange: 'transform', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          backgroundColor: `${COLORS.background}4D`,
          paddingTop: LOGOS.paddingY,
          paddingBottom: LOGOS.paddingY,
        }}
      >
        <Link href="/" className="shrink-0 pl-[2rem]">
          <img
            src={LOGOS.src}
            alt={LOGOS.alt}
            width={Math.round(LOGOS.height * 2.3)} /* 🆕 reserve width to avoid tiny CLS */
            style={{ height: LOGOS.height }}
            className="w-auto"
          />
        </Link>

        <button
          ref={toggleRef}
          onClick={isOpen ? closeMenu : openMenu}
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isOpen}
          aria-controls="dat-mobile-nav"
          className="pr-[2rem] text-white focus:outline-none border-0 bg-transparent"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {isOpen ? <X size={44} stroke="white" /> : <Menu size={44} stroke="white" />}
        </button>
      </div>

      {/* Full-viewport overlay via portal */}
      {mounted &&
        isOpen &&
        createPortal(
          <nav
            id="dat-mobile-nav"
            className="fixed z-[100000]"
            style={{
  top: 0,
  left: 0,
  width: '100vw',
  // prefer small-viewport height on iOS, with dvh fallback
  height: '100svh',
  minHeight: '100dvh',
  backgroundColor: COLORS.overlay,
  color: 'white',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  overscrollBehaviorY: 'none',
}}

            role="dialog"
            aria-modal="true"
            aria-labelledby="dat-nav-title"
          >
            <h2 id="dat-nav-title" className="sr-only">Site navigation</h2>

            <div
              className="w-full px-6 pt-10 pb-10"
              style={{
                fontFamily: 'var(--font-space-grotesk), sans-serif',
                fontWeight: 700,
                textTransform: FONT.transform,
                letterSpacing: FONT.tracking,
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
  onClick={closeMenu}
  aria-label="Close menu"
  className="text-white bg-transparent border-0 pr-[0rem]" 
>
  <X size={44} stroke="white" />
</button>

              </div>

              {showSubmenu ? (
                <>
                  <button
                    onClick={() => setShowSubmenu(null)}
                    className="force-grotesk flex items-center gap-3 ml-[3rem] mt-[2rem] text-[2rem] font-bold uppercase tracking-[0.1em] hover:opacity-80 transition"
                    style={{ background: 'none', border: 'none', color: '#c599f7' }}
                  >
                    <span className="text-[2.5rem] leading-none -mr-2">‹</span>
                    <span>Back</span>
                  </button>

                  {NAV_ITEMS.find((item) => item.label === showSubmenu)?.submenu?.map((sub) => (
                    <Link
                      key={sub.label}
                      href={sub.href}
                      onClick={closeMenu}
                      className="w-full"
                      style={{ textDecoration: 'none' }}
                    >
                      <div className="force-grotesk text-white text-[2.1rem] py-[1rem] ml-[3rem] w-full hover:opacity-80 transition uppercase font-bold tracking-[0.05em]">
                        {sub.label}
                      </div>
                    </Link>
                  ))}
                </>
              ) : (
                <>
                  {NAV_ITEMS.map((item) =>
                    (item as any).cta ? (
                      <div key={item.label} className="w-full mt-5 flex justify-center">
                        <div className="w-full flex justify-center" style={{ marginTop: '2rem' }}>
                          <Link
                            href={(item as any).href}
                            className="force-grotesk flex items-center justify-center transition duration-200 hover:bg-[#e1224b] font-bold uppercase bg-[#F23359] text-white rounded-[0.5rem] px-[2.5rem] py-[1rem] text-[1.25rem] tracking-[0.4em]"
                            style={{ textDecoration: 'none' }}
                            onClick={closeMenu}
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
                          fontWeight: 700,
                          color: '#ffffff',
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
                        href={(item as any).href}
                        onClick={closeMenu}
                        className="w-full"
                        style={{ textDecoration: 'none' }}
                      >
                        <button
                          className="force-grotesk w-full flex items-center justify-between ml-[3rem] pr-[2rem] text-white text-[2.1525rem] uppercase font-bold tracking-[0.05em] hover:opacity-80 transition"
                          style={{
                            fontFamily: 'var(--font-space-grotesk), sans-serif',
                            fontWeight: 700,
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
            </div>
          </nav>,
          document.body
        )}

      {/* keep scrollbar width stable across pages */}
      <style jsx global>{`
        html { scrollbar-gutter: stable both-edges; }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 1px, 1px);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  );
}
