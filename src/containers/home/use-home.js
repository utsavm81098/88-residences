import { useCallback, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import useBottomMenuHeight from "@/hooks/use-bottom-menu-height";
import { clearGLBCache, getCachedGLBScene } from "@/hooks/use-glb-loader";
import { getDeviceTier, getHomeModelPath } from "@/utils/constant";
import { markInitialLoadComplete } from "@/store/slices/app-loader-slice";
import { getWebsiteRedirectUrl } from "@/utils/helper";
import {
  disposeThreeScene,
  startSequentialBuildingPreload,
  cancelSequentialBuildingPreload,
} from "@/utils/preloader";

export const useHome = () => {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const controlsRef = useRef();
  const isMobile = useIsMobile();
  const [isReady, setIsReady] = useState(false);
  const [isContactOpen, setContactOpen] = useState(false);

  const handleOpenContact = useCallback(() => {
    setContactOpen(true);
  }, []);

  // Compute language-aware external redirect destination
  const redirectUrl = useMemo(
    () => getWebsiteRedirectUrl(i18n),
    [i18n?.language],
  );

  const handleRedirect = useCallback(
    (e) => {
      e?.preventDefault();
      e?.stopPropagation();

      if (typeof window === "undefined") return;

      try {
        if (window.top && window.top !== window) {
          window.top.location.href = redirectUrl;
          return;
        }
      } catch {
        // Fallback for cross-origin iframes
      }

      window.location.href = redirectUrl;
    },
    [redirectUrl],
  );

  // Below lg the bottom nav is `fixed bottom-0 ... z-[120]` (main-layout), so it
  // would sit on top of the canvas. Same approach the inventory container uses.
  const { bottomMenuHeight } = useBottomMenuHeight(0, "bottomMenu");

  const canvasHeight =
    isMobile && bottomMenuHeight > 0
      ? `calc(100% - ${bottomMenuHeight}px)`
      : "100%";

  const handleReady = useCallback(() => {
    setIsReady(true);

    // Feeds containers/global-loader's one-way session latch. Only meaningful
    // the very first time this fires (a direct landing on Home) — if the user
    // instead landed on Inventory first, this dispatch still fires whenever
    // Home eventually loads, but against an already-true value, so it's a
    // harmless no-op. See store/slices/app-loader-slice.js.
    dispatch(markInitialLoadComplete());

    // High tier only: background-preload every OTHER inventory building's
    // model/hitbox/env so the first switch after opening Inventory is
    // instant. Was previously unconditional — a real gap found on review:
    // features/building/use-building.js's mountBackground already
    // guarantees these buildings never mount/render on mobile/tablet/weak-
    // GPU desktop, so preloading them here (from Home, before the user has
    // even opened Inventory, let alone switched buildings) only grows JS
    // heap for data that might never be used — stacking on top of whatever
    // Home's own scene already holds resident, the same total-process-
    // memory budget an iPhone 11 crashed on. The building the user actually
    // opens still loads correctly on demand (Suspense + CanvasLoader shows
    // the real fetch) — just not pre-warmed.
    if (getDeviceTier() !== "high") return;

    if (typeof window !== "undefined" && window.requestIdleCallback) {
      window.requestIdleCallback(() => startSequentialBuildingPreload(), {
        timeout: 2000,
      });
    } else {
      setTimeout(() => startSequentialBuildingPreload(), 400);
    }
  }, [dispatch]);

  const handleResetCache = useCallback(() => {
    // getHomeModelPath() re-resolves the SAME tier decision
    // use-home-scene.js made when it first loaded the model — device
    // capability doesn't change mid-session, so this always lands on
    // whichever variant is actually cached.
    const modelPath = getHomeModelPath();
    try {
      const cachedScene = getCachedGLBScene(modelPath);
      if (cachedScene) {
        disposeThreeScene(cachedScene);
      }
    } catch {
      // Ignore if cache getter fails
    }
    clearGLBCache(modelPath);
    setIsReady(false);
  }, []);

  return {
    controlsRef,
    isMobile,
    canvasHeight,
    isReady,
    handleReady,
    handleResetCache,
    redirectUrl,
    handleRedirect,
    isContactOpen,
    setContactOpen,
    handleOpenContact,
  };
};

export default useHome;
