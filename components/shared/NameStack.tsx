"use client";
import React, { RefObject } from "react";

type TextTransform = "uppercase" | "lowercase" | "capitalize" | "none";

export interface NameStackProps {
  firstName: string;
  lastName: string;
  firstNameRef: RefObject<HTMLDivElement | null>;
  lastNameRef: RefObject<HTMLDivElement | null>;
  firstScale: number;
  lastScale: number;
  hasMeasured: boolean;
  nameFontFamily?: string;
  nameFontSize?: string;
  nameColor?: string;
  textTransform?: TextTransform;
  letterSpacing?: string;
  textAlign?: "left" | "center" | "right";
  style?: React.CSSProperties; // ✅ Safe external style
}

export default function NameStack({
  firstName,
  lastName,
  firstNameRef,
  lastNameRef,
  firstScale,
  lastScale,
  hasMeasured,
  nameFontFamily = "Anton, sans-serif",
  nameFontSize = "4.5rem",
  nameColor = "#F6E4C1",
  textTransform = "uppercase",
  letterSpacing = "5px",
  textAlign = "left",
  style, // ✅ Now merged properly
}: NameStackProps) {
  const baseTextStyle: React.CSSProperties = {
    fontFamily: nameFontFamily,
    fontSize: nameFontSize,
    color: nameColor,
    textTransform,
    lineHeight: 1.1,
    textAlign,
    marginBottom: 0,
    letterSpacing,
    fontWeight: 500,
  };

  const hiddenStyle: React.CSSProperties = {
    position: "absolute",
    visibility: "hidden",
    whiteSpace: "nowrap",
    pointerEvents: "none",
  };

  return (
    <div
      style={{
        ...style, // ✅ Applies external width/margin here
        ...baseTextStyle,
        display: "inline-flex",
        flexDirection: "column",
        alignItems: textAlign === "center" ? "center" : "flex-start",
      }}
    >
      {/* Hidden measuring divs */}
      <div ref={firstNameRef} style={hiddenStyle} aria-hidden="true">
        {firstName}
      </div>
      <div ref={lastNameRef} style={hiddenStyle} aria-hidden="true">
        {lastName}
      </div>

      {/* Visible scaled names */}
      <div
        style={{
          transform: `scale(${firstScale})`,
          transformOrigin: textAlign === "center" ? "center" : "left",
          whiteSpace: "nowrap",
          marginTop: "0.5em",
          visibility: hasMeasured ? "visible" : "hidden",
        }}
      >
        {firstName}
      </div>
      <div
        style={{
          transform: `scale(${lastScale})`,
          transformOrigin: textAlign === "center" ? "center" : "left",
          whiteSpace: "nowrap",
          marginTop: "0.15em",
          visibility: hasMeasured ? "visible" : "hidden",
        }}
      >
        {lastName}
      </div>
    </div>
  );
}
