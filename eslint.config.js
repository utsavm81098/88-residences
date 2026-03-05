import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "node_modules", "build"]),

  {
    files: ["**/*.{js,jsx}"],

    extends: [
      js.configs.recommended,

      // React
      react.configs.flat.recommended,
      react.configs.flat["jsx-runtime"],

      // Hooks + Vite
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
    },

    settings: {
      react: {
        version: "detect", // React 19 auto detect
      },
    },

    rules: {
      "react-refresh/only-export-components": "off",
    },
  },

  /**
   * Prettier (always last)
   */
  prettierRecommended,
]);
