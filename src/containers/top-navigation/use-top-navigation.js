import { useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  nextBuilding,
  prevBuilding,
  setBuilding,
  toggleMenu,
  clearSelectedUnit,
} from "../../store/slices/building-slice";
import { unitData } from "../../utils/constant";

export const useTopNavigation = () => {
  const dispatch = useDispatch();
  const { currentBuilding, isMenuOpen } = useSelector(
    (state) => state.building,
  );

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
  };
};
