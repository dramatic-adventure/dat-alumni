'use client';

import Button from "@/components/Button";
import {
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaEnvelope,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="w-full bg-[#241123] text-white">
      <div className="max-w-6xl mx-auto pl-6 pr-[4rem] pt-[4rem] pb-12">
        {/* Header */}
        <h2 className="text-[8rem] sm:text-[12rem] leading-[1] text-[#f23359] font-[Gloucester] font-normal text-right">
          Ready to act?
        </h2>

        {/* CTA Buttons (flush with heading) */}
        <div className="flex flex-col items-end gap-0 mt-0">
  <Button href="/get-involved">Get Involved</Button>
  <Button href="/donate">Donate</Button>
</div>

        {/* Social Icons */}
        <div className="flex justify-end gap-3 mt-2">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            <FaInstagram size={20} />
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
            <FaFacebook size={20} />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            <FaTwitter size={20} />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
            <FaYoutube size={20} />
          </a>
          <a href="mailto:info@dramaticadventure.com">
            <FaEnvelope size={20} />
          </a>
        </div>

        {/* Legal */}
        <p className="text-xs text-right mt-4 text-white/70">
          Dramatic Adventure Theatre is a 501(c)(3) nonprofit organization,{" "}
          <a
            href="https://apps.irs.gov/app/eos/details/80-0178507"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f23359] underline"
          >
            EIN 80-0178507
          </a>
          . Donations are tax-deductible.
        </p>
      </div>
    </footer>
  );
}
