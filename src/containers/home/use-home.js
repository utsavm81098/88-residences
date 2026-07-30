import { useCallback, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useIsMobile } from "@/hooks/use-mobile";
import useBottomMenuHeight from "@/hooks/use-bottom-menu-height";
import { HOME_MODEL_PATH } from "@/utils/constant";

export const useHome = () => {
  const controlsRef = useRef();
  const isMobile = useIsMobile();
  const [isReady, setIsReady] = useState(false);

  // Below lg the bottom nav is `fixed bottom-0 ... z-[120]` (main-layout), so it
  // would sit on top of the canvas. Same approach the inventory container uses.
  const { bottomMenuHeight } = useBottomMenuHeight(52, "bottomMenu");

  const canvasHeight = isMobile
    ? `calc(100% - ${bottomMenuHeight}px)`
    : "100%";

  const handleReady = useCallback(() => setIsReady(true), []);

  // Drei's useGLTF.clear() requires the path — called bare it clears nothing.
  const handleResetCache = useCallback(() => {
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
  };
};

export default useHome;
