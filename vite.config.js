// defineConfig imported from "vitest/config", NOT plain "vite" — this file
// mixes the two config shapes: a Vite UserConfig plus a Vitest `test` block.
// Vite's own defineConfig types its argument as plain Vite UserConfig, which
// has no `test` field, so TypeScript (VS Code's JS language service infers
// this even without an explicit checkJs) flags `test: {...}` below as an
// unknown/excess property. vitest/config's defineConfig is functionally
// IDENTICAL at runtime (verified against the installed package: both are
// simple identity functions, `(config) => config` — this changes zero
// behavior) but its accompanying .d.ts augments Vite's own UserConfig
// interface (`declare module "vite" { interface UserConfig { test?: ... } }`)
// to include `test`, which is what actually clears the diagnostic.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    react({
      jsxRuntime: "automatic",
    }),
    // Replicates Upress NGINX rules locally for dev/preview servers
    {
      name: "dashboard-spa-fallback",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url && /^\/dashboard-[a-z]{2}(\/|$)/i.test(req.url)) {
            if (req.url.match(/\.\w+($|\?)/)) {
              req.url = req.url.replace(/^\/dashboard-[a-z]{2}\//i, "/");
            } else {
              req.url = "/index.html";
            }
          }
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url && /^\/dashboard-[a-z]{2}(\/|$)/i.test(req.url)) {
            if (req.url.match(/\.\w+($|\?)/)) {
              req.url = req.url.replace(/^\/dashboard-[a-z]{2}\//i, "/");
            } else {
              req.url = "/index.html";
            }
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: "build",
    // -------------------------------------------------------------
    // Performance Optimizations: Code Splitting & Vendor Chunks
    // -------------------------------------------------------------
    chunkSizeWarningLimit: 1000, // Raises warning limit for 3D engine chunks
    rollupOptions: {
      output: {
        // REAL PRODUCTION BUG FIXED HERE, not a style cleanup — this used to
        // also split a "vendor-react" bucket (id.includes("react") ||
        // id.includes("react-dom") || id.includes("react-router")) away from
        // a "vendor-libs" catch-all for everything else. That looks like a
        // clean 3-way split but isn't: `id.includes("react")` matches far
        // more than the react/react-dom/react-router core — it also catches
        // react-redux, react-hook-form, react-i18next, every
        // @radix-ui/react-* package, anything with "react" anywhere in its
        // node_modules path — none of which are actually core React, and
        // several of which depend on packages that DON'T match "react"
        // (@reduxjs/toolkit, redux, i18next, ...) and so landed in
        // "vendor-libs" instead. The result, confirmed by inspecting the
        // actual built output: vendor-react's own top-level code imported
        // from vendor-libs, AND vendor-libs' top-level code imported from
        // vendor-react — a genuine two-way chunk dependency. ES modules
        // resolve a circular import graph with LIVE bindings, not
        // guaranteed-initialized ones: whichever chunk the engine happens
        // to evaluate second sees the other's still-pending exports as
        // undefined at the exact point its own top-level code runs — which
        // is exactly what produced "Cannot read properties of undefined
        // (reading 'useLayoutEffect')" in production (`vite preview`; dev
        // mode doesn't use this manualChunks path at all, which is why it
        // wasn't caught earlier). Reproduced and verified by reverting only
        // this split and confirming the cycle disappears from the build
        // output.
        //
        // The three.js split below is kept: `three` / `@react-three/fiber` /
        // `@react-three/drei` are a large, genuinely cohesive dependency
        // graph whose only real external dependency is React itself (still
        // bundled with everything else here, so no cross-chunk cycle risk),
        // and it's the single biggest win for caching this app's heaviest,
        // least-often-changing dependency separately from app code.
        manualChunks(id) {
          if (
            id.includes("node_modules") &&
            (id.includes("three") ||
              id.includes("@react-three/fiber") ||
              id.includes("@react-three/drei"))
          ) {
            return "vendor-three";
          }
          // Everything else — including react/react-dom/react-router and
          // every other node_modules package — is left for Rollup's own
          // automatic chunking, which computes chunk boundaries from the
          // real import graph and cannot produce a cycle the way a
          // string-matching heuristic can.
        },
      },
    },
  },
  optimizeDeps: {
    include: ["three", "@react-three/fiber", "@react-three/drei"],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.js"],
    include: ["src/**/*.test.{js,jsx}"],
  },
});
