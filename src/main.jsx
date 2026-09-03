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
  preloadDracoDecoder,
} from "@/utils/preloader";
import { preloadGLB } from "@/hooks/use-glb-loader";
import { getHomeModelManifest, getDeviceTier } from "@/utils/constant";
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
  //
  // REAL BUG FIXED HERE: despite the paragraph above, no getDeviceTier()
  // check actually existed below it — both branches ran their cross-route
  // preload unconditionally, on every device, including the exact
  // constrained ones this comment says should skip it. That's the ~350MB
  // heap hit this comment already blames for the iPhone 11 crash, paid on
  // EVERY cold load of the app root, mobile included — reported as "main.jsx
  // ... heavy load ... at initial root of React.js." The guard now actually
  // exists, matching the one use-home.js/use-building.js already have for
  // the equivalent background-building preload.
  const isHighTier = getDeviceTier() === "high";

  if (isLandingOnInventory) {
    preloadModels();

    if (isHighTier) {
      scheduleIdlePreload(() => {
        whenKTX2Ready().then(() => {
          // Warm both tier URLs the same way the single-file version warmed
          // just getHomeModelPath() — each URL is independently cached/
          // deduped by use-glb-loader.js, so a later real mount's
          // useGLBChunksLoader call resolves from cache instead of
          // re-fetching. See getHomeModelManifest in utils/constant.js.
          const manifest = getHomeModelManifest();
          preloadGLB(manifest.tier1, configureLoader);
          preloadGLB(manifest.tier2, configureLoader);
        });
      });
    }
  } else {
    // Landing on Home (the common case): kick off tier-1's fetch+parse
    // IMMEDIATELY, synchronously here — not gated behind requestIdleCallback,
    // not gated behind whenKTX2Ready(), not waiting for i18n or any React
    // mount. This is the CURRENT route's own required asset (see the
    // "never skipped" note above), so unlike the cross-route warm-ups
    // there's no reason to delay it.
    //
    // REAL GAP FIXED HERE: before this, tier1/tier2's fetch only started
    // once the ENTIRE React tree had mounted — i18n's initPromise resolving
    // (gates root.render() below), Provider/AppProviders mounting, the
    // Canvas mounting, HomeScene mounting, and ITS OWN effect
    // (use-glb-chunks-loader.js) finally firing. All of that is real,
    // measurable time in which the browser could already have been
    // downloading tier1.glb — the network and this JS bundle's own
    // fetch() call don't need to wait for any of it. preloadGLB populates
    // the exact same use-glb-loader.js cache useGLBChunksLoader reads from
    // later (keyed by URL), so the real mount resolves instantly from
    // cache instead of re-fetching — this doesn't fetch anything twice,
    // it just starts the one fetch that was always going to happen much
    // earlier.
    //
    // Safe to skip whenKTX2Ready() specifically for tier1/tier2 (unlike
    // the cross-route preload above, which does wait for it): both tier
    // bundles use plain WebP textures with Draco-compressed geometry, no
    // KHR_texture_basisu/KTX2 anywhere (see scripts/generate-tier-
    // bundles.js) — GLTFLoader only ever invokes the KTX2 loader's
    // transcode path for a file that actually declares that extension, so
    // there's nothing here that needs a live WebGLRenderer to exist first.
    // Both tier bundles now compress geometry with Draco (see
    // scripts/generate-tier-bundles.js) — start the decoder's own WASM
    // fetch+instantiate in parallel with the GLB download below, instead
    // of leaving it to lazily start only once the GLB has already fully
    // arrived and GLTFLoader.parse() reaches the first Draco primitive.
    preloadDracoDecoder();

    const manifest = getHomeModelManifest();
    preloadGLB(manifest.tier1, configureLoader);
    preloadGLB(manifest.tier2, configureLoader);

    if (isHighTier) {
      scheduleIdlePreload(preloadModels);
    }
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
