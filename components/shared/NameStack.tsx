"use client";
import React, { useEffect, useState, useRef } from "react";

interface ScaledNameProps {
  firstName: string;
  lastName: string;
  containerWidth?: number; // default 290
  gap?: string; // default 0.4rem
}

export default function ScaledName({
  firstName,
  lastName,
  containerWidth = 290,
  gap = "0.4rem",
}: ScaledNameProps) {
  const firstRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<HTMLDivElement>(null);
  const [firstFontSize, setFirstFontSize] = useState("4.5rem");
  const [lastFontSize, setLastFontSize] = useState("4.5rem");
  const [isReady, setIsReady] = useState(false);

  const calculateSizes = () => {
    if (firstRef.current && lastRef.current) {
      const firstWidth = firstRef.current.scrollWidth;
      const lastWidth = lastRef.current.scrollWidth;

      const baseFontSize = 72;
      const firstRatio = containerWidth / firstWidth;
      const lastRatio = containerWidth / lastWidth;

      setFirstFontSize(`${baseFontSize * firstRatio}px`);
      setLastFontSize(`${baseFontSize * lastRatio}px`);
    }
  };

  const verifySizes = () => {
    if (firstRef.current && lastRef.current) {
      const firstWidth = Math.round(firstRef.current.getBoundingClientRect().width);
      const lastWidth = Math.round(lastRef.current.getBoundingClientRect().width);

      if (Math.abs(firstWidth - containerWidth) > 2 || Math.abs(lastWidth - containerWidth) > 2) {
        calculateSizes();
      }
    }
  };

  useEffect(() => {
    const runChecks = () => {
      calculateSizes();
      setIsReady(true);

      setTimeout(() => verifySizes(), 150);
      setTimeout(() => verifySizes(), 500);
    };

    if (document.fonts) {
      document.fonts.ready.then(runChecks); // ✅ Wait until fonts are loaded
    } else {
      runChecks();
    }
  }, [firstName, lastName, containerWidth]);

  const baseStyle: React.CSSProperties = {
    fontFamily: "Anton, sans-serif",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    color: "#F6E4C1",
    lineHeight: 1,
    margin: 0,
  };

  const containerStyle: React.CSSProperties = {
    width: `${containerWidth}px`,
    display: "flex",
    justifyContent: "flex-start",
    overflow: "visible",
  };

  return (
    <>
      <style>{`
        @media (max-width: 1024px) {
          .scaled-name-outer {
            display: flex;
            justify-content: center;
            width: 100%;
            margin: 0 auto;
          }
          .scaled-name-inner {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>

      <div
        className="scaled-name-outer"
        style={{
          opacity: isReady ? 1 : 0,
          transition: "opacity 0.15s ease",
        }}
      >
        <div className="scaled-name-inner">
          {/* First Name */}
          <div style={{ ...containerStyle, alignItems: "flex-end" }}>
            <div
              ref={firstRef}
              style={{
                ...baseStyle,
                fontSize: firstFontSize,
              }}
            >
              {firstName}
            </div>
          </div>

          {/* Gap */}
          <div style={{ height: gap }} />

          {/* Last Name */}
          <div style={{ ...containerStyle, alignItems: "flex-start" }}>
            <div
              ref={lastRef}
              style={{
                ...baseStyle,
                fontSize: lastFontSize,
              }}
            >
              {lastName}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
