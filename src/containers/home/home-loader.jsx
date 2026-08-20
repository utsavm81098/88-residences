import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import HeroCarousel from "@/components/ui/hero-carousel";
import MinimalLoader from "@/components/ui/minimal-loader";
import { HOME_LOADER_SLIDES } from "@/utils/constant";
import { cn } from "@/lib/utils";

// Module-scope, not component state: this has to survive HomeLoader's own
// remounts. On mobile/weak-GPU-desktop (containers/keep-alive-outlet's
// mobileDisplayKey staggering), Home's whole container — including this
// sibling — genuinely unmounts and remounts on every Inventory switch, which
// would reset any component-local "have I shown before" flag right back to
// its initial value every single time. A plain module variable persists for
// the actual lifetime that matters here: this page load / tab session, reset
// only by an actual reload — never by a route-driven remount.
let hasShownFullLoaderOnce = false;

/**
 * HomeLoader - Full-screen loader for the Home Page, covering the canvas
 * while the 3D GLB model downloads, parses and its shaders compile, then
 * fading out to reveal the 3D Masterplan scene the moment isReady is true.
 *
 * `isReady` is the right signal to reveal on: it comes from
 * features/scene-ready-gate, which fires only after the bytes have
 * downloaded, the GLB has parsed, gl.compile() has finished and one frame has
 * elapsed. There is no byte-progress readout by design — the imagery is the feedback.
 *
 * There are deliberately NO timers in this component. It never delays the reveal by
 * even a frame: the fade starts the instant isReady flips, and the overlay unmounts
 * on the fade's own `transitionend` rather than on a setTimeout guessed to match
 * duration-700. A timer here would (a) hold the 3D scene behind an already-finished
 * loader and (b) silently desync the moment anyone edited the duration class.
 *
 * REAL BUG FIXED HERE, reported specifically as "mobile/tablet shows a loading
 * screen navigating Inventory -> Home; desktop doesn't": desktop doesn't reload
 * at all (Home's <Canvas> stays mounted permanently once visited — see
 * containers/keep-alive-outlet), so isReady never goes false again after the
 * first time. Mobile/tablet, by design, DOES tear down and rebuild Home's
 * WebGL context on every switch — even after an earlier fix stopped re-fetching
 * the GLB from the network on that rebuild (containers/keep-alive-outlet no
 * longer evicts Home's JS-heap cache), re-linking every shader program and
 * re-uploading every texture to the fresh context still takes real,
 * unavoidable time (measured ~1-2s for this scene's 300 materials/340
 * textures) — removing that teardown entirely would reopen the exact
 * confirmed iPhone 11 crash (Home's and Inventory's WebGL contexts alive
 * simultaneously) this architecture exists to prevent, so accepting SOME
 * reveal delay on mobile/tablet isn't optional. What WAS avoidable: showing
 * the full branded day/night HeroCarousel — built for a potentially many-
 * seconds-long FIRST-ever cold load — for a routine ~1-2s repeat reveal reads
 * as "a loading screen appeared", not as a quick transition. `showFullLoader`
 * below is captured once at mount from the module-scope
 * hasShownFullLoaderOnce flag: the very first time Home ever loads this
 * session gets the full carousel; every later reveal — whatever caused it,
 * a mobile remount or a WebGL-context-loss recovery on this same instance —
 * gets components/ui/minimal-loader instead: a small rotating brand mark on
 * a plain background, not the carousel. A completely featureless background
 * for that ~1-2s window was reported as ITS OWN problem ("a few seconds of
 * black screen") — indistinguishable from the app having actually frozen,
 * since nothing on screen changes at all for that whole window. The minimal
 * loader is proof of life without being a second loading screen.
 *
 * Trade-off worth knowing: the carousel's first crossfade happens 2s in (see
 * components/ui/hero-carousel). When the GLB resolves faster than that — a repeat
 * navigation, HMR, or a warm HTTP cache, where it can resolve in well under a second
 * from the module-scope cache in hooks/use-glb-loader.js — the loader is gone before
 * the crossfade starts, so only the day still is seen. That is the intended
 * behaviour: never make the user wait on the loader.
 */
export const HomeLoader = ({ isReady = false }) => {
  const { t } = useTranslation();
  const [unmounted, setUnmounted] = useState(() => isReady);
  const [showFullLoader] = useState(() => !hasShownFullLoaderOnce);

  // If isReady becomes false (initial load or WebGL context loss / recovery),
  // immediately un-hide the loader so the infinite autoplay carousel displays while recovering.
  useEffect(() => {
    if (!isReady) {
      setUnmounted(false);
    }
  }, [isReady]);

  // Marks the module-scope flag once THIS reveal actually completes, so every
  // later mount of this component (a mobile remount, or a fresh tab reusing
  // the same page load — see the flag's own comment) renders the light
  // variant instead. Deliberately not gated on `showFullLoader`: whichever
  // variant is showing, once isReady is genuinely true the "first ever load"
  // moment has passed.
  useEffect(() => {
    if (isReady) hasShownFullLoaderOnce = true;
  }, [isReady]);

  // `unmounted` used to be a safely permanent one-way latch, because a
  // navigation away from home unmounted this component and the next visit got a
  // fresh one. Under keep-alive (containers/keep-alive-outlet) the home view
  // mounts once and never again, so the latch would be permanent for the whole
  // session — and a WebGL context loss would strand the user. useHome's
  // handleResetCache sets isReady back to false and evicts the cached GLB, but
  // this component sits OUTSIDE the ComponentErrorBoundary in
  // containers/home/index.jsx, so nothing remounts it: the scene would reload
  // behind a blank canvas with no loader at all. Re-arming on the true->false
  // edge of isReady restores the recovery path.
  useEffect(() => {
    if (!isReady && unmounted) setUnmounted(false);
  }, [isReady, unmounted]);

  const handleTransitionEnd = useCallback(
    (event) => {
      // React's onTransitionEnd is delegated, so it also catches events bubbling up
      // from descendants. Only this element's own opacity fade should unmount it.
      if (event.target !== event.currentTarget) return;
      if (event.propertyName !== "opacity") return;
      if (isReady) setUnmounted(true);
    },
    [isReady],
  );

  if (unmounted && isReady) return null;

  return (
    <div
      // role/aria-label rather than descriptive alt text on the images: while
      // loading, the two renders are decorative, so a screen reader should hear
      // "Loading" once instead of narrating both. The `loading` key already exists
      // in the en and he bundles.
      role="status"
      aria-label={t("loading", "Loading")}
      aria-hidden={isReady}
      onTransitionEnd={handleTransitionEnd}
      className={cn(
        // `fixed inset-0` deliberately, with no h-full/w-full and no 100vh:
        // inset-0 already pins all four edges, and it sidesteps the iOS
        // address-bar 100vh bug that the reference site actually has.
        //
        // z-[150] clears the nav rails in layouts/main-layout (z-[110] desktop,
        // z-[120] mobile — currently commented out, but they will return) while
        // staying well below the dialog/sheet/tooltip band at z-[1000]+.
        //
        // The light variant fades over a shorter 300ms (matching
        // containers/canvas-loader's own already-fast-reveal duration) rather
        // than the full variant's 700ms — a repeat reveal is measured in
        // ~1-2s total, so a quicker fade reads as "a blink", not a scene
        // change with its own pacing.
        "fixed inset-0 z-[150] transition-opacity ease-in-out",
        showFullLoader ? "duration-700" : "duration-300",
        isReady
          ? "pointer-events-none opacity-0"
          : "pointer-events-auto opacity-100",
      )}
    >
      {showFullLoader ? (
        <HeroCarousel slides={HOME_LOADER_SLIDES} />
      ) : (
        // Light variant: a small rotating brand mark on a plain background,
        // not the carousel. See the module comment above for why a fully
        // featureless background here was itself reported as a problem.
        <MinimalLoader />
      )}
    </div>
  );
};

export default HomeLoader;
