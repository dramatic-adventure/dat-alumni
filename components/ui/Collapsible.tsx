"use client";

import { useState, ElementType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  level?: number; // h2, h3, etc.
}

export default function Collapsible({
  title,
  children,
  defaultOpen = true,
  level = 2,
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // ✅ Dynamically choose heading tag safely
  const HeadingTag = (`h${level}` as unknown) as ElementType;

  return (
    <div className="mb-6 border-b border-dotted border-gray-300 pb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left group"
      >
        <HeadingTag
          className="font-bold text-[#241123]"
          style={{ fontFamily: "'Rock Salt', cursive", fontSize: "1.5rem" }}
        >
          {title}
        </HeadingTag>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="ml-2"
        >
          <ChevronDown size={24} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden mt-4"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
