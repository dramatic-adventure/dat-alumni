// prisma.config.ts
//
// `dotenv/config` alone only loads `.env` — and `.env`'s DATABASE_URL is a
// stale `file:./dev.db` placeholder left over from before the move to Neon
// (see CLAUDE.md). The real connection string lives in `.env.local`, so load
// that first; dotenv doesn't override a var that's already set, so `.env.local`
// wins and `.env` only fills in anything missing (mirrors
// scripts/setup-email-secrets.ts's loading order).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback to .env for anything not in .env.local
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
