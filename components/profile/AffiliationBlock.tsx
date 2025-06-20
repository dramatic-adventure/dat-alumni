"use client";
export {}; // ✅ ensure ES module scope

import React from "react";
import ProgramBadges from "@/components/alumni/ProgramBadges";
import StatusFlags from "@/components/alumni/StatusFlags";

interface AffiliationBlockProps {
  programBadges?: string[];
  statusFlags?: string[];
}

const AffiliationBlock: React.FC<AffiliationBlockProps> = ({
  programBadges = [],
  statusFlags = [],
}) => {
  if (programBadges.length === 0 && statusFlags.length === 0) return null;

  return (
    <div style={{ backgroundColor: "#C3E8C0", padding: "3rem 60px" }}>
      {programBadges.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <ProgramBadges badges={programBadges} />
        </div>
      )}
      {statusFlags.length > 0 && (
        <div className="mb-4">
          <StatusFlags flags={statusFlags} />
        </div>
      )}
    </div>
  );
};

export default AffiliationBlock;
