"use client";

import React, { useEffect, useRef, useState } from "react";
import ShapePath from "./ShapePath";
import { randomInt, randomFromArray, getRandomFont } from "@/utils/random";

type StampShapeProps = {
  program: string;
  location: string;
  year: number;
  color: string;
};

export default function StampShape({
  program,
  location,
  year,
  color,
}: StampShapeProps) {
  const shapes = [
    "circle",
    "square",
    "rounded-square",
    "hexagon",
    "multi-edge-circle",
  ];
  const shape = randomFromArray(shapes);
  const rotation = randomInt(-45, 45);
  const top = randomInt(0, 300);
  const left = randomInt(0, 800);
  const font = getRandomFont();

  const measureRef = useRef<SVGTextElement>(null);

  const [programLines, setProgramLines] = useState<string[]>([]);
  const [locationLines, setLocationLines] = useState<string[]>([]);
  const [shapeScale, setShapeScale] = useState(1);
  const [blockPadding, setBlockPadding] = useState(10);

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

    let currentScale = 1.0;
    let currentBlockPadding = 10;
    const lineGap = 14;
    const safeZoneByShape: Record<string, number> = {
      circle: 80,
      square: 80,
      "rounded-square": 80,
      hexagon: 70,
      "multi-edge-circle": 65,
    };
    const safeZone = safeZoneByShape[shape];

    let chunkedProgram: string[] = [];
    let chunkedLocation: string[] = [];
    let blockHeight = 0;

    for (let attempt = 0; attempt < 15; attempt++) {
      chunkedProgram = chunkWords(program.toUpperCase().split(" "), safeZone * currentScale);
      chunkedLocation = chunkWords(location.split(" "), safeZone * currentScale);

      const totalLines = chunkedProgram.length + locationLines.length + 1;
      blockHeight =
        totalLines * lineGap + 2 * currentBlockPadding;

      if (blockHeight > safeZone * currentScale) {
        if (currentBlockPadding > 2) {
          currentBlockPadding -= 2;
        } else if (currentScale < 3.0) {
          currentScale += 0.1;
        } else {
          console.warn("Could not fit text even after maximum shape scaling and padding shrinkage.");
          break;
        }
      } else {
        break;
      }
    }

    setProgramLines(chunkedProgram);
    setLocationLines(chunkedLocation);
    setShapeScale(currentScale);
    setBlockPadding(currentBlockPadding);
  }, [program, location, shape]);

  const lineGap = 14;
  const totalLines = programLines.length + locationLines.length + 1;
  const blockHeight = totalLines * lineGap + 2 * blockPadding;
  const startY = 50 - blockHeight / 2 + lineGap;

  return (
    <svg
      width={150}
      height={150}
      viewBox="0 0 100 100"
      style={{
        position: "absolute",
        top,
        left,
        overflow: "visible",
        zIndex: randomInt(1, 10),
      }}
    >
      {/* hidden measure element */}
      <text
        ref={measureRef}
        style={{ visibility: "hidden" }}
        fontFamily={font}
        fontSize="14px"
      >
        measure
      </text>

      <g transform={`rotate(${rotation},50,50)`}>
        <g transform={`translate(50 50) scale(${shapeScale}) translate(-50 -50)`}>
          <ShapePath shape={shape} color={color} />
        </g>

        {/* Program text */}
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

        {/* Location text */}
        <text
          x="50"
          y={startY + programLines.length * lineGap + blockPadding}
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

        {/* Year */}
        <text
          x="50"
          y={
            startY +
            programLines.length * lineGap +
            blockPadding +
            locationLines.length * lineGap +
            blockPadding
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
  );
}
