import { useMemo, useCallback, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { 
  setSelectedUnit, 
  setBuilding,
  setFilters,
  clearFilters as clearReduxFilters 
} from "@/store/slices/building-slice";
import { BUILDING_CONFIG } from "@/utils/constant";
import { ALL_UNITS, filterUnits, getActiveFiltersCount } from "@/utils/filter-helper";

/**
 * Unified hook for inventory logic across Desktop Sidebar and Mobile Filter Overlay.
 * Manages filtering, unit selection, and grouping.
 */
export const useInventory = () => {
  const dispatch = useDispatch();

  // Redux State
  const filters = useSelector((state) => state.building.filters);
  const currentBuildingIndex = useSelector((state) => state.building.currentBuildingIndex);
  const currentBuilding = useSelector((state) => state.building.currentBuilding);
  const isTransitioning = useSelector((state) => state.building.isTransitioning);
  const selectedUnit = useSelector((state) => state.building.selectedUnit);

  // Local state for pending selection (wait for transition)
  const [pendingUnit, setPendingUnit] = useState(null);

  // 1. Filter all units globally (Memoized)
  const allFilteredUnits = useMemo(() => {
    return filterUnits(ALL_UNITS, filters);
  }, [filters]);

  // 2. Units filtered for the current active building
  const currentBuildingUnits = useMemo(() => {
    return allFilteredUnits.filter(u => u.buildingName === currentBuilding.name);
  }, [allFilteredUnits, currentBuilding.name]);

  // 3. Grouped results for the sidebar accordion
  const groupedUnits = useMemo(() => {
    return allFilteredUnits.reduce((acc, unit) => {
      const group = unit.buildingName;
      if (!acc[group]) acc[group] = [];
      acc[group].push(unit);
      return acc;
    }, {});
  }, [allFilteredUnits]);

  // 4. Count of active filters for UI badges
  const activeFiltersCount = useMemo(() => {
    return getActiveFiltersCount(filters);
  }, [filters]);

  // Handlers
  const toggleFilter = useCallback((key, value) => {
    const currentValues = filters[key];
    
    if (Array.isArray(currentValues)) {
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      dispatch(setFilters({ [key]: newValues }));
    } else {
      // For string/null filters like budget or buildings
      dispatch(setFilters({ [key]: currentValues === value ? null : value }));
    }
  }, [filters, dispatch]);

  const clearFilters = useCallback(() => {
    dispatch(clearReduxFilters());
  }, [dispatch]);

  const onUnitSelect = useCallback((unit) => {
    const targetBuildingIndex = BUILDING_CONFIG.findIndex(
      (b) => b.name === unit.buildingName,
    );

    if (targetBuildingIndex !== -1 && targetBuildingIndex !== currentBuildingIndex) {
      setPendingUnit(unit);
      dispatch(setBuilding(targetBuildingIndex));
    } else {
      dispatch(setSelectedUnit(unit));
    }
  }, [currentBuildingIndex, dispatch]);

  // Selection Sync logic
  useEffect(() => {
    if (!isTransitioning && pendingUnit) {
      dispatch(setSelectedUnit(pendingUnit));
      setPendingUnit(null);
    }
  }, [isTransitioning, pendingUnit, dispatch]);

  const mobileSelectedUnit = useSelector((state) => state.building.mobileSelectedUnit);

  return {
    // Data
    filters,
    allFilteredUnits,
    currentBuildingUnits,
    groupedUnits,
    activeFiltersCount,
    selectedUnit,
    mobileSelectedUnit,
    currentBuilding,
    
    // Handlers
    toggleFilter,
    clearFilters,
    onUnitSelect,
  };
};

export default useInventory;
