export const ENV_CONFIG = {
  ENVIRONMENT: import.meta.env.VITE_APP_ENV || "development",
  API_BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  PORT: import.meta.env.VITE_PORT || 3000,
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === "true",

  // Keep-alive route hosting — see
  // docs/superpowers/specs/2026-08-17-keep-alive-route-hosting-design.md
  //
  // `!== "false"`, deliberately NOT `=== "true"`: .env* is gitignored
  // (.gitignore:28) and no env file is tracked in this repo, so an opt-in
  // default would ship the feature permanently off for every checkout and CI
  // build. Set VITE_KEEP_ALIVE_ROUTES=false locally or in CI to fall back to
  // unmount-on-navigate if two live WebGL contexts ever prove too much for a
  // low-end device.
  KEEP_ALIVE_ROUTES: import.meta.env.VITE_KEEP_ALIVE_ROUTES !== "false",
};
