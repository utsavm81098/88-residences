import { useCallback, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  nextBuilding,
  prevBuilding,
  setBuilding,
  toggleMenu,
  closeMenu,
  clearSelectedUnit,
  clearFilters,
} from "../../store/slices/building-slice";
import { unitData } from "../../utils/constant";
import { useClickOutside } from "../../hooks/use-click-outside";

export const useTopNavigation = () => {
  const dispatch = useDispatch();
  const { currentBuilding, isMenuOpen } = useSelector(
    (state) => state.building,
  );

  const menuRef = useRef(null);

  useClickOutside(menuRef, () => {
    if (isMenuOpen) {
      dispatch(closeMenu());
    }
  });

  const handleNext = useCallback(() => {
    dispatch(nextBuilding());
    dispatch(clearSelectedUnit());
    dispatch(clearFilters());
  }, [dispatch]);

  const handlePrev = useCallback(() => {
    dispatch(prevBuilding());
    dispatch(clearSelectedUnit());
    dispatch(clearFilters());
  }, [dispatch]);

  const handleSelect = useCallback(
    (index) => {
      dispatch(setBuilding(index));
      dispatch(clearSelectedUnit());
      dispatch(clearFilters());
    },
    [dispatch],
  );

  const onToggleMenu = useCallback(() => {
    dispatch(toggleMenu());
  }, [dispatch]);

  // Calculate total apts for the current building
  const buildingUnits = useMemo(() => {
    return unitData[currentBuilding.name] || [];
  }, [currentBuilding.name]);

  const totalApt = useMemo(() => {
    return buildingUnits.reduce((acc, unit) => {
      return acc + (Array.isArray(unit.name) ? unit.name.length : 1);
    }, 0);
  }, [buildingUnits]);

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
