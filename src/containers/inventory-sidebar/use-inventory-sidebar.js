import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedUnit, setBuilding } from "../../store/slices/building-slice";
import { unitData, BUILDING_CONFIG } from "../../utils/constant";

// ── Static Data (Move outside to avoid re-computation) ──────────────────────
const ALL_BUILDING_NAMES = Object.keys(unitData);
const ALL_UNITS = Object.entries(unitData).flatMap(([buildingName, units]) => {
  if (!Array.isArray(units)) return [];
  return units.map((unit) => ({ ...unit, buildingName }));
});

export const useInventorySidebar = () => {
  const dispatch = useDispatch();
  const scrollContainerRef = useRef(null);

  // Redux Selectors
  const currentBuilding = useSelector((state) => state.building.currentBuilding);
  const currentBuildingIndex = useSelector((state) => state.building.currentBuildingIndex);
  const isTransitioning = useSelector((state) => state.building.isTransitioning);

  // Local State
  const [activeAccordion, setActiveAccordion] = useState(ALL_BUILDING_NAMES);
  const [pendingUnit, setPendingUnit] = useState(null);
  const [filters, setFilters] = useState({
    rooms: "all",
    type: "all",
    exposure: "all",
  });

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

  // Handle sequential unit selection after building transition
  useEffect(() => {
    if (!isTransitioning && pendingUnit) {
      dispatch(setSelectedUnit(pendingUnit));
      setPendingUnit(null);
    }
  }, [isTransitioning, pendingUnit, dispatch]);

  // Filter logic (Memoized)
  const filteredUnits = useMemo(() => {
    const { rooms, type, exposure } = filters;
    return ALL_UNITS.filter((unit) => {
      const roomMatch = rooms === "all" || unit.type?.startsWith(rooms);
      const typeMatch = type === "all" || unit.status === type;
      const exposureMatch = exposure === "all" || unit.direction?.includes(exposure);
      return roomMatch && typeMatch && exposureMatch;
    });
  }, [filters]);

  // Group filtered units by building for Accordion (Memoized)
  const groupedUnits = useMemo(() => {
    return filteredUnits.reduce((acc, unit) => {
      const group = unit.buildingName;
      if (!acc[group]) acc[group] = [];
      acc[group].push(unit);
      return acc;
    }, {});
  }, [filteredUnits]);

  // Callbacks (Memoized to prevent child re-renders)
  const handleClearFilters = useCallback(() => {
    setFilters({ rooms: "all", type: "all", exposure: "all" });
  }, []);

  const onFilterChange = useCallback((key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
  }, []);

  const onUnitSelect = useCallback((unit) => {
    const targetBuildingIndex = BUILDING_CONFIG.findIndex(
      (b) => b.name === unit.buildingName,
    );

    if (targetBuildingIndex !== -1 && targetBuildingIndex !== currentBuildingIndex) {
      // Different building: Transition first, then select
      setPendingUnit(unit);
      dispatch(setBuilding(targetBuildingIndex));
    } else {
      // Same building: Select immediately
      dispatch(setSelectedUnit(unit));
    }
  }, [currentBuildingIndex, dispatch]);

  return {
    activeAccordion,
    setActiveAccordion,
    filters,
    filteredUnits,
    groupedUnits,
    handleClearFilters,
    onUnitSelect,
    onFilterChange,
    scrollContainerRef,
  };
};
