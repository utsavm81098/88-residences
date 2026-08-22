import { defineConfig } from "vite";
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
