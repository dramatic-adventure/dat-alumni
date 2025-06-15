"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Facebook,
  Twitter,
  Mail,
  Clipboard,
  Check,
  MessageCircle,
} from "lucide-react";

let isSharing = false;

export default function ShareButton({ url }: { url: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard error:", err);
    }
  };

  const handleNativeShare = async () => {
    if (isSharing) return;
    if (!navigator.share) {
      setOpen(prev => !prev);
      return;
    }

    isSharing = true;
    try {
      await navigator.share({
        title: document.title,
        text: "Check out this story from DAT:",
        url,
      });
    } catch (err) {
      if ((err as DOMException).name !== "AbortError") {
        console.error("Error sharing:", err);
      }
    } finally {
      isSharing = false;
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleNativeShare}
        aria-label="Share this story"
        aria-expanded={open}
        aria-controls="share-dropdown"
        className="focus:outline-none border-none bg-transparent p-0 m-0"
      >
        <Image
          src="/icons/share-drawn.png"
          alt="Share"
          width={28}
          height={28}
          className="hover:scale-110 transition-transform"
        />
      </button>

      {open && (
        <div
          id="share-dropdown"
          role="menu"
          className="absolute top-full right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-gray-200 p-3 space-y-2 text-sm text-gray-800 font-grotesk z-50"
        >
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-[#1877f2] transition"
            role="menuitem"
          >
            <Facebook size={18} /> Facebook
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-[#1DA1F2] transition"
            role="menuitem"
          >
            <Twitter size={18} /> Twitter / X
          </a>
          <a
            href={`mailto:?subject=Check this out&body=${encodeURIComponent(url)}`}
            className="flex items-center gap-2 hover:text-[#ea4335] transition"
            role="menuitem"
          >
            <Mail size={18} /> Email
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-[#25D366] transition"
            role="menuitem"
          >
            <MessageCircle size={18} /> WhatsApp
          </a>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 w-full text-left hover:text-black transition"
            role="menuitem"
          >
            {copied ? <Check size={18} /> : <Clipboard size={18} />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      )}
    </div>
  );
}
