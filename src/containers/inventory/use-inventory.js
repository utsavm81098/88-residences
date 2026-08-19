import { useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router";
import {
  resetBuilding,
  setBuilding,
  setBuildingImmediate,
} from "@/store/slices/building-slice";
import { hideTooltip } from "@/store/slices/tooltip-slice";
import { useIsMobile } from "@/hooks/use-mobile";
import useBottomMenuHeight from "@/hooks/use-bottom-menu-height";
import { useGLTF } from "@react-three/drei";
import { BUILDING_CONFIG } from "@/utils/constant";

/**
 * Container hook for Inventory component business logic.
 */
export const useInventory = ({ active = true } = {}) => {
  const dispatch = useDispatch();
  const snapHeight = useSelector((state) => state.building.snapHeight);
  const isMobile = useIsMobile();
  const controlsRef = useRef();
  const modelRef = useRef();
  const [searchParams] = useSearchParams();
  const wasActiveRef = useRef(false);

  const { bottomMenuHeight: combinedBottomHeight } = useBottomMenuHeight(
    0,
    "bottomMenu",
  );

  // On ACTIVATION, read ?building=X from the URL (set by home-page marker
  // clicks) and pre-select the matching building so the inventory opens on the
  // right one. If no param is present, reset to Building A (index 0) so
  // visiting /inventory directly never shows a stale building.
  //
  // Keyed on the false->true activation edge, not on mount: under
  // containers/keep-alive-outlet this container mounts exactly once and is then
  // shown and hidden, so a mount-only effect would fire on the first visit and
  // never again — the building would be read from the URL once per session
  // instead of once per arrival, so navigating home and clicking a different
  // marker would open the wrong building.
  //
  // NOT fixed by this, and never was: history navigation that stays WITHIN
  // inventory (back/forward between ?building=A and ?building=C) doesn't change
  // `active`, so the guard below early-returns and the URL desyncs from the
  // shown building. That matches the previous mount-only behaviour exactly.
  //
  // The edge ref preserves the original "once per arrival" semantics: URL
  // changes made by in-page navigation WHILE the route is already active must
  // not be reapplied here, or this would fight the top-navigation building
  // switcher. That was true of the mount-only version and stays true here.
  useEffect(() => {
    if (!active) {
      wasActiveRef.current = false;
      // Tear down any live tooltip on the way out. features/building-tooltip
      // keeps a `window` mousemove listener attached for as long as the
      // tooltip is visible, and only ever hides it on orbit-drag start or mesh
      // pointer-out — neither of which can fire once this view is hidden.
      // Unmounting used to clean this up; under keep-alive nothing does, so a
      // tooltip left open while navigating away would keep a handler (and its
      // rAF) running on every pointer move over the *home* scene.
      dispatch(hideTooltip());
      return;
    }
    if (wasActiveRef.current) return;
    wasActiveRef.current = true;

    const buildingParam = searchParams.get("building");

    if (!buildingParam) {
      dispatch(setBuildingImmediate(0));
      return;
    }

    const name = buildingParam.toUpperCase();
    const index = BUILDING_CONFIG.findIndex((c) => c.name === name);
    if (index !== -1) {
      dispatch(setBuildingImmediate(index));
    }
  }, [active, searchParams, dispatch]);

  const handleResetCamera = useCallback(() => {
    dispatch(resetBuilding());
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, [dispatch]);

  const handleResetCache = useCallback(() => {
    useGLTF.clear();
  }, []);

  const totalBottomOffset = snapHeight + combinedBottomHeight;
  const canvasHeight =
    isMobile && totalBottomOffset > 0
      ? `calc(100% - ${totalBottomOffset}px)`
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
