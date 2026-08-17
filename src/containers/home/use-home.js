import { useCallback, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import useBottomMenuHeight from "@/hooks/use-bottom-menu-height";
import { clearGLBCache, getCachedGLBScene } from "@/hooks/use-glb-loader";
import { HOME_MODEL_PATH } from "@/utils/constant";
import { disposeThreeScene } from "@/utils/preloader";

export const useHome = () => {
  const controlsRef = useRef();
  const isMobile = useIsMobile();
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);

  // Below lg the bottom nav is `fixed bottom-0 ... z-[120]` (main-layout), so it
  // would sit on top of the canvas. Same approach the inventory container uses.
  const { bottomMenuHeight } = useBottomMenuHeight(52, "bottomMenu");

  const canvasHeight = isMobile ? `calc(100% - ${bottomMenuHeight}px)` : "100%";

  const handleReady = useCallback(() => setIsReady(true), []);

  // Byte-level download/parse progress for the home GLB, bubbled up from
  // useHomeScene (inside <Canvas>) — see use-glb-loader.js.
  const handleProgress = useCallback((value) => setProgress(value), []);

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
    setProgress(0);
  }, []);

  return {
    controlsRef,
    isMobile,
    canvasHeight,
    isReady,
    progress,
    handleReady,
    handleProgress,
    handleResetCache,
  };
};

export default useHome;
