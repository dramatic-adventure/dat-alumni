"use client";
import React from "react";

type ShapePathProps = {
  shape: string;
  color: string;
};

export default function ShapePath({ shape, color }: ShapePathProps) {
  switch (shape) {
    case "circle":
      return (
        <>
          <circle cx="50" cy="50" r="45" stroke={color} strokeWidth="3" fill="none" />
          <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="1.5" strokeDasharray="6,4" fill="none" />
        </>
      );
    case "square":
      return (
        <>
          <rect x="5" y="5" width="90" height="90" stroke={color} strokeWidth="3" fill="none" />
          <rect x="10" y="10" width="80" height="80" stroke={color} strokeWidth="1.5" strokeDasharray="6,4" fill="none" />
        </>
      );
    case "rounded-square":
      return (
        <>
          <rect x="5" y="5" width="90" height="90" rx="15" ry="15" stroke={color} strokeWidth="3" fill="none" />
          <rect x="10" y="10" width="80" height="80" rx="12" ry="12" stroke={color} strokeWidth="1.5" strokeDasharray="6,4" fill="none" />
        </>
      );
    case "hexagon":
      return (
        <>
          <polygon
            points="50,5 90,25 90,75 50,95 10,75 10,25"
            stroke={color}
            strokeWidth="3"
            fill="none"
          />
          <polygon
            points="50,10 85,28 85,72 50,90 15,72 15,28"
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray="6,4"
            fill="none"
          />
        </>
      );
    case "rounded-triangle":
      return (
        <>
          <polygon
            points="50,5 90,90 10,90"
            stroke={color}
            strokeWidth="3"
            fill="none"
          />
          <polygon
            points="50,15 80,85 20,85"
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray="6,4"
            fill="none"
          />
        </>
      );
    case "multi-edge-circle":
      return (
        <>
          <polygon
            points={Array.from({ length: 20 }, (_, i) => {
              const angle = (i / 20) * 2 * Math.PI;
              const r = 45;
              const cx = 50 + r * Math.cos(angle);
              const cy = 50 + r * Math.sin(angle);
              return `${cx},${cy}`;
            }).join(" ")}
            stroke={color}
            strokeWidth="3"
            fill="none"
          />
          <polygon
            points={Array.from({ length: 20 }, (_, i) => {
              const angle = (i / 20) * 2 * Math.PI;
              const r = 40;
              const cx = 50 + r * Math.cos(angle);
              const cy = 50 + r * Math.sin(angle);
              return `${cx},${cy}`;
            }).join(" ")}
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray="6,4"
            fill="none"
          />
        </>
      );
    default:
      return null;
  }
}
