"use client";

import { useLayoutEffect, useRef } from "react";
import { FaInstagram, FaFacebook, FaTwitter, FaYoutube, FaEnvelope } from "react-icons/fa";

export default function Footer() {
  const h2Ref = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const el = h2Ref.current;
    if (!el) return;

    const fitHeadline = () => {
      const parent = el.parentElement;
      if (!parent) return;

      // Start from a predictable measurement size
      el.style.fontSize = "200px";

      const parentWidth = parent.getBoundingClientRect().width;
      const textWidth = el.getBoundingClientRect().width;

      if (!parentWidth || !textWidth) return;

      // Slightly under full width to avoid rounding overflow
      const nextFontSize = (parentWidth / textWidth) * 200 * 0.995;
      el.style.fontSize = `${nextFontSize}px`;
    };

    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(fitHeadline);

      const resizeObserver = new ResizeObserver(fitHeadline);
      if (el.parentElement) resizeObserver.observe(el.parentElement);

      window.addEventListener("resize", fitHeadline);
      document.fonts?.ready?.then(fitHeadline);

      (el as any).__footerCleanup = () => {
        cancelAnimationFrame(raf2);
        resizeObserver.disconnect();
        window.removeEventListener("resize", fitHeadline);
      };
    });

    return () => {
      cancelAnimationFrame(raf1);
      (el as any).__footerCleanup?.();
    };
  }, []);

  return (
  <footer className="relative z-10 bg-[#241123] overflow-x-hidden w-screen left-1/2 -ml-[50vw] pt-16 lg:pt-24 pb-10 px-3 sm:px-4 lg:px-6">
    <div className="max-w-7xl mx-auto flex flex-col">
      <div className="-mx-3 sm:-mx-4 lg:-mx-6">
        <div
          className="footer-cta mx-auto w-[88vw] md:w-[62.25vw] max-w-[100vw]"
          style={{ marginTop: "7.75vh" }}
        >
          <div className="mb-4 md:mb-6 w-full overflow-hidden text-center">
            <h2
              ref={h2Ref}
              className="
                inline-block
                font-gloucester font-[400] text-[#F23359]
                leading-[0.85] tracking-[-0.02em] whitespace-nowrap
              "
              style={{ margin: 0, display: "inline-block" }}
            >
              Ready to act?
            </h2>
          </div>

          <a
            href="https://dramaticadventure.com/travel-opportunities"
            className="first-cta-offset block w-full box-border text-center transition hover:opacity-80 uppercase tracking-[0.345em]"
            style={{
              backgroundColor: "#2493A9",
              color: "#241123",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 400,
              fontSize: "0.885rem",
              paddingTop: "0.33em",
              paddingBottom: "0.33em",
              paddingLeft: "2.5rem",
              paddingRight: "2.5rem",
              borderRadius: "0.375rem",
              marginTop: "0.9rem",
              marginBottom: "0.7rem",
              textDecoration: "none",
            }}
          >
            Get Involved
          </a>

          <a
            href="/donate"
            className="block w-full box-border text-center transition hover:opacity-80 uppercase tracking-[0.345em]"
            style={{
              backgroundColor: "#2493A9",
              color: "#241123",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 400,
              fontSize: "0.885rem",
              paddingTop: "0.33em",
              paddingBottom: "0.33em",
              paddingLeft: "2.5rem",
              paddingRight: "2.5rem",
              borderRadius: "0.375rem",
              textDecoration: "none",
            }}
          >
            Donate
          </a>
        </div>
      </div>



        {/* Social Icons */}
        <div className="flex items-center justify-center" style={{ gap: "0.5rem", marginBottom: "0.1rem", marginTop: "5.1em" }}>
          <a href="https://www.instagram.com/dramaticadventure" target="_blank" rel="noopener noreferrer"
             style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:32,height:32}}>
            <FaInstagram size={25} color="white" style={{ display: "block" }} />
          </a>
          <a href="https://www.facebook.com/DramaticAdventure/" target="_blank" rel="noopener noreferrer"
             style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:32,height:32}}>
            <FaFacebook size={25} color="white" style={{ display: "block" }} />
          </a>
          <a href="https://x.com/datheatre" target="_blank" rel="noopener noreferrer"
             style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:32,height:32}}>
            <FaTwitter size={25} color="white" style={{ display: "block" }} />
          </a>
          <a href="https://www.youtube.com/dramaticadventure" target="_blank" rel="noopener noreferrer"
             style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:32,height:32}}>
            <FaYoutube size={25} color="white" style={{ display: "block" }} />
          </a>
          <a href="mailto:hello@dramaticadventure.com"
             style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:32,height:32}}>
            <FaEnvelope size={25} color="white" style={{ display: "block" }} />
          </a>
        </div>

        {/* EIN / Legal — safe width cap */}
        <p
          className="text-center font-grotesk mx-auto w-[88vw] md:w-auto whitespace-normal md:whitespace-nowrap text-balance"
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            color: "#A7A9BE",
            fontSize: "clamp(0.539rem, 1.4vw, 0.75rem)",
            marginBottom: "4.5em",
            letterSpacing: "0.01em",
            maxWidth: "100vw",
          }}
        >
          Dramatic Adventure Theatre is a 501(c)(3) nonprofit organization,&nbsp;
          <a
            href="https://app.candid.org/profile/9883629/dramatic-adventure-theatre-inc-80-0178507"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#F23359", textDecoration: "underline" }}
          >
            EIN 80-0178507
          </a>
          . Donations are tax-deductible.
        </p>
      </div>
    </footer>
  );
}
