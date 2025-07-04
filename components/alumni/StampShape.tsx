"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ShapePath from "./ShapePath";
import { randomInt, randomFromArray, getRandomFont } from "@/utils/random";
import { programMap } from "@/lib/programMap";

// store positions in module scope to reduce overlap
const usedPositions: { top: number; left: number }[] = [];

type StampShapeProps = {
  program: string;
  location: string;
  year: number;
  color: string;
  panelHeight: number;
  hoveredSlug: string | null;
  setHoveredSlug: (slug: string | null) => void;
  mySlug: string;
};

export default function StampShape({
  program,
  location,
  year,
  color,
  panelHeight,
  hoveredSlug,
  setHoveredSlug,
  mySlug,
}: StampShapeProps) {
  const allShapes = [
    "circle",
    "multi-edge-circle",
    "rectangle",
    "rounded-rectangle",
    "square",
    "rounded-square",
    "hexagon",
    "rounded-hexagon",
    "pentagon",
    "rounded-pentagon",
  ];

  const estimateLines =
    program.split(" ").length + location.split(" ").length + 1;

  let shapePool = allShapes;
  if (estimateLines >= 5) {
  shapePool = ["square", "rounded-square", "circle", "multi-edge-circle"];
} else if (estimateLines >= 4) {
  shapePool = ["rectangle", "rounded-rectangle", "square", "rounded-square"];
}

  const [shape] = useState(() => randomFromArray(shapePool));
  const [rotation] = useState(() => randomInt(-45, 45));
  const [font] = useState(() => getRandomFont());

  // measure panel width
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelWidth, setPanelWidth] = useState(800);

  useEffect(() => {
    const updateWidth = () => {
      if (panelRef.current) {
        setPanelWidth(panelRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // position logic that updates on resize
  const [position, setPosition] = useState<{ top: number; left: number; zIndex: number } | null>(null);

  useEffect(() => {
    let tries = 0;
    let topTry = 0;
    let leftTry = 0;
    let finalZ = randomInt(1, 10);

    while (tries < 30) {
      topTry = randomInt(-7, panelHeight - -7);
      leftTry = randomInt(10, panelWidth - 120);
      const tooClose = usedPositions.some(
        (pos) =>
          Math.abs(pos.top - topTry) < 50 && Math.abs(pos.left - leftTry) < 50
      );
      if (!tooClose) {
        usedPositions.push({ top: topTry, left: leftTry });
        setPosition({ top: topTry, left: leftTry, zIndex: finalZ });
        return;
      }
      tries++;
    }
    // fallback
    setPosition({
      top: randomInt(10, 100),
      left: randomInt(10, panelWidth - 120),
      zIndex: finalZ,
    });
  }, [panelWidth, panelHeight]);

  const measureRef = useRef<SVGTextElement>(null);
  const [programLines, setProgramLines] = useState<string[]>([]);
  const [locationLines, setLocationLines] = useState<string[]>([]);
  const [shapeScale, setShapeScale] = useState(1);
  const [blockGap, setBlockGap] = useState(10);

  const matchedProgram = Object.values(programMap).find(
    (p) =>
      p.program.toLowerCase() === program.toLowerCase() &&
      p.location.toLowerCase() === location.toLowerCase() &&
      p.year === year
  );
  const programSlug = matchedProgram?.slug ?? "";

  useEffect(() => {
    if (!measureRef.current) return;

    const measureTextWidth = (text: string) => {
      measureRef.current!.textContent = text;
      return measureRef.current!.getComputedTextLength();
    };

    const chunkWords = (words: string[], maxPx: number) => {
      const lines: string[] = [];
      let line = "";
      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        const w = measureTextWidth(testLine);
        if (w <= maxPx) {
          line = testLine;
        } else {
          if (line) lines.push(line);
          line = word;
        }
      }
      if (line) lines.push(line);
      return lines;
    };

    let currentScale = 1.2;
    let currentBlockGap = 6;
    const lineGap = 14;
    const sideBuffer = 10;
    const topBuffer = 6;
    const bottomBuffer = 12;

    const safeZoneByShape: Record<string, { width: number; height: number }> = {
      circle: { width: 70, height: 70 },
      "multi-edge-circle": { width: 70, height: 70 },
      square: { width: 80, height: 80 },
      "rounded-square": { width: 80, height: 80 },
      rectangle: { width: 100, height: 40 },
      "rounded-rectangle": { width: 100, height: 40 },
      hexagon: { width: 70, height: 70 },
      "rounded-hexagon": { width: 70, height: 70 },
      pentagon: { width: 70, height: 70 },
      "rounded-pentagon": { width: 70, height: 70 },
    };
    const safeZone = safeZoneByShape[shape];

    let chunkedProgram: string[] = [];
    let chunkedLocation: string[] = [];
    let blockHeight = 0;

    for (let attempt = 0; attempt < 20; attempt++) {
      chunkedProgram = chunkWords(
        program.toUpperCase().split(" "),
        safeZone.width * currentScale - sideBuffer * 2
      );
      chunkedLocation = chunkWords(
        location.split(" "),
        safeZone.width * currentScale - sideBuffer * 2
      );

      const totalLines = chunkedProgram.length + chunkedLocation.length + 1;
      blockHeight =
        totalLines * lineGap +
        currentBlockGap * 2 +
        topBuffer +
        bottomBuffer;

      const widestLine = Math.max(
        ...chunkedProgram.map((l) => measureTextWidth(l)),
        ...chunkedLocation.map((l) => measureTextWidth(l)),
        measureTextWidth(year.toString())
      );

      if (
        blockHeight > safeZone.height * currentScale ||
        widestLine > safeZone.width * currentScale
      ) {
        if (attempt % 2 === 0 && currentBlockGap > 2) {
          currentBlockGap -= 2;
        } else if (currentScale < 4.0) {
          currentScale += 0.1;
        } else {
          console.warn("Could not fit text after max attempts");
          break;
        }
      } else {
        break;
      }
    }

    setProgramLines(chunkedProgram);
    setLocationLines(chunkedLocation);
    setShapeScale(currentScale);
    setBlockGap(currentBlockGap);
  }, [program, location, year, shape]);

  const lineGap = 14;
  const topBuffer = 6;
  const bottomBuffer = 12;
  const totalLines = programLines.length + locationLines.length + 1;
  const blockHeight =
    totalLines * lineGap + blockGap * 2 + topBuffer + bottomBuffer;
  const startY = 50 - blockHeight / 2 + lineGap + topBuffer;

  return (
    <div
      className="stamp-wrapper"
      ref={panelRef}
      onMouseEnter={() => setHoveredSlug(mySlug)}
      onMouseLeave={() => setHoveredSlug(null)}
    >
      <Link href={programSlug ? `/programs/${programSlug}` : "#"} passHref>
        <svg
          width="20vw"
          height="20vw"
          viewBox="0 0 100 100"
          style={{
            maxWidth: "175px",
            maxHeight: "135px",
            position: "absolute",
            top: position?.top ?? 0,
            left: position?.left ?? 0,
            overflow: "visible",
            zIndex: position?.zIndex ?? 1,
            cursor: programSlug ? "pointer" : "default",
            transition: "all 0.3s ease",
            opacity: hoveredSlug && hoveredSlug !== mySlug ? 0.33 : 1,
            transform:
              hoveredSlug === mySlug
                ? "scale(1.1)"
                : "scale(1)",
          }}
        >
          <text
            ref={measureRef}
            style={{ visibility: "hidden" }}
            fontFamily={font}
            fontSize="14px"
          >
            measure
          </text>

          <g transform={`rotate(${rotation},50,50)`}>
            <g
              transform={`translate(50 50) scale(${shapeScale}) translate(-50 -50)`}
            >
              <ShapePath shape={shape} color={color} />
            </g>

            <text
              x="50"
              y={startY}
              fontFamily={font}
              fontSize="14px"
              fontWeight="bold"
              fill={color}
              textAnchor="middle"
            >
              {programLines.map((line, idx) => (
                <tspan x="50" dy={idx === 0 ? 0 : lineGap} key={`prog-${idx}`}>
                  {line}
                </tspan>
              ))}
            </text>

            <text
              x="50"
              y={startY + programLines.length * lineGap + blockGap}
              fontFamily={font}
              fontSize="12px"
              fontStyle="italic"
              fill={color}
              textAnchor="middle"
            >
              {locationLines.map((line, idx) => (
                <tspan x="50" dy={idx === 0 ? 0 : lineGap} key={`loc-${idx}`}>
                  {line}
                </tspan>
              ))}
            </text>

            <text
              x="50"
              y={
                startY +
                programLines.length * lineGap +
                blockGap +
                locationLines.length * lineGap +
                blockGap
              }
              fontFamily={font}
              fontSize="12px"
              fontWeight="bold"
              fill={color}
              textAnchor="middle"
            >
              {year}
            </text>
          </g>
        </svg>
      </Link>
    </div>
  );
}
