import { useCallback, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import useBottomMenuHeight from "@/hooks/use-bottom-menu-height";
import { clearGLBCache, getCachedGLBScene } from "@/hooks/use-glb-loader";
import { HOME_MODEL_PATH } from "@/utils/constant";
import {
  disposeThreeScene,
  startSequentialBuildingPreload,
  cancelSequentialBuildingPreload,
} from "@/utils/preloader";

export const useHome = () => {
  const controlsRef = useRef();
  const isMobile = useIsMobile();
  const [isReady, setIsReady] = useState(false);

  // Below lg the bottom nav is `fixed bottom-0 ... z-[120]` (main-layout), so it
  // would sit on top of the canvas. Same approach the inventory container uses.
  const { bottomMenuHeight } = useBottomMenuHeight(0, "bottomMenu");

  const canvasHeight =
    isMobile && bottomMenuHeight > 0
      ? `calc(100% - ${bottomMenuHeight}px)`
      : "100%";

  const handleReady = useCallback(() => {
    setIsReady(true);
    // Start sequential background loading of inventory buildings only after home scene is fully ready
    if (typeof window !== "undefined" && window.requestIdleCallback) {
      window.requestIdleCallback(() => startSequentialBuildingPreload(), {
        timeout: 2000,
      });
    } else {
      setTimeout(() => startSequentialBuildingPreload(), 400);
    }
  }, []);

  const handleResetCache = useCallback(() => {
    try {
      const cachedScene = getCachedGLBScene(HOME_MODEL_PATH);
      if (cachedScene) {
        disposeThreeScene(cachedScene);
      }
    } catch {
      // Ignore if cache getter fails
    }
    clearGLBCache(HOME_MODEL_PATH);
    setIsReady(false);
  }, []);

  return {
    controlsRef,
    isMobile,
    canvasHeight,
    isReady,
    handleReady,
    handleResetCache,
  };
};

export default useHome;
