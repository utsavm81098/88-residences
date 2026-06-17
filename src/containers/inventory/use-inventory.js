import { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetBuilding } from "@/store/slices/building-slice";
import { useIsMobile } from "@/hooks/use-mobile";
import useBottomMenuHeight from "@/hooks/use-bottom-menu-height";
import { useGLTF } from "@react-three/drei";

/**
 * Container hook for Inventory component business logic.
 */
export const useInventory = () => {
  const dispatch = useDispatch();
  const { snapHeight } = useSelector((state) => state.building);
  const isMobile = useIsMobile();
  const controlsRef = useRef();
  const modelRef = useRef();

  const { bottomMenuHeight: combinedBottomHeight } = useBottomMenuHeight(120, [
    "bottomMenu",
    "mobileTopBar",
  ]);

  const handleResetCamera = () => {
    dispatch(resetBuilding());
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleResetCache = () => {
    useGLTF.clear();
  };

  const canvasHeight = isMobile
    ? `calc(100% - ${snapHeight + combinedBottomHeight}px)`
    : "100%";

  return {
    controlsRef,
    modelRef,
    canvasHeight,
    handleResetCamera,
    handleResetCache,
  };
};

export default useInventory;
