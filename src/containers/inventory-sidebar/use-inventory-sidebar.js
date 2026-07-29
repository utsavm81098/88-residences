import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setFilters,
  setSelectedUnit,
  setBuilding,
  clearFilters,
  selectFilteredInventory,
} from "@/store/slices/building-slice";
import { BUILDING_CONFIG } from "@/utils/constant";

export const useInventorySidebar = () => {
  const dispatch = useDispatch();
  const scrollRef = useRef(null);
  const itemRefs = useRef({});
  const {
    selectedUnit,
    filters,
    inventory,
    currentBuilding,
    loading,
    isTransitioning,
  } = useSelector((state) => state.building);
  const filteredUnits = useSelector(selectFilteredInventory);

  const [activeAccordionState, setActiveAccordionState] = useState(null);

  const activeAccordion = useMemo(() => {
    return activeAccordionState ?? [];
  }, [activeAccordionState]);

  const finalData = useMemo(() => {
    // Group back by building name for the sidebar accordion
    const grouped = filteredUnits.reduce((acc, unit) => {
      const group = unit.buildingName;
      if (!acc[group]) acc[group] = [];
      acc[group].push(unit);
      return acc;
    }, {});

    // Return as a pre-sorted array of [building, units] entries
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredUnits]);

  // Memoized Handlers
  const onFilterChange = useCallback(
    (key, value) => {
      dispatch(setFilters({ [key]: value }));
    },
    [dispatch],
  );

  const onUnitSelect = useCallback(
    (unit) => {
      if (unit.buildingName === currentBuilding.name) {
        dispatch(setSelectedUnit(unit));
      } else {
        const buildingIndex = BUILDING_CONFIG.findIndex(
          (b) => b.name === unit.buildingName,
        );
        if (buildingIndex !== -1) {
          dispatch(setBuilding(buildingIndex));
          dispatch(setSelectedUnit(unit));
        }
      }
    },
    [dispatch, currentBuilding.name],
  );

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const totalApartments = useMemo(
    () => (finalData || []).reduce((acc, [_, units]) => acc + units.length, 0),
    [finalData],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (Array.isArray(filters?.rooms)) {
      count += filters.rooms.length;
    } else if (filters?.rooms && filters.rooms !== "all") {
      count += 1;
    }

    if (Array.isArray(filters?.direction)) {
      count += filters.direction.length;
    } else if (filters?.direction && filters.direction !== "all") {
      count += 1;
    }

    if (filters?.price?.length === 2) count += 1;
    if (filters?.areas?.length === 2) count += 1;
    return count || 4;
  }, [filters]);

  // Auto-scroll to specific building when it changes
  useEffect(() => {
    if (
      !isTransitioning &&
      currentBuilding?.name &&
      itemRefs.current[currentBuilding.name]
    ) {
      const container = scrollRef.current;
      const element = itemRefs.current[currentBuilding.name];
      if (container && element) {
        container.scrollTo({
          top: element.offsetTop,
          behavior: "smooth",
        });
      }
    }
  }, [currentBuilding?.name, isTransitioning]);

  return {
    filters,
    onFilterChange,
    finalData,
    totalApartments,
    activeFilterCount,
    handleClearFilters,
    activeAccordion,
    setActiveAccordion: setActiveAccordionState,
    onUnitSelect,
    selectedUnit,
    currentBuilding,
    scrollRef,
    itemRefs,
    loading,
  };
};
