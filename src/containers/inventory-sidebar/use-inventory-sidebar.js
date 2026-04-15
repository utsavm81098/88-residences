import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { setFilters } from "../../store/slices/building-slice";
import useInventory from "../../hooks/use-inventory";
import { unitData } from "../../utils/constant";

const ALL_BUILDING_NAMES = Object.keys(unitData);

export const useInventorySidebar = () => {
  const dispatch = useDispatch();
  const scrollContainerRef = useRef(null);
  
  // Use central inventory logic
  const {
    filters,
    groupedUnits,
    allFilteredUnits,
    currentBuilding,
    onUnitSelect,
    toggleFilter,
    clearFilters,
  } = useInventory();

  // Desktop specific state
  const [activeAccordion, setActiveAccordion] = useState(ALL_BUILDING_NAMES);

  // Auto-scroll to selected building in sidebar
  useEffect(() => {
    if (currentBuilding && scrollContainerRef.current) {
      const trigger = scrollContainerRef.current.querySelector(
        `[data-building="${currentBuilding.name}"]`,
      );
      if (trigger) {
        trigger.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [currentBuilding]);

  // Map sidebar-specific "onFilterChange" to unified "toggleFilter"
  const onFilterChange = (key, value) => {
    if (value === "all") {
      // Clear the filter group
      dispatch(setFilters({ [key]: [] }));
    } else {
      // For sidebar, we usually want to REPLACE the array with a single choice
      // or implement multi-choice. The original sidebar was single-choice.
      // If we want to maintain the sidebar's single-choice behavior:
      dispatch(setFilters({ [key]: [value] }));
    }
  };

  return {
    activeAccordion,
    setActiveAccordion,
    filters,
    filteredUnits: allFilteredUnits,
    groupedUnits,
    handleClearFilters: clearFilters,
    onUnitSelect,
    onFilterChange,
    scrollContainerRef,
  };
};
