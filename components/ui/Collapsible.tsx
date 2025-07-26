"use client";

import { useState, ElementType } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  level?: number;
}

export default function Collapsible({
  title,
  children,
  defaultOpen = false,
  level = 2,
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const HeadingTag = `h${level}` as ElementType;

  return (
    <div style={{ marginTop: "3rem" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.8rem",
          width: "100%",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <HeadingTag
          style={{
            fontFamily: "Anton, sans-serif",
            fontSize: level === 2 ? "3.75rem" : "2.75rem",
            fontWeight: 700,
            color: "#241123",
            margin: 0,
            textTransform: "uppercase",
            transition: "color 0.3s ease, letter-spacing 0.3s ease",
          }}
          className="collapsible-header"
        >
          {title}
        </HeadingTag>
        <span
          style={{
            fontSize: "2.5rem",
            fontWeight: "bold",
            color: "#f2f2f2",
            backgroundColor: "#6C00AF",
            opacity: 0.7,
            borderRadius: "50%",
            width: "2.5rem",
            height: "2.5rem",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transition: "background-color 0.3s ease",
          }}
        >
          {isOpen ? "−" : "+"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              overflow: "hidden",
              marginTop: "1.5rem",
              paddingTop: "1rem",
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
