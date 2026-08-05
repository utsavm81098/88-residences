import { useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router";
import { resetBuilding, setBuilding } from "@/store/slices/building-slice";
import { useIsMobile } from "@/hooks/use-mobile";
import useBottomMenuHeight from "@/hooks/use-bottom-menu-height";
import { useGLTF } from "@react-three/drei";
import { BUILDING_CONFIG } from "@/utils/constant";

/**
 * Container hook for Inventory component business logic.
 */
export const useInventory = () => {
  const dispatch = useDispatch();
  const { snapHeight } = useSelector((state) => state.building);
  const isMobile = useIsMobile();
  const controlsRef = useRef();
  const modelRef = useRef();
  const [searchParams] = useSearchParams();

  const { bottomMenuHeight: combinedBottomHeight } = useBottomMenuHeight(
    52,
    "bottomMenu",
  );

  // On mount, read ?building=X from the URL (set by home-page marker clicks) and
  // pre-select the matching building so the inventory opens on the right one.
  // If no param is present, always reset to Building A (index 0) so visiting
  // /inventory directly never shows a stale building from a previous session.
  useEffect(() => {
    const buildingParam = searchParams.get("building");

    if (!buildingParam) {
      // No param → guarantee Building A is shown regardless of Redux state.
      dispatch(setBuilding(0));
      return;
    }

    const name = buildingParam.toUpperCase();
    const index = BUILDING_CONFIG.findIndex((c) => c.name === name);
    if (index !== -1) {
      dispatch(setBuilding(index));
    }
    // Only run once on mount — subsequent URL changes are driven by in-page nav.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
