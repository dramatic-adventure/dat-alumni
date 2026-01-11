// lib/prisma.ts
import path from "path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import {
  PrismaClient,
  ContextType,
  AmountType,
  DonationKind,
  PaymentStatus,
} from "../generated/prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function normalizeSqliteUrl(raw?: string) {
  if (!raw) return null;
  // If someone sets DATABASE_URL="file:./dev.db?connection_limit=1", strip the query.
  const [base] = raw.split("?");
  return base;
}

const envUrl = normalizeSqliteUrl(process.env.DATABASE_URL);

// Always anchor to the project root to avoid “different cwd” surprises.
const defaultUrl = `file:${path.join(process.cwd(), "dev.db")}`;
const url = envUrl ?? defaultUrl;

// Adapter: url-based (no need to manually instantiate better-sqlite3 Database)
const adapter = new PrismaBetterSqlite3(
  { url },
  // Optional: leave default timestampFormat unless you *really* need unixepoch-ms
  // { timestampFormat: "iso8601" }
);

export const prisma = global.__prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

// ✅ Re-export Prisma enums so app code can import from "@/lib/prisma"
export { ContextType, AmountType, DonationKind, PaymentStatus };
