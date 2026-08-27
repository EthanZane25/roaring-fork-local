import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Supabase is currently used without generated Database types. Keep this
      // visible as technical debt without failing CI while TypeScript remains strict.
      "@typescript-eslint/no-explicit-any": "warn"
    }
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"])
]);
