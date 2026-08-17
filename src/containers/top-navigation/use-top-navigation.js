import { useCallback, useMemo, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams } from "react-router";
import {
  nextBuilding,
  prevBuilding,
  setBuilding,
  clearSelectedUnit,
  selectBuildingUnits,
} from "@/store/slices/building-slice";
import { BUILDING_CONFIG } from "@/utils/constant";
import useToggleState from "@/hooks/use-toggle-state";
import { useClickOutside } from "@/hooks/use-click-outside";

export const useTopNavigation = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentBuilding = useSelector(
    (state) => state.building.currentBuilding,
  );
  const currentBuildingIndex = useSelector(
    (state) => state.building.currentBuildingIndex,
  );
  const buildingUnits = useSelector(selectBuildingUnits);

  const currentBuildingIndexRef = useRef(currentBuildingIndex);
  useEffect(() => {
    currentBuildingIndexRef.current = currentBuildingIndex;
  }, [currentBuildingIndex]);

  const {
    state: isMenuOpen,
    open,
    close,
    set: setMenuOpen,
  } = useToggleState(false);

  const menuRef = useRef(null);

  useClickOutside(menuRef, () => {
    if (isMenuOpen) {
      close();
    }
  });

  const updateBuildingParam = useCallback(
    (buildingName) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("building", buildingName);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleNext = useCallback(() => {
    const idx = currentBuildingIndexRef.current ?? 0;
    const nextIndex = (idx + 1) % BUILDING_CONFIG.length;
    const nextBuildingName = BUILDING_CONFIG[nextIndex]?.name;
    dispatch(nextBuilding());
    dispatch(clearSelectedUnit());
    if (nextBuildingName) {
      updateBuildingParam(nextBuildingName);
    }
  }, [dispatch, updateBuildingParam]);

  const handlePrev = useCallback(() => {
    const idx = currentBuildingIndexRef.current ?? 0;
    const prevIndex = (idx - 1 + BUILDING_CONFIG.length) % BUILDING_CONFIG.length;
    const prevBuildingName = BUILDING_CONFIG[prevIndex]?.name;
    dispatch(prevBuilding());
    dispatch(clearSelectedUnit());
    if (prevBuildingName) {
      updateBuildingParam(prevBuildingName);
    }
  }, [dispatch, updateBuildingParam]);

  const handleSelect = useCallback(
    (index) => {
      const targetBuildingName = BUILDING_CONFIG[index]?.name;
      dispatch(setBuilding(index));
      dispatch(clearSelectedUnit());
      if (targetBuildingName) {
        updateBuildingParam(targetBuildingName);
      }
    },
    [dispatch, updateBuildingParam],
  );

  const onToggleMenu = useCallback(
    (open) => {
      setMenuOpen(open);
    },
    [setMenuOpen],
  );

  const totalApt = useMemo(() => buildingUnits.length, [buildingUnits]);

  return {
    currentBuilding,
    isMenuOpen,
    totalApt,
    buildingUnits,
    handleNext,
    handlePrev,
    handleSelect,
    onToggleMenu,
    menuRef,
  };
};

export default useTopNavigation;
