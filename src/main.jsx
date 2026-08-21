import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AppProviders from "./app.jsx";
import { Provider } from "react-redux";
import { store } from "@/store";
import { initPromise } from "@/i18n";
import {
  preloadModels,
  configureLoader,
  whenKTX2Ready,
} from "@/utils/preloader";
import { preloadGLB } from "@/hooks/use-glb-loader";
import { getHomeModelPath } from "@/utils/constant";
import { WEB_ROUTES } from "@/routes/routes";

const isLandingOnInventory =
  typeof window !== "undefined" &&
  window.location.pathname.endsWith(`/${WEB_ROUTES.landing.path}`);

if (typeof window !== "undefined") {
  const scheduleIdlePreload = window.requestIdleCallback
    ? (cb) => window.requestIdleCallback(cb, { timeout: 4000 })
    : (cb) => setTimeout(cb, 1500);

  // Constrained devices (mobile/tablet, or a desktop with a known-weak GPU —
  // see getDeviceTier() in utils/constant.js) skip every CROSS-ROUTE preload
  // below. Warming the OTHER route's heaviest asset ahead of need costs real,
  // long-lived memory well before any GPU is involved: KTX2/Basis textures
  // are transcoded to raw pixel buffers at PARSE time, not upload time, so
  // merely preloading the home masterplan model retains on the order of
  // ~350MB of JS/WASM heap (measured) for the rest of the session — on a
  // device whose whole browser tab shares ONE memory budget across JS heap,
  // decoded textures, AND GPU VRAM. Confirmed contributor to the iPhone 11
  // crash, independent of the keep-alive GPU-VRAM issue already fixed in
  // use-keep-alive-outlet.js. Mirrors the same guard already used in
  // use-home.js and use-building.js for the equivalent background-building
  // preload. The CURRENT route's own required asset (preloadModels() in the
  // isLandingOnInventory branch below) is never skipped — only warming the
  // OTHER route ahead of need is optional.
  if (isLandingOnInventory) {
    preloadModels();

    scheduleIdlePreload(() => {
      whenKTX2Ready().then(() =>
        preloadGLB(getHomeModelPath(), configureLoader),
      );
    });
  } else {
    scheduleIdlePreload(preloadModels);
  }
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
