"use client";

import { FaInstagram, FaFacebook, FaTwitter, FaYoutube, FaEnvelope } from "react-icons/fa";
import { useFitTextToParent } from "../hooks/useFitTextToParent";

export default function Footer() {
  // Auto-fit only below 768; CSS takes over at md (≥768)
  const h2Ref = useFitTextToParent<HTMLHeadingElement>({
    minPx: 28,
    maxPx: 520,
    desktopMin: 768,
  });

  return (
    <footer className="relative z-10 bg-[#241123] pt-16 lg:pt-24 pb-10 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto flex flex-col">

        {/* Headline — bleed to viewport, then 90vw <768 / 62.25vw ≥768 */}
        <div className="-mx-3 sm:-mx-4 lg:-mx-6">
          <div
            className="
              headline-box headline-gap mx-auto
              w-[88vw] md:w-[62.25vw] max-w-[100vw]
              flex justify-center items-end
              min-h-[calc(16.12vw*0.85)] md:min-h-[10.2rem]
            "
            style={{ marginTop: "7.75vh" }}
          >
            <h2
              ref={h2Ref}
              className="
                block text-center
                font-gloucester text-[#F23359] font-[400]
                leading-[0.85] tracking-[0.01em] whitespace-nowrap
                text-[16.15vw] md:text-[12rem]
              "
              style={{ margin: 0, willChange: "transform", transform: "translateZ(0)" }}
            >
              Ready to act?
            </h2>
          </div>
        </div>

        {/* CTA Buttons — 90vw <768, 62.25vw ≥768; padding won’t push past 100% */}
<div className="-mx-3 sm:-mx-4 lg:-mx-6">
  <div className="footer-cta mx-auto w-[88vw] md:w-[62.25vw] max-w-[100vw]">
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
        willChange: "transform",
        transform: "translateZ(0)",
      }}
    >
      Get Involved
    </a>

    <a
      href="https://dramaticadventure.com/checkout/donate?donatePageId=6125b0c5c6be590e4c5a2802"
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
        willChange: "transform",
        transform: "translateZ(0)",
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
          className="text-center font-grotesk mx-auto w-[88vw] md:w-auto whitespace-nowrap"
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
            href="https://www.guidestar.org/profile/9883629#"
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
