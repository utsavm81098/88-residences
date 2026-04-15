import { useMemo, useCallback } from "react";
import { useDispatch } from "react-redux";
import { BUILDING_CONFIG } from "@/utils/constant";
import { 
  setBuilding,
  clearSelectedUnit 
} from "@/store/slices/building-slice";
import useInventory from "@/hooks/use-inventory";

export const useFilterOverlay = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  
  const {
    filters,
    allFilteredUnits,
    toggleFilter,
    clearFilters,
    activeFiltersCount
  } = useInventory();

  // Handle "Show Apartments" click
  const handleApplyFilters = useCallback(() => {
    if (filters.buildings) {
      const buildingName = filters.buildings;
      const configIndex = BUILDING_CONFIG.findIndex(b => b.name === buildingName);
      if (configIndex !== -1) {
        dispatch(setBuilding(configIndex));
        dispatch(clearSelectedUnit());
      }
    }
    onClose();
  }, [dispatch, filters.buildings, onClose]);

  const buildings = useMemo(() => Array.from(new Set(BUILDING_CONFIG.map((b) => b.name))), []);

  return {
    selectedFilters: filters,
    toggleFilter,
    handleClearAll: clearFilters,
    handleApplyFilters,
    filteredCount: allFilteredUnits.length,
    activeFiltersCount,
    buildings,
  };
};

export default useFilterOverlay;
