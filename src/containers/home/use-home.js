import { useCallback, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useIsMobile } from "@/hooks/use-mobile";
import useBottomMenuHeight from "@/hooks/use-bottom-menu-height";
import { HOME_MODEL_PATH } from "@/utils/constant";
import { disposeThreeScene } from "@/utils/preloader";

export const useHome = () => {
  const controlsRef = useRef();
  const isMobile = useIsMobile();
  const [isReady, setIsReady] = useState(false);
  const [showAutoRotateHint, setShowAutoRotateHint] = useState(false);

  // Below lg the bottom nav is `fixed bottom-0 ... z-[120]` (main-layout), so it
  // would sit on top of the canvas. Same approach the inventory container uses.
  const { bottomMenuHeight } = useBottomMenuHeight(52, "bottomMenu");

  const canvasHeight = isMobile ? `calc(100% - ${bottomMenuHeight}px)` : "100%";

  const handleReady = useCallback(() => setIsReady(true), []);

  // Threaded down to CameraRig's onHintVisibleChange, exactly like onReady/
  // handleReady above — the one-time drag hint's timers live in CameraRig
  // (it already owns controlsRef and the auto-rotate idle timers), but the
  // hint itself renders as a plain DOM overlay outside the Canvas, so its
  // visibility has to bubble up to here.
  const handleHintVisibleChange = useCallback(
    (visible) => setShowAutoRotateHint(visible),
    [],
  );

  // Drei's useGLTF.clear() requires the path — called bare it clears nothing.
  const handleResetCache = useCallback(() => {
    try {
      const cached = useGLTF.get?.(HOME_MODEL_PATH);
      if (cached?.scene) {
        disposeThreeScene(cached.scene);
      }
    } catch {
      // Ignore if cache getter fails
    }
    useGLTF.clear(HOME_MODEL_PATH);
    setIsReady(false);
  }, []);

  return {
    controlsRef,
    isMobile,
    canvasHeight,
    isReady,
    handleReady,
    handleResetCache,
    showAutoRotateHint,
    handleHintVisibleChange,
  };
};

export default useHome;
