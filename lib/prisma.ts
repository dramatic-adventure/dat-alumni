import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";
import {
  ContextType,
  AmountType,
  DonationKind,
  PaymentStatus,
} from "../generated/prisma/enums";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaNeon({ connectionString });

// Reuse Prisma client in dev (prevents exhausting connections in hot reload)
export const prisma = global.__prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

// ✅ Re-export enums so app code can import from "@/lib/prisma"
export { ContextType, AmountType, DonationKind, PaymentStatus };