import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

import importPlugin from "eslint-plugin-import";
import tseslint from "typescript-eslint";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  ...tseslint.configs.recommendedTypeChecked,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    "node_modules/**",
    "next-env.d.ts",
    "eslint.config.mjs",
    "postcss.config.mjs",
    "public/sw.js",
  ]),

  {
    plugins: {
      import: importPlugin,
      // ✅ DON'T redeclare "jsx-a11y" (Next already does)
    },
    settings: {
      "import/resolver": {
        typescript: true,
      },
    },
    rules: {
      // imports
      "import/no-unresolved": "error",
      "import/no-duplicates": "error",
      "import/order": ["error", {
        groups: ["builtin", "external", "internal", ["parent", "sibling", "index"], "type"],
        "newlines-between": "always",
        alphabetize: { order: "asc", caseInsensitive: true },
      }],

      // async safety
      "@typescript-eslint/no-floating-promises": ["error", { ignoreVoid: true }],
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: false }],

      // (these will work because the plugin exists via Next config)
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: true,
      },
    },
  },
]);
