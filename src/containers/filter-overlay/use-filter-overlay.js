import { useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BUILDING_CONFIG } from "@/utils/constant";
import { 
  setBuilding,
  clearSelectedUnit,
  setFilters,
  clearFilters,
  selectFilteredInventory
} from "@/store/slices/building-slice";

export const useFilterOverlay = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { filters } = useSelector((state) => state.building);
  const allFilteredUnits = useSelector(selectFilteredInventory);
  
  const onFilterChange = useCallback(
    (key, value) => {
      dispatch(setFilters({ [key]: value }));
    },
    [dispatch],
  );

  // Handle "Show Apartments" click
  const handleApplyFilters = useCallback(() => {
    if (filters.buildings) {
      const buildingName = filters.buildings;
      const configIndex = BUILDING_CONFIG.findIndex(
        (b) => b.name === buildingName,
      );
      if (configIndex !== -1) {
        dispatch(setBuilding(configIndex));
        dispatch(clearSelectedUnit());
      }
    }
    onClose();
  }, [dispatch, filters.buildings, onClose]);

  const handleClearAll = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const buildings = useMemo(() => Array.from(new Set(BUILDING_CONFIG.map((b) => b.name))), []);

  return {
    selectedFilters: filters,
    onFilterChange,
    handleClearAll,
    handleApplyFilters,
    filteredCount: allFilteredUnits.length,
    buildings,
  };
};

export default useFilterOverlay;
