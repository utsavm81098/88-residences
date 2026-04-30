import { useCallback, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  nextBuilding,
  prevBuilding,
  setBuilding,
  clearSelectedUnit,
  selectBuildingUnits,
} from "@/store/slices/building-slice";
import useToggleState from "@/hooks/use-toggle-state";
import { useClickOutside } from "@/hooks/use-click-outside";

export const useTopNavigation = () => {
  const dispatch = useDispatch();
  const { currentBuilding } = useSelector((state) => state.building);
  const buildingUnits = useSelector(selectBuildingUnits);
  const { state: isMenuOpen, open, close, set: setMenuOpen } = useToggleState(false);

  const menuRef = useRef(null);

  useClickOutside(menuRef, () => {
    if (isMenuOpen) {
      close();
    }
  });

  const handleNext = useCallback(() => {
    dispatch(nextBuilding());
    dispatch(clearSelectedUnit());
  }, [dispatch]);

  const handlePrev = useCallback(() => {
    dispatch(prevBuilding());
    dispatch(clearSelectedUnit());
  }, [dispatch]);

  const handleSelect = useCallback(
    (index) => {
      dispatch(setBuilding(index));
      dispatch(clearSelectedUnit());
    },
    [dispatch],
  );

  const onToggleMenu = useCallback((open) => {
    setMenuOpen(open);
  }, [setMenuOpen]);

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
