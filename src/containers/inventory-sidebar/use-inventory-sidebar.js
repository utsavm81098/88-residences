import { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFilters, toggleFavorite } from "@/store/slices/building-slice";
import useInventory from "@/hooks/use-inventory";
import { unitData } from "@/utils/constant";

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

  const selectedUnit = useSelector((state) => state.building.selectedUnit);
  const favorites = useSelector((state) => state.building.favorites);

  // Desktop specific state
  const [activeAccordion, setActiveAccordion] = useState(ALL_BUILDING_NAMES);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Auto-scroll to selected building in sidebar
  useEffect(() => {
    if (currentBuilding && scrollContainerRef.current) {
      const trigger = scrollContainerRef.current.querySelector(
        `[data-building="${currentBuilding.name}"]`
      );
      if (trigger) {
        trigger.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [currentBuilding]);

  // Map sidebar-specific "onFilterChange" to unified "toggleFilter"
  const onFilterChange = (key, value) => {
    if (value === "all") {
      dispatch(setFilters({ [key]: [] }));
    } else {
      // Toggle logic or single select? 
      // Based on reference, these look like toggle buttons.
      // useInventory's toggleFilter handles the array logic.
      toggleFilter(key, value);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const onToggleFavorite = (unitId, e) => {
    e.stopPropagation();
    dispatch(toggleFavorite(unitId));
  };

  // Compute sorted units
  const sortedGroupedUnits = useMemo(() => {
    if (!sortConfig.key) return groupedUnits;

    const newGrouped = {};
    Object.keys(groupedUnits).forEach((groupName) => {
      const units = [...groupedUnits[groupName]];
      units.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        
        if (typeof valA === "number" && typeof valB === "number") {
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;
        }
        
        const strA = String(valA || "").toLowerCase();
        const strB = String(valB || "").toLowerCase();
        
        if (sortConfig.direction === "asc") {
          return strA.localeCompare(strB);
        } else {
          return strB.localeCompare(strA);
        }
      });
      newGrouped[groupName] = units;
    });
    return newGrouped;
  }, [groupedUnits, sortConfig]);

  return {
    activeAccordion,
    setActiveAccordion,
    filters,
    filteredUnits: allFilteredUnits,
    groupedUnits: sortedGroupedUnits,
    handleClearFilters: clearFilters,
    onUnitSelect,
    onFilterChange,
    scrollContainerRef,
    selectedUnit,
    favorites,
    onToggleFavorite,
    sortConfig,
    onSort: handleSort,
  };
};
