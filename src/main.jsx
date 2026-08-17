import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AppProviders from "./app.jsx";
import { Provider } from "react-redux";
import { store } from "@/store";
import { initPromise } from "@/i18n";
import { preloadModels } from "@/utils/preloader";
import { WEB_ROUTES } from "@/routes/routes";

// preloadModels() fetches the Inventory landing building's GLB + hitbox + EXR
// — assets the Home route never uses. Firing it unconditionally here used to
// mean every Home page load competed with those requests for network/CPU/
// GPU-upload time on the very low-end/slow-network devices this app targets,
// and (before the byte-level progress rewrite in use-glb-loader.js) also fed
// THREE.DefaultLoadingManager extra request batches that made the Home
// loading bar's progress reset mid-download.
//
// Only landing directly on Inventory warrants preloading it eagerly; from
// every other route it's still useful to have warm for a later navigation,
// just not at the expense of whatever route the user actually opened.
const isLandingOnInventory =
  typeof window !== "undefined" &&
  window.location.pathname.endsWith(`/${WEB_ROUTES.landing.path}`);

if (isLandingOnInventory) {
  preloadModels();
} else if (typeof window !== "undefined") {
  const scheduleIdlePreload = window.requestIdleCallback
    ? (cb) => window.requestIdleCallback(cb, { timeout: 4000 })
    : (cb) => setTimeout(cb, 1500);
  scheduleIdlePreload(preloadModels);
}



const root = createRoot(document.getElementById("root"));

/**
 * Wait for i18n to be fully initialised before mounting React.
 */
initPromise.finally(() => {
  root.render(
    <StrictMode>
      <Provider store={store}>
        <AppProviders />
      </Provider>
    </StrictMode>,
  );
});
