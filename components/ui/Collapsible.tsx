"use client";

import { useMemo, useState, ElementType, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type CollapsibleProps = {
  id?: string;
  title: string;
  children: React.ReactNode;

  /** Uncontrolled default */
  defaultOpen?: boolean;

  /** Controlled mode */
  open?: boolean;
  onOpenChange?: (next: boolean) => void;

  level?: number;

  /** Optional: visually indicate “attention” (e.g., when jumped-to) */
  pulseOnMount?: boolean;
};

export default function Collapsible({
  id,
  title,
  children,
  defaultOpen = false,
  open,
  onOpenChange,
  level = 2,
  pulseOnMount = false,
}: CollapsibleProps) {
  const isControlled = typeof open === "boolean";
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  const isOpen = isControlled ? (open as boolean) : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  const HeadingTag = `h${level}` as ElementType;

  const fontSize = level === 2 ? "3.75rem" : "2.75rem";

  const btnId = useMemo(() => (id ? `${id}__btn` : undefined), [id]);
  const panelId = useMemo(() => (id ? `${id}__panel` : undefined), [id]);

  return (
    <div id={id} style={{ marginTop: "3rem" }}>
      <button
        type="button"
        id={btnId}
        onClick={() => setOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.8rem",
          width: "100%",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          padding: 0,
        }}
      >
        <HeadingTag
          style={{
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            fontSize,
            fontWeight: 700,
            color: "#241123",
            margin: 0,
            textTransform: "uppercase",
            transition: "color 0.25s ease, letter-spacing 0.25s ease",
            letterSpacing: isOpen ? "0.02em" : "0",
          }}
          className="collapsible-header"
        >
          {title}
        </HeadingTag>

        <span
          aria-hidden="true"
          style={{
            fontSize: "2.0rem",
            fontWeight: 900,
            color: "#f2f2f2",
            backgroundColor: "#6C00AF",
            opacity: isOpen ? 0.9 : 0.7,
            borderRadius: "50%",
            width: "2.5rem",
            height: "2.5rem",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transition: "transform 0.18s ease, opacity 0.18s ease, background-color 0.25s ease",
            transform: isOpen ? "rotate(0deg) scale(1.02)" : "rotate(0deg) scale(1)",
            boxShadow: isOpen ? "0 10px 24px rgba(0,0,0,0.18)" : "none",
          }}
        >
          {isOpen ? "−" : "+"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            id={panelId}
            role="region"
            aria-labelledby={btnId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            style={{
              overflow: "hidden",
              marginTop: "1.5rem",
              paddingTop: "1rem",
            }}
          >
            <motion.div
              initial={pulseOnMount ? { scale: 0.995 } : undefined}
              animate={pulseOnMount ? { scale: 1 } : undefined}
              transition={pulseOnMount ? { duration: 0.22 } : undefined}
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
