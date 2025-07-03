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
    case "rectangle":
      return (
        <>
          <rect x="5" y="20" width="90" height="60" stroke={color} strokeWidth="3" fill="none" />
          <rect x="10" y="25" width="80" height="50" stroke={color} strokeWidth="1.5" strokeDasharray="6,4" fill="none" />
        </>
      );
    case "rounded-rectangle":
      return (
        <>
          <rect x="5" y="20" width="90" height="60" rx="15" ry="15" stroke={color} strokeWidth="3" fill="none" />
          <rect x="10" y="25" width="80" height="50" rx="12" ry="12" stroke={color} strokeWidth="1.5" strokeDasharray="6,4" fill="none" />
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
    case "rounded-hexagon":
      return (
        <>
          <polygon
            points="50,8 86,28 86,72 50,92 14,72 14,28"
            stroke={color}
            strokeWidth="3"
            fill="none"
            strokeLinejoin="round"
          />
          <polygon
            points="50,14 80,32 80,68 50,86 20,68 20,32"
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray="6,4"
            fill="none"
            strokeLinejoin="round"
          />
        </>
      );
    case "pentagon":
      return (
        <>
          <polygon
            points="50,5 90,35 72,90 28,90 10,35"
            stroke={color}
            strokeWidth="3"
            fill="none"
          />
          <polygon
            points="50,10 85,37 70,85 30,85 15,37"
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray="6,4"
            fill="none"
          />
        </>
      );
    case "rounded-pentagon":
      return (
        <>
          <polygon
            points="50,8 87,35 70,88 30,88 13,35"
            stroke={color}
            strokeWidth="3"
            fill="none"
            strokeLinejoin="round"
          />
          <polygon
            points="50,14 80,38 67,83 33,83 17,38"
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray="6,4"
            fill="none"
            strokeLinejoin="round"
          />
        </>
      );
    case "rounded-triangle":
      return (
        <>
          <polygon
            points="50,10 90,85 10,85"
            stroke={color}
            strokeWidth="3"
            fill="none"
            strokeLinejoin="round"
          />
          <polygon
            points="50,20 80,80 20,80"
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray="6,4"
            fill="none"
            strokeLinejoin="round"
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
