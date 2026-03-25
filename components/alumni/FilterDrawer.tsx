"use client";

import React from "react";
import { filterConfig } from "@/utils/filterConfig";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFilters: Record<string, string[]>;
  onFilterChange: (id: string, value: string) => void;
  onApply: () => void;
  onClear: () => void;
}

export default function FilterDrawer({
  isOpen,
  onClose,
  selectedFilters,
  onFilterChange,
  onApply,
  onClear,
}: FilterDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "white",
        zIndex: 1000,
        padding: "20px",
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2 style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontSize: "1.8rem" }}>Filters</h2>
        <button onClick={onClose} style={{ fontSize: "1.5rem" }}>
          ✕
        </button>
      </div>

      {filterConfig.map((filter) => (
        <div key={filter.id} style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", marginBottom: "0.5rem" }}>{filter.label}</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {filter.options.map((option) => {
              const isSelected = selectedFilters[filter.id]?.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => onFilterChange(filter.id, option.value)}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    backgroundColor: isSelected ? "#FFCC00" : "white",
                    fontWeight: isSelected ? "bold" : "normal",
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem" }}>
        <button onClick={onClear} style={{ padding: "10px 15px", background: "#ccc" }}>
          Clear All
        </button>
        <button onClick={onApply} style={{ padding: "10px 15px", background: "#FFCC00" }}>
          Apply Filters
        </button>
      </div>
    </div>
  );
}
