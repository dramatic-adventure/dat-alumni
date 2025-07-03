"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ShapePath from "./ShapePath";
import { randomInt, randomFromArray, getRandomFont } from "@/utils/random";
import { programMap } from "@/lib/programMap";

// store positions in module scope
const usedPositions: { top: number; left: number }[] = [];

type StampShapeProps = {
  program: string;
  location: string;
  year: number;
  color: string;
  panelHeight: number;
};

export default function StampShape({
  program,
  location,
  year,
  color,
  panelHeight,
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
  if (estimateLines >= 4) {
    shapePool = ["rectangle", "rounded-rectangle", "square", "rounded-square"];
  }

  const shape = randomFromArray(shapePool);
  const rotation = randomInt(-45, 45);

  // measure panel width instead of window
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

  // position logic with minimal overlap
  function getPositionWithMinimalOverlap() {
    let tries = 0;
    while (tries < 30) {
      const topTry = randomInt(10, panelHeight - 250);
      const leftTry = randomInt(10, panelWidth - 250);
      const tooClose = usedPositions.some(
        (pos) =>
          Math.abs(pos.top - topTry) < 80 && Math.abs(pos.left - leftTry) < 80
      );
      if (!tooClose) {
        usedPositions.push({ top: topTry, left: leftTry });
        return { top: topTry, left: leftTry };
      }
      tries++;
    }
    return { top: randomInt(10, 100), left: randomInt(10, panelWidth - 120) };
  }

  const { top, left } = getPositionWithMinimalOverlap();

  const font = getRandomFont();
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
      circle: { width: 80, height: 80 },
      "multi-edge-circle": { width: 70, height: 70 },
      square: { width: 80, height: 80 },
      "rounded-square": { width: 80, height: 80 },
      rectangle: { width: 85, height: 60 },
      "rounded-rectangle": { width: 85, height: 60 },
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
    <div className="stamp-wrapper" ref={panelRef}>
      <Link href={programSlug ? `/programs/${programSlug}` : "#"} passHref>
        <svg
          width="20vw"
          height="20vw"
          viewBox="0 0 100 100"
          style={{
            maxWidth: "175px",
            maxHeight: "135px",
            position: "absolute",
            top,
            left,
            overflow: "visible",
            zIndex: randomInt(1, 10),
            cursor: programSlug ? "pointer" : "default",
            transition: "all 0.3s ease",
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
