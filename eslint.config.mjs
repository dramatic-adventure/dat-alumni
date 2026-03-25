// eslint.config.mjs
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// eslint-config-next is effectively CJS; this avoids the “undefined configs” ESM import shape issue
const next = require("eslint-config-next");

export default [
  // Global ignores (flat-config replacement for .eslintignore)
  {
    ignores: [
      "**/.next/**",
      "**/out/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/node_modules/**",
      "scripts/migrate*.{ts,js,mjs,cjs}",

      // repo-specific
      "**/public/**",
      "**/.cache/**",

      // data artifacts
      "**/*.csv",

      // don’t lint type declarations
      "**/*.d.ts",

      // generated / vendor-ish
      "**/.turbo/**",
      "**/.netlify/**",
      "**/.vercel/**",
      "**/prisma/**/generated/**",
    ],
  },

  // Next flat presets (no FlatCompat)
  // eslint-config-next exposes "flat" configs in v16+
  ...(next.configs?.["flat/recommended"] ?? []),
  ...(next.configs?.["flat/core-web-vitals"] ?? []),
  ...(next.configs?.["flat/typescript"] ?? []),

  // Optional: Node-only scripts tweaks
  {
    files: ["scripts/**/*.{js,ts,mjs,cjs}"],
    rules: {
      "no-console": "off",
    },
  },
  // Don’t lint one-off migration scripts (they’re tooling, not app code)
  {
    ignores: ["scripts/migrateProfileDataToLive.ts"],
  },
];
