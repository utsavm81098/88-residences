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
import { HOME_MODEL_PATH } from "@/utils/constant";
import { WEB_ROUTES } from "@/routes/routes";

const isLandingOnInventory =
  typeof window !== "undefined" &&
  window.location.pathname.endsWith(`/${WEB_ROUTES.landing.path}`);

if (typeof window !== "undefined") {
  const scheduleIdlePreload = window.requestIdleCallback
    ? (cb) => window.requestIdleCallback(cb, { timeout: 4000 })
    : (cb) => setTimeout(cb, 1500);

  if (isLandingOnInventory) {
    preloadModels();

    // Mirror of the branch below: warm the OTHER route's asset on idle so the
    // first Inventory -> Home switch is as fast as every switch after it.
    // Under containers/keep-alive-outlet the home <Canvas> stays alive once
    // visited, so this download is paid at most once per session.
    //
    // Gated on whenKTX2Ready(): the home GLB carries KHR_texture_basisu
    // textures and this parse happens outside any <Canvas>, so KTX2Loader has
    // no renderer to detect format support against until the inventory canvas
    // mounts <KTX2Init />. See utils/preloader.js.
    scheduleIdlePreload(() => {
      whenKTX2Ready().then(() => preloadGLB(HOME_MODEL_PATH, configureLoader));
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
