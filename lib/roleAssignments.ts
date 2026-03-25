export type ScopeType = "GLOBAL" | "COUNTRY" | "CLUB" | "PRODUCTION";

export type LeadRoleCode = "RTA" | "TAIR" | "MCP" | "DCL" | "BOARD"; // extend as needed

export type RoleAssignmentRow = {
  profileId: string;          // links to People sheet
  roleCode: LeadRoleCode;
  roleLabel?: string;

  scopeType: ScopeType;
  scopeKey: string;           // e.g. club.slug, countryKey ("ecuador"), "dat"

  startDate?: string;         // YYYY-MM-DD
  endDate?: string;           // YYYY-MM-DD

  statusSignifier?: string;   // e.g. "Board Member; Executive Committee"
  displayOrder?: number;
  showOnProfile?: boolean;
};
